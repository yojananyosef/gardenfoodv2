/**
 * Motor de riego puro: base 100 % Base de Datos Técnica GARDENFOOD
 * (Postgres gf_riego_*, seed literal del Excel, migración 0032) × factores
 * del mismo Excel (suelo, edad, copa, zona, humedad).
 *
 * Fórmula del Excel/HTML de referencia:
 *   litros = base × suelo.fv × edad.factorLitros × (copa/copaRef)² × humedad.fv
 *   días   = prom(días base) × suelo.fv × edad.factorDias ÷ zona.fc
 * La función no lee nada por sí sola: la base entra por parámetro
 * (ver getRiegoBase en ./actions). Sin base no hay cálculo.
 */
import { BALDE_L, zonaRiegoDeZonaId, type SueloId, type ZonaRiegoId } from "./datos";
import type { RiegoBasePayload } from "./actions";

export interface RiegoInput {
  dbKey: string;
  /** 1..12. Con desfase de zona se corre solo. */
  mes: number;
  zonaId?: number | null;
  zonaRiego?: ZonaRiegoId | null;
  suelo?: SueloId | null;
  /** 1..4 según tabla C del Excel (1 recién plantado … 4 adulto). */
  edadN?: number | null;
  /** Diámetro de copa medido (m). */
  copaM?: number | null;
  /** Nivel test bola 1..5. Default 2 (punto de riego). */
  humedad?: number | null;
  /** Código de etapa observada (BRO/FLO/CUA/CRE/MAD/POS/REP). Si se omite, manda el calendario. */
  etapaCodigo?: string | null;
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
  aproximada: boolean;
  detalle: string;
}

export function calcularRiego(input: RiegoInput, base: RiegoBasePayload): RiegoResultado | null {
  const mes = Math.min(12, Math.max(1, Math.round(input.mes)));
  const suelo = base.suelos.find((t) => t.clave === (input.suelo ?? "M"));
  const edad = base.edades.find((e) => e.n === (input.edadN ?? 4));
  const zonaId: ZonaRiegoId = input.zonaRiego ?? zonaRiegoDeZonaId(input.zonaId);
  const zona = base.zonas.find((z) => z.clave === zonaId);
  const humedad = base.niveles.find((n) => n.nivel === (input.humedad ?? 2));
  if (!suelo || !edad || !zona || !humedad) return null;

  // Etapa observada manda sobre el calendario (igual que el Excel).
  const cod = (input.etapaCodigo ?? "").toUpperCase();
  const obs = cod ? base.etapas.find((e) => e.codigo === cod) : undefined;
  const mesZona = ((mes - 1 - zona.desfase) % 12 + 12) % 12 + 1;
  const cal = base.mensual.find((m) => m.especie === input.dbKey && m.mes === mesZona);
  if (!obs && !cal) return null;
  const b = obs ?? cal!;
  const fuente = obs ? ("observacion" as const) : ("calendario" as const);

  const ref = base.especie?.copaRefM || 2.0;
  const copa = Math.min(12, Math.max(0.2, input.copaM ?? ref));
  const fCopa = Math.min(8, Math.max(0.2, (copa / ref) ** 2));

  const litrosMin = Math.round(b.litrosMin * suelo.factor * edad.factorLitros * fCopa * humedad.factorRiego);
  const litrosMax = Math.round(b.litrosMax * suelo.factor * edad.factorLitros * fCopa * humedad.factorRiego);
  const litros = Math.round((litrosMin + litrosMax) / 2);
  const cadaDias = Math.max(
    1,
    Math.round(((b.diasMin + b.diasMax) / 2) * suelo.factor * edad.factorDias / zona.factorClima),
  );

  const caudal = Math.max(0, input.caudalLH ?? 0);
  const regarHoy = humedad.factorRiego > 0;
  return {
    litros,
    litrosMin,
    litrosMax,
    cadaDias,
    regarHoy,
    baldes: Math.round((litros / BALDE_L) * 10) / 10,
    horasGoteo: caudal > 0 ? Math.round((litros / caudal) * 10) / 10 : null,
    etapa: obs ? obs.etapaPrograma : cal!.etapa,
    fuente,
    aproximada: Boolean(obs && !obs.coincideExacta),
    detalle: `Base GARDENFOOD ${input.dbKey} (${b.litrosMin}–${b.litrosMax} L cada ${b.diasMin}–${b.diasMax} días) × suelo ${suelo.factor} × edad ${edad.factorLitros} × copa ${fCopa.toFixed(2)}${humedad.factorRiego !== 1 ? ` × humedad ${humedad.factorRiego}` : ""} ÷ zona ${zona.factorClima}.`,
  };
}
