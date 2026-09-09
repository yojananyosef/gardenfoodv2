import { createClient } from "@/lib/supabase/server";
import { planAmount, type PlanTier } from "@/lib/payments/plans";

export interface Funnel {
  pending: number;
  trialing: number;
  active: number;
  canceled: number;
  inactive: number;
}

export interface ComunaCount {
  comuna: string;
  count: number;
}

export interface OverviewMetrics {
  total: number;
  gratuitos: number;
  funnel: Funnel;
  mrr: { total: number; byTier: Record<string, number> };
  activos30d: number;
  eventos24h: number;
  topComunas: ComunaCount[];
  ultimaSincronizacion: string | null;
}

interface RpcSubPorEstado {
  status: string;
  total: number;
}

interface RpcSubPorPlan {
  plan: string;
  interval: string;
  total: number;
}

interface RpcComuna {
  comuna: string;
  total: number;
}

interface RpcResult {
  total_usuarios: number;
  gratuitos: number;
  subs_por_estado: RpcSubPorEstado[] | null;
  subs_activas_por_plan: RpcSubPorPlan[] | null;
  activos_30d: number;
  eventos_24h: number;
  top_comunas: RpcComuna[] | null;
  ultima_sincronizacion: string | null;
}

// Agregación en SQL (admin_overview_metrics, migración 0022): una ida, sin
// descargas full-table a JS. Los precios MRR siguen definidos en TS (planAmount).
export async function getOverview(): Promise<OverviewMetrics> {
  const vacio: OverviewMetrics = {
    total: 0,
    gratuitos: 0,
    funnel: { pending: 0, trialing: 0, active: 0, canceled: 0, inactive: 0 },
    mrr: { total: 0, byTier: {} },
    activos30d: 0,
    eventos24h: 0,
    topComunas: [],
    ultimaSincronizacion: null,
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_overview_metrics");
    if (error || !data) {
      console.error("[admin/metrics] RPC admin_overview_metrics falló:", error?.message);
      return vacio;
    }

    const rpc = data as unknown as RpcResult;
    const funnel: Funnel = { pending: 0, trialing: 0, active: 0, canceled: 0, inactive: 0 };
    for (const { status, total } of rpc.subs_por_estado ?? []) {
      if (status in funnel) funnel[status as keyof Funnel] = total;
    }

    const mrr = { total: 0, byTier: {} as Record<string, number> };
    for (const { plan, interval, total } of rpc.subs_activas_por_plan ?? []) {
      try {
        const monto = planAmount(plan as PlanTier, interval as "monthly" | "yearly") * total;
        mrr.total += monto;
        mrr.byTier[plan] = (mrr.byTier[plan] ?? 0) + monto;
      } catch {
        // plan/interval desconocido: no se suma al MRR, pero queda en logs
        console.warn("[admin/metrics] plan/interval sin precio:", plan, interval);
      }
    }

    return {
      total: rpc.total_usuarios ?? 0,
      gratuitos: rpc.gratuitos ?? 0,
      funnel,
      mrr,
      activos30d: rpc.activos_30d ?? 0,
      eventos24h: rpc.eventos_24h ?? 0,
      topComunas: (rpc.top_comunas ?? []).map((c) => ({ comuna: c.comuna, count: c.total })),
      ultimaSincronizacion: rpc.ultima_sincronizacion,
    };
  } catch {
    return vacio;
  }
}
