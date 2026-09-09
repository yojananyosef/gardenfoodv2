import { createClient } from "@/lib/supabase/server";

export interface Funnel30 {
  visitas30d: number;
  registros30d: number;
  trial: number;
  activos: number;
}

export interface Semana {
  desde: string;
  nuevos: number;
  retornados: number;
}

export interface SlotCTR {
  adUnitId: string;
  impresiones: number;
  clics: number;
  ctrPct: number | null;
}

export interface Interes {
  especieId: string;
  eventos: number;
}

export interface InsightsData {
  funnel: Funnel30;
  semanas: Semana[];
  ctrSlots: SlotCTR[];
  intereses: Interes[];
}

interface RpcFunnel {
  visitas_30d: number;
  registros_30d: number;
  trial: number;
  activos: number;
}

interface RpcSemana {
  desde: string;
  nuevos: number;
  retornados: number;
}

interface RpcSlot {
  ad_unit_id: string;
  impresiones: number;
  clics: number;
  ctr_pct: number | string | null;
}

interface RpcInteres {
  especie_id: string;
  eventos: number;
}

interface RpcInsights {
  funnel: RpcFunnel;
  semanas: RpcSemana[] | null;
  ctr_slots: RpcSlot[] | null;
  intereses: RpcInteres[] | null;
}

// Agregación en SQL (admin_insights_metrics, migración 0023): una ida,
// sin descargar filas al proceso Node.
export async function getInsights(): Promise<InsightsData> {
  const vacio: InsightsData = {
    funnel: { visitas30d: 0, registros30d: 0, trial: 0, activos: 0 },
    semanas: [],
    ctrSlots: [],
    intereses: [],
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_insights_metrics");
    if (error || !data) {
      console.error("[admin/insights] RPC admin_insights_metrics falló:", error?.message);
      return vacio;
    }

    const rpc = data as unknown as RpcInsights;

    return {
      funnel: {
        visitas30d: rpc.funnel?.visitas_30d ?? 0,
        registros30d: rpc.funnel?.registros_30d ?? 0,
        trial: rpc.funnel?.trial ?? 0,
        activos: rpc.funnel?.activos ?? 0,
      },
      semanas: (rpc.semanas ?? []).map((s) => ({
        desde: s.desde,
        nuevos: s.nuevos ?? 0,
        retornados: s.retornados ?? 0,
      })),
      ctrSlots: (rpc.ctr_slots ?? []).map((s) => ({
        adUnitId: s.ad_unit_id,
        impresiones: s.impresiones ?? 0,
        clics: s.clics ?? 0,
        ctrPct: s.ctr_pct === null || s.ctr_pct === undefined ? null : Number(s.ctr_pct),
      })),
      intereses: (rpc.intereses ?? []).map((i) => ({
        especieId: i.especie_id,
        eventos: i.eventos ?? 0,
      })),
    };
  } catch (err) {
    console.error("[admin/insights] error inesperado:", err);
    return vacio;
  }
}
