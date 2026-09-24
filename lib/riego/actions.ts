"use server";

import { createClient } from "@/lib/supabase/server";

/** Filas tal cual vienen de la Base de Datos Técnica GARDENFOOD (migración 0032). */
export interface RiegoMensualRow {
  especie: string;
  mes: number;
  etapa: string;
  diasMin: number;
  diasMax: number;
  litrosMin: number;
  litrosMax: number;
  reposo: number;
}

export interface RiegoEtapaRow {
  especie: string;
  codigo: string;
  etapaPrograma: string;
  mesesOriginales: string;
  coincideExacta: boolean;
  diasMin: number;
  diasMax: number;
  litrosMin: number;
  litrosMax: number;
}

export interface RiegoSueloRow {
  clave: string;
  nombre: string;
  tecnico: string;
  aguaMinMm: number;
  aguaMaxMm: number;
  factor: number;
  manejo: string;
}

export interface RiegoZonaRow {
  clave: string;
  nombre: string;
  dondeQueda: string;
  etoVerano: string;
  factorClima: number;
  desfase: number;
  significado: string;
}

export interface RiegoEdadRow {
  n: number;
  nombre: string;
  factorLitros: number;
  factorDias: number;
}

export interface RiegoHumedadRow {
  nivel: number;
  nombre: string;
  pctMin: number;
  pctMax: number;
  factorRiego: number;
  factorControl: number;
  significado: string;
}

export interface RiegoEspecieRow {
  especie: string;
  excelNombre: string;
  nombreCientifico: string;
  grupo: string;
  mantencionL: number;
  suelo: string;
  ph: string;
  copaRefM: number;
}

export interface RiegoBasePayload {
  mensual: RiegoMensualRow[];
  etapas: RiegoEtapaRow[];
  suelos: RiegoSueloRow[];
  zonas: RiegoZonaRow[];
  edades: RiegoEdadRow[];
  niveles: RiegoHumedadRow[];
  especie: RiegoEspecieRow | null;
}

const N = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Base de riego de una especie directo desde Postgres (tablas gf_riego_*,
 * seed literal del Excel). Sin estos datos no se calcula nada: la app no
 * inventa volúmenes ni frecuencias.
 */
export async function getRiegoBase(dbKey: string): Promise<RiegoBasePayload | null> {
  const supabase = await createClient();
  const [mensual, etapas, suelos, zonas, edades, niveles, especie] = await Promise.all([
    supabase.from("gf_riego_mensual").select("*").eq("especie", dbKey).order("mes"),
    supabase.from("gf_riego_etapas").select("*").eq("especie", dbKey).order("codigo"),
    supabase.from("gf_riego_suelos").select("*").order("clave"),
    supabase.from("gf_riego_zonas").select("*").order("clave"),
    supabase.from("gf_riego_edad").select("*").order("n"),
    supabase.from("gf_riego_humedad").select("*").order("nivel"),
    supabase.from("gf_riego_especies").select("*").eq("especie", dbKey).maybeSingle(),
  ]);

  if (mensual.error || !mensual.data?.length) return null;

  return {
    mensual: mensual.data.map((r) => ({
      especie: r.especie as string,
      mes: N(r.mes),
      etapa: r.etapa as string,
      diasMin: N(r.dias_min),
      diasMax: N(r.dias_max),
      litrosMin: N(r.litros_min),
      litrosMax: N(r.litros_max),
      reposo: N(r.reposo),
    })),
    etapas: (etapas.data ?? []).map((r) => ({
      especie: r.especie as string,
      codigo: r.codigo as string,
      etapaPrograma: r.etapa_programa as string,
      mesesOriginales: r.meses_originales as string,
      coincideExacta: Boolean(r.coincide_exacta),
      diasMin: N(r.dias_min),
      diasMax: N(r.dias_max),
      litrosMin: N(r.litros_min),
      litrosMax: N(r.litros_max),
    })),
    suelos: (suelos.data ?? []).map((r) => ({
      clave: r.clave as string,
      nombre: r.nombre as string,
      tecnico: r.tecnico as string,
      aguaMinMm: N(r.agua_min_mm),
      aguaMaxMm: N(r.agua_max_mm),
      factor: N(r.factor, 1),
      manejo: r.manejo as string,
    })),
    zonas: (zonas.data ?? []).map((r) => ({
      clave: r.clave as string,
      nombre: r.nombre as string,
      dondeQueda: r.donde_queda as string,
      etoVerano: r.eto_verano as string,
      factorClima: N(r.factor_clima, 1),
      desfase: N(r.desfase),
      significado: r.significado as string,
    })),
    edades: (edades.data ?? []).map((r) => ({
      n: N(r.n),
      nombre: r.nombre as string,
      factorLitros: N(r.factor_litros, 1),
      factorDias: N(r.factor_dias, 1),
    })),
    niveles: (niveles.data ?? []).map((r) => ({
      nivel: N(r.nivel),
      nombre: r.nombre as string,
      pctMin: N(r.pct_min),
      pctMax: N(r.pct_max),
      factorRiego: N(r.factor_riego),
      factorControl: N(r.factor_control),
      significado: r.significado as string,
    })),
    especie: especie.data
      ? {
          especie: especie.data.especie as string,
          excelNombre: especie.data.excel_nombre as string,
          nombreCientifico: especie.data.nombre_cientifico as string,
          grupo: especie.data.grupo as string,
          mantencionL: N(especie.data.mantencion_l),
          suelo: especie.data.suelo as string,
          ph: especie.data.ph as string,
          copaRefM: N(especie.data.copa_ref_m, 2),
        }
      : null,
  };
}
