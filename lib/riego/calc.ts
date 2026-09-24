/**
 * Motor de riego: base FICHAS (especie+mes/etapa) × factores Excel
 * (suelo, edad, copa, zona, humedad). Puerto de `calc()` del HTML de
 * referencia a TypeScript, usando las mismas constantes.
 */
import { getFicha } from "@/lib/agronomy";
import {
  BALDE_L,
  EDADES_RIEGO,
  NIVELES_HUMEDAD,
  TIPOS_SUELO,
  ZONAS_RIEGO,
  copaReferencia,
  zonaRiegoDeZonaId,
  type EdadClase,
  type SueloId,
  type ZonaRiegoId,
} from "./datos";

export interface RiegoInput {
  dbKey: string;
  /** 1..12. Con desfase de zona se corre solo. */
  mes: number;
  zonaId?: number | null;
  zonaRiego?: ZonaRiegoId | null;
  suelo?: SueloId | null;
  edad?: EdadClase | null;
  /** Diámetro de copa medido (m). */
  copaM?: number | null;
  /** Nivel test bola 1..5. Default 2 (punto de riego). */
  humedad?: number | null;
  /** Etapa observada (texto libre de FICHAS.riego[].etapa). Si se omite, manda el calendario. */
  etapaObs?: string | null;
  caudalLH?: number | null;
}

export interface RiegoResultado {
  litros: number;
  litrosMin: number;
  litrosMax: number;
  cadaDias: number;
  regarHoy: boolean;
  baldes: number;
  horasGoteo: number | null;
  etapa: string;
  fuente: "calendario" | "observacion";
  detalle: string;
}

function parseRangoNumeros(texto: string): [number, number] | null {
  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)/);
  if (m) {
    const a = parseFloat(m[1].replace(",", "."));
    const b = parseFloat(m[2].replace(",", "."));
    if (Number.isFinite(a) && Number.isFinite(b)) return [Math.min(a, b), Math.max(a, b)];
  }
  const uno = texto.match(/(\d+(?:[.,]\d+)?)/);
  if (uno) {
    const v = parseFloat(uno[1].replace(",", "."));
    if (Number.isFinite(v)) return [v, v];
  }
  return null;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function mesesContiene(meses: string, mesNum: number): boolean {
  // "Ago-Sep", "Sep-Oct", "Dic-Feb" (cruza año), "Todo el año", "Ene-Dic".
  const t = meses.toLowerCase();
  if (t.includes("todo el a")) return true;
  const ab: Record<string, number> = {
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
  };
  const toks = t.match(/[a-zñ]{3,}/g) ?? [];
  const nums = toks.map((x) => ab[x.slice(0, 4) === "sept" ? "sept" : x.slice(0, 3)]).filter(Boolean) as number[];
  if (nums.length === 0) return false;
  if (nums.length === 1) return nums[0] === mesNum;
  const [a, b] = [nums[0], nums[nums.length - 1]];
  if (a <= b) return mesNum >= a && mesNum <= b;
  return mesNum >= a || mesNum <= b;
}

function basePorEspecieMes(dbKey: string, mes: number, etapaObs: string | null) {
  const ficha = getFicha(dbKey);
  if (!ficha) return null;
  // 1) Etapa observada manda sobre el calendario (coincidencia por inclusión).
  if (etapaObs) {
    const obs = etapaObs.toLowerCase();
    const etapa = ficha.riego.find(
      (r) => obs.includes(r.etapa.toLowerCase()) || r.etapa.toLowerCase().includes(obs),
    );
    if (etapa) return { etapa, fuente: "observacion" as const };
  }
  // 2) Calendario: etapa del mes → entrada de riego con esos meses.
  const cal = ficha.cal.find((c) => c.mes === MESES[mes - 1]);
  const etapaCal = cal?.etapa ?? "";
  const porMeses = ficha.riego.find((r) => mesesContiene(r.meses, mes));
  const porNombre =
    ficha.riego.find((r) =>
      etapaCal.toLowerCase().split("/").some((p) => r.etapa.toLowerCase().includes(p.trim().slice(0, 6))),
    ) ?? null;
  const etapa = porMeses ?? porNombre ?? ficha.riego[0];
  if (!etapa) return null;
  return { etapa, fuente: "calendario" as const };
}

export function calcularRiego(input: RiegoInput): RiegoResultado | null {
  const mes = Math.min(12, Math.max(1, Math.round(input.mes)));
  const suelo = TIPOS_SUELO.find((t) => t.id === (input.suelo ?? "M")) ?? TIPOS_SUELO[2];
  const edad = EDADES_RIEGO.find((e) => e.id === (input.edad ?? "adulto")) ?? EDADES_RIEGO[3];
  const zonaId: ZonaRiegoId = input.zonaRiego ?? zonaRiegoDeZonaId(input.zonaId);
  const zona = ZONAS_RIEGO.find((z) => z.id === zonaId) ?? ZONAS_RIEGO[2];
  const humedad = NIVELES_HUMEDAD.find((n) => n.n === (input.humedad ?? 2)) ?? NIVELES_HUMEDAD[1];

  const mesZona = ((mes - 1 - zona.desfase) % 12 + 12) % 12 + 1;
  const base = basePorEspecieMes(input.dbKey, mesZona, input.etapaObs ?? null);
  if (!base) return null;

  const vol = parseRangoNumeros(base.etapa.vol) ?? [20, 30];
  const diasBase = parseRangoNumeros(base.etapa.freq) ?? [7, 10];
  const ref = copaReferencia(input.dbKey);
  const copa = Math.min(12, Math.max(0.2, input.copaM ?? ref));
  const fCopa = Math.min(8, Math.max(0.2, (copa / ref) ** 2));

  const litrosMin = Math.round(vol[0] * suelo.fv * edad.factorLitros * fCopa * humedad.fv);
  const litrosMax = Math.round(vol[1] * suelo.fv * edad.factorLitros * fCopa * humedad.fv);
  const litros = Math.round((litrosMin + litrosMax) / 2);
  const cadaDias = Math.max(
    1,
    Math.round(((diasBase[0] + diasBase[1]) / 2) * suelo.fv * edad.factorDias / zona.fc),
  );

  const caudal = Math.max(0, input.caudalLH ?? 0);
  return {
    litros,
    litrosMin,
    litrosMax,
    cadaDias,
    regarHoy: humedad.regar,
    baldes: Math.round((litros / BALDE_L) * 10) / 10,
    horasGoteo: caudal > 0 ? Math.round((litros / caudal) * 10) / 10 : null,
    etapa: base.etapa.etapa,
    fuente: base.fuente,
    detalle: `${base.etapa.vol} cada ${base.etapa.freq.toLowerCase()} (base ${input.dbKey}, copa ref ${ref} m) × suelo ${suelo.fv} × edad ${edad.factorLitros} × copa ${fCopa.toFixed(2)}${humedad.fv !== 1 ? ` × humedad ${humedad.fv}` : ""} ÷ zona ${zona.fc}.`,
  };
}
