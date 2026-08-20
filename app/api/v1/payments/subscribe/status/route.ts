import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoProvider } from "@/lib/payments/mercadopago";
import type { SubscriptionStatus } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

function mapStatus(
  mp: string,
): { sub: SubscriptionStatus; grantsAccess: boolean } {
  switch (mp) {
    case "authorized":
      return { sub: "active", grantsAccess: true };
    case "pending":
      return { sub: "trialing", grantsAccess: true };
    case "cancelled":
      return { sub: "canceled", grantsAccess: false };
    case "paused":
      return { sub: "inactive", grantsAccess: false };
    default:
      return { sub: "trialing", grantsAccess: true };
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: draft, error: draftError } = await admin
    .from("gf_subscriptions")
    .select("id, plan, provider_subscription_id")
    .eq("user_id", user.id)
    .not("provider_subscription_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftError) {
    console.error("[payments/subscribe/status] lookup failed", draftError);
    return NextResponse.json({ error: "No pending subscription" }, { status: 404 });
  }
  if (!draft?.provider_subscription_id) {
    return NextResponse.json({ error: "No pending subscription" }, { status: 404 });
  }

  let statusResult;
  try {
    statusResult = await mercadoPagoProvider.getSubscriptionStatus(
      draft.provider_subscription_id,
    );
  } catch (err) {
    console.error("[payments/subscribe/status] getStatus failed", err);
    return NextResponse.json({ error: "Could not verify subscription" }, { status: 502 });
  }

  const { sub, grantsAccess } = mapStatus(statusResult.status);

  const { error: updateError } = await admin
    .from("gf_subscriptions")
    .update({
      status: sub,
      current_period_end: statusResult.periodEnd ?? null,
      cancel_at: statusResult.cancelAt ?? null,
      paid_via: "mercadopago",
    })
    .eq("id", draft.id);
  if (updateError) {
    console.error("[payments/subscribe/status] update failed", updateError);
  }

  const profileUpdate: Record<string, unknown> = {
    subscription_status: sub,
    subscription_id: draft.provider_subscription_id,
    payment_provider: "mercadopago",
  };
  // Pending/trialing already grants access (free_trial 14d). Active also does.
  // Only canceled/paused revoke. Keep tier for trialing.
  if (grantsAccess) profileUpdate.plan = draft.plan;
  else if (sub === "canceled") profileUpdate.plan = "gratuito";

  const { error: profileError } = await admin
    .from("perfiles")
    .update(profileUpdate)
    .eq("id", user.id);
  if (profileError) {
    console.error("[payments/subscribe/status] profile update failed", profileError);
  }

  return NextResponse.json({
    status: sub,
    grantsAccess,
    subscriptionId: draft.provider_subscription_id,
  });
}
