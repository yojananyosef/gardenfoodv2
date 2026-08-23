import { createAdminClient } from "@/lib/supabase/admin";
import { planAmount, type PlanTier } from "@/lib/payments/plans";

export interface Funnel {
  pending: number;
  trialing: number;
  active: number;
  canceled: number;
  inactive: number;
}

export async function getTotalUsuarios(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin.from("perfiles").select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getGratuitoCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin.from("perfiles").select("id", { count: "exact", head: true }).eq("plan", "gratuito");
  return count ?? 0;
}

export async function getFunnel(): Promise<Funnel> {
  const admin = createAdminClient();
  const { data } = await admin.from("gf_subscriptions").select("status");
  const funnel: Funnel = { pending: 0, trialing: 0, active: 0, canceled: 0, inactive: 0 };
  for (const row of (data ?? []) as { status: string }[]) {
    if (row.status in funnel) (funnel as unknown as Record<string, number>)[row.status] += 1;
  }
  return funnel;
}

export async function getMRR(): Promise<{ total: number; byTier: Record<string, number> }> {
  const admin = createAdminClient();
  const { data } = await admin.from("gf_subscriptions").select("plan, interval, status").eq("status", "active");
  let total = 0;
  const byTier: Record<string, number> = {};
  for (const row of (data ?? []) as { plan: string; interval: string; status: string }[]) {
    const tier = row.plan as PlanTier;
    const interval = row.interval as "monthly" | "yearly";
    try {
      const amount = planAmount(tier, interval);
      total += amount;
      byTier[tier] = (byTier[tier] ?? 0) + amount;
    } catch {
      // ignore unknown tier
    }
  }
  return { total, byTier };
}

export async function getActive30d(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin.from("gf_analytics_events").select("user_id").gte("created_at", since).not("user_id", "is", null);
  const uniq = new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
  return uniq.size;
}

export async function getEventos24h(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("gf_analytics_events").select("id", { count: "exact", head: true }).gte("created_at", since);
  return count ?? 0;
}

export async function getTopComunas(limit = 5): Promise<{ comuna: string; count: number }[]> {
  const admin = createAdminClient();
  // Count cultivos per comuna via perfiles join
  const { data } = await admin.from("perfiles").select("comuna");
  const map = new Map<string, number>();
  for (const row of (data ?? []) as { comuna: string | null }[]) {
    if (!row.comuna) continue;
    map.set(row.comuna, (map.get(row.comuna) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([comuna, count]) => ({ comuna, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
