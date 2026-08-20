import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mercadoPagoProvider,
  getAuthorizedPayment,
} from "@/lib/payments/mercadopago";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

// Mercado Pago notifications (IPN) arrive as GET (?topic=&id=) or POST (JSON body).
// We always respond 200 so Mercado Pago does not retry/alert.
// Topics:
//   - payment                      -> one-time sponsorship charge
//   - preapproval | subscription_preapproval        -> subscription lifecycle
//   - subscription_authorized_payment               -> each recurring charge

async function handle(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  let topic: string | undefined =
    url.searchParams.get("topic") ??
    url.searchParams.get("type") ??
    undefined;
  let id: string | undefined =
    url.searchParams.get("id") ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("resource") ??
    undefined;

  if (!topic || !id) {
    try {
      const body = (await request.json()) as {
        topic?: string;
        type?: string;
        id?: string;
        data?: { id?: string };
      };
      topic = topic ?? body.topic ?? body.type;
      id = id ?? body.id ?? body.data?.id ?? undefined;
    } catch {
      // ignore
    }
  }

  if (!topic || !id) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  if (topic.includes("authorized_payment")) {
    return await handleAuthorizedPayment(id, admin);
  }
  if (topic.includes("preapproval") || topic.includes("subscription")) {
    return await handleSubscription(id, admin);
  }
  if (topic.includes("payment")) {
    return await handlePayment(id, admin);
  }
  return NextResponse.json({ ok: true });
}

async function handlePayment(
  paymentId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let status: PaymentStatus;
  let reference: string | undefined;
  try {
    const result = await mercadoPagoProvider.getStatus(paymentId);
    status = result.status;
    const raw = (result.raw ?? {}) as { external_reference?: string };
    reference = raw.external_reference;
  } catch (err) {
    console.error("[payments/webhook] getStatus failed", err);
    return NextResponse.json({ ok: true });
  }

  if (!reference) return NextResponse.json({ ok: true });

  const { data: sponsorship, error } = await admin
    .from("gf_sponsorships")
    .select("id, payment_status")
    .eq("id", reference)
    .maybeSingle();
  if (error || !sponsorship) return NextResponse.json({ ok: true });
  if (sponsorship.payment_status === "paid") return NextResponse.json({ ok: true });

  const update: Record<string, unknown> = { payment_status: status };
  if (status === "paid") {
    update.provider_payment_id = paymentId;
    update.paid_at = new Date().toISOString();
    update.active = true;
  } else if (status === "failed") {
    update.active = false;
  }

  const { error: updateError } = await admin
    .from("gf_sponsorships")
    .update(update)
    .eq("id", reference);
  if (updateError) {
    console.error("[payments/webhook] sponsorship update failed", updateError);
  }
  return NextResponse.json({ ok: true });
}

async function handleAuthorizedPayment(
  authorizedPaymentId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let preapprovalId: string;
  try {
    const ap = await getAuthorizedPayment(authorizedPaymentId);
    preapprovalId = ap.preapprovalId;
  } catch (err) {
    console.error("[payments/webhook] getAuthorizedPayment failed", err);
    return NextResponse.json({ ok: true });
  }
  if (!preapprovalId) return NextResponse.json({ ok: true });
  return handleSubscription(preapprovalId, admin);
}

async function handleSubscription(
  subscriptionId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let raw: Record<string, unknown>;
  try {
    const result = await mercadoPagoProvider.getSubscriptionStatus(subscriptionId);
    raw = (result.raw ?? {}) as Record<string, unknown>;
  } catch (err) {
    console.error("[payments/webhook] getSubscriptionStatus failed", err);
    return NextResponse.json({ ok: true });
  }

  const mpStatus = String(raw.status ?? "pending");
  const reference = raw.external_reference
    ? String(raw.external_reference)
    : undefined;
  if (!reference) {
    // Preapproval without our external_reference; nothing to link.
    return NextResponse.json({ ok: true });
  }

  // The external_reference is our gf_subscriptions draft id.
  const { data: subRow } = await admin
    .from("gf_subscriptions")
    .select("id, user_id, plan, interval")
    .eq("id", reference)
    .maybeSingle();
  if (!subRow) return NextResponse.json({ ok: true });

  return applySubscription(
    admin,
    subRow.user_id,
    subRow.plan ?? "huertero",
    subRow.interval ?? "monthly",
    mpStatus,
    subscriptionId,
    raw.next_payment_date as string | undefined,
  );
}

async function applySubscription(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  tier: string,
  interval: string,
  mpStatus: string,
  subscriptionId: string,
  periodEnd?: string,
): Promise<NextResponse> {
  const subStatus: SubscriptionStatus =
    mpStatus === "authorized"
      ? "active"
      : mpStatus === "cancelled"
        ? "canceled"
        : mpStatus === "paused"
          ? "inactive"
          : "trialing";

  // Update the user's latest subscription draft row.
  const { data: subs } = await admin
    .from("gf_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  const subId = subs?.[0]?.id;

  if (subId) {
    const { error: subError } = await admin
      .from("gf_subscriptions")
      .update({
        status: subStatus,
        current_period_end: periodEnd ?? null,
        paid_via: "mercadopago",
        provider_subscription_id: subscriptionId,
      })
      .eq("id", subId);
    if (subError) {
      console.error("[payments/webhook] subscription update failed", subError);
    }
  }

  const profileUpdate: Record<string, unknown> = {
    subscription_status: subStatus,
    subscription_id: subscriptionId,
    payment_provider: "mercadopago",
  };
  if (subStatus === "active") profileUpdate.plan = tier;
  else if (subStatus === "canceled") profileUpdate.plan = "gratuito";

  const { error: profileError } = await admin
    .from("perfiles")
    .update(profileUpdate)
    .eq("id", userId);
  if (profileError) {
    console.error("[payments/webhook] profile update failed", profileError);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
