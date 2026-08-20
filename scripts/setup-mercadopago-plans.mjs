// Pre-creates the 6 Mercado Pago subscription plans (3 tiers x monthly/yearly)
// and stores their ids in gf_subscription_plans.
// Usage: node --env-file=.env scripts/setup-mercadopago-plans.mjs
import { createClient } from "@supabase/supabase-js";

const MP_API = "https://api.mercadopago.com";
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!MP_TOKEN) {
  console.error("MP_ACCESS_TOKEN is required");
  process.exit(1);
}

const TIERS = [
  { tier: "huertero", name: "Huertero", monthly: 9990, yearly: 99900 },
  { tier: "cosecha", name: "Cosecha", monthly: 19990, yearly: 199900 },
  { tier: "full", name: "Full", monthly: 29990, yearly: 299900 },
];

const backUrl = `${SITE_URL}/suscripcion/confirmar`;

async function createPlan({ interval, amount, name }) {
  const res = await fetch(`${MP_API}/preapproval_plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `GardenFood ${name} ${interval === "yearly" ? "anual" : "mensual"}`,
      auto_recurring: {
        frequency: interval === "yearly" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "CLP",
        free_trial: { frequency: 14, frequency_type: "days" },
      },
      back_url: backUrl,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "createPlan failed");
  return data.id;
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  for (const t of TIERS) {
    for (const interval of ["monthly", "yearly"]) {
      const amount = interval === "yearly" ? t.yearly : t.monthly;
      console.log(`Creating ${t.tier} ${interval} ($${amount})...`);
      const planId = await createPlan({
        interval,
        amount,
        name: t.name,
      });
      const { error } = await admin
        .from("gf_subscription_plans")
        .upsert(
          {
            provider: "mercadopago",
            tier: t.tier,
            interval,
            provider_plan_id: planId,
          },
          { onConflict: "provider,tier,interval" },
        );
      if (error) {
        console.error(`  insert failed: ${error.message}`);
      } else {
        console.log(`  -> ${planId}`);
      }
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
