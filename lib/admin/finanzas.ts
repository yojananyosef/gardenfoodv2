import { createAdminClient } from "@/lib/supabase/admin";
import { planAmount } from "@/lib/payments/plans";

export interface SubRow {
  id: string;
  user_id: string;
  plan: string;
  interval: string;
  status: string;
  provider_subscription_id: string | null;
  external_reference?: string | null;
  created_at: string;
}

export async function getSubscriptionsGrouped(status?: string, plan?: string, limit = 20, offset = 0) {
  const admin = createAdminClient();
  let q = admin.from("gf_subscriptions").select("id, user_id, plan, interval, status, provider_subscription_id, created_at").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (status) q = q.eq("status", status);
  if (plan) q = q.eq("plan", plan);
  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as SubRow[], error: null };
}

export async function getMRRByTier() {
  const admin = createAdminClient();
  const { data } = await admin.from("gf_subscriptions").select("plan, interval").eq("status", "active");
  const byTier: Record<string, { count: number; mrr: number }> = {};
  let total = 0;
  for (const r of (data ?? []) as { plan: string; interval: string }[]) {
    try {
      const amt = planAmount(r.plan as never, r.interval as never);
      total += amt;
      if (!byTier[r.plan]) byTier[r.plan] = { count: 0, mrr: 0 };
      byTier[r.plan].count += 1;
      byTier[r.plan].mrr += amt;
    } catch {}
  }
  return { total, byTier };
}
