import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSubscription,
} from "@/lib/payments/mercadopago";
import {
  type PlanTier,
  type BillingInterval,
  getPlan,
  planAmount,
} from "@/lib/payments/plans";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";

function parse(input: {
  tier?: unknown;
  interval?: unknown;
}): { tier: PlanTier; interval: BillingInterval } | null {
  const tier = input.tier;
  const interval = input.interval;
  if (
    (tier !== "huertero" && tier !== "cosecha" && tier !== "full") ||
    (interval !== "monthly" && interval !== "yearly")
  ) {
    return null;
  }
  return { tier, interval };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  let body: { tier?: string; interval?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parse(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "tier and interval are required (huertero|cosecha|full, monthly|yearly)",
      },
      { status: 400 },
    );
  }
  const { tier, interval } = parsed;

  const admin = createAdminClient();
  const plan = getPlan(tier);
  const amount = planAmount(tier, interval);
  const backUrl = `${SITE_URL}/suscripcion/confirmar`;

  // Draft subscription row; its id is the Mercado Pago external_reference.
  const { data: draft, error: insertError } = await admin
    .from("gf_subscriptions")
    .insert({ user_id: user.id, plan: tier, interval, status: "pending" })
    .select("id")
    .single();
  if (insertError || !draft) {
    console.error("[payments/subscribe] draft insert failed", insertError);
    return NextResponse.json(
      { error: "Could not start subscription" },
      { status: 500 },
    );
  }

  // Optional collector guard for TEST: if MP_COLLECTOR_EMAIL is set we can pre-check
  const collectorEmail = process.env.MP_COLLECTOR_EMAIL?.toLowerCase().trim();
  if (collectorEmail && email.toLowerCase() === collectorEmail) {
    await admin.from("gf_subscriptions").delete().eq("id", draft.id);
    return NextResponse.json(
      {
        error:
          "Usa un email de prueba distinto al de tu cuenta de Mercado Pago. Crea un test_user en el dashboard de MP (test_user_...@testuser.com).",
      },
      { status: 400 },
    );
  }

  let created;
  try {
    created = await createSubscription({
      externalReference: draft.id,
      payerEmail: email,
      reason: `GardenFood ${plan.name} ${interval === "yearly" ? "anual" : "mensual"}`,
      transactionAmount: amount,
      interval,
      backUrl,
      // freeTrial desactivado temporalmente: el checkout con trial + UNDEFINED SOURCE estaba siendo rechazado por risk en sandbox MLC
      freeTrialDays: undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[payments/subscribe] createSubscription failed", err);
    await admin.from("gf_subscriptions").delete().eq("id", draft.id);
    const isCollector =
      msg.toLowerCase().includes("collector") ||
      msg.toLowerCase().includes("payer and collector");
    if (isCollector) {
      return NextResponse.json(
        {
          error:
            "Usa un email de prueba distinto al de tu cuenta de Mercado Pago. Crea un test_user en el dashboard de MP (test_user_...@testuser.com) o inicia sesión con otro email.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Could not create subscription" },
      { status: 502 },
    );
  }

  const { error: updateError } = await admin
    .from("gf_subscriptions")
    .update({
      provider_subscription_id: created.subscriptionId,
      paid_via: "mercadopago",
    })
    .eq("id", draft.id);
  if (updateError) {
    console.error("[payments/subscribe] update failed", updateError);
  }

  // Record the pending subscription on the profile; the webhook upgrades the
  // plan to active once Mercado Pago authorizes the preapproval.
  const { error: profileError } = await admin
    .from("perfiles")
    .update({
      subscription_status: "pending",
      subscription_id: created.subscriptionId,
      payment_provider: "mercadopago",
    })
    .eq("id", user.id);
  if (profileError) {
    console.error("[payments/subscribe] profile update failed", profileError);
  }

  return NextResponse.json({
    status: "pending",
    subscriptionId: created.subscriptionId,
    url: created.url,
    tier,
    interval,
    amount,
  });
}
