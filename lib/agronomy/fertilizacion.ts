/**
 * Programa de fertilización casera por especie/región/método de riego.
 *
 * Fuente: GARDENFOOD_Guia_Fertilizacion_Casera.xlsx (del socio), trazada a INIA
 * (Hirzel y Hepp, Boletín INIA N° 426, cuadros 3.5–3.8; INIA 2013 olivo;
 * INIA 2014, Libros INIA N° 31). Regenerable con:
 *
 *   python3 scripts/fertilizacion_seed.py
 *
 * Las dosis del xlsx son para PLANTA ADULTA (cosecha típica por especie);
 * el ajuste por edad y cosecha del usuario (hoja MI PLAN) vive en ajustePorArbol().
 */
import seed from "../../supabase/fertilizacion_seed.json";

export interface DetallePrograma {
  nutriente: string;
  producto: string | null;
  gramos_cada_vez: number | null;
  veces: number;
  gramos_periodo: number | null;
}

export interface ProgramaFertilizacion {
  especie: string;
  region_guia: string;
  metodo: "suelo" | "goteo";
  orden: number;
  momento: string;
  meses: string;
  veces: number;
  cada_dias: number;
  detalle: DetallePrograma[];
}

export interface FenologiaFertilizacion {
  especie: string;
  region_guia: string;
  se_cultiva: boolean | null;
  brota: string | null;
  florece: string | null;
  cosecha: string | null;
  m_despierta: string | null;
  m_engorda: string | null;
  m_recupera: string | null;
  veces_suelo: number | null;
  veces_goteo: number | null;
  nota: string | null;
}

export interface Fertilizante {
  producto: string;
  etiqueta: string | null;
  n_pct: number | null;
  p_pct: number | null;
  k_pct: number | null;
  ca_pct: number | null;
  mg_pct: number | null;
  gramos_cucharada: number | null;
  se_reparte: string | null;
  consejo: string | null;
}

/* Factores de edad de la hoja MI PLAN del xlsx. */
export const FACTORES_EDAD = { recien: 0.3, formacion: 0.6, adulto: 1.0 } as const;
export type RangoEdad = keyof typeof FACTORES_EDAD;

const FERTILIZANTES: Fertilizante[] = seed.fertilizantes;
const FENOLOGIA: FenologiaFertilizacion[] = seed.fenologia;
const PROGRAMAS: ProgramaFertilizacion[] = (seed.programas as ProgramaFertilizacion[]);

const COSECHA_TIPICA: Record<string, number> = Object.fromEntries(
  seed.cosecha_tipica.map((c) => [c.especie, c.cosecha_kg_adulto]),
);

/* Índice de fertilizantes por producto en minúsculas (para el peso por cucharada). */
const FERTILIZANTE_POR_PRODUCTO = new Map<string, Fertilizante>(
  FERTILIZANTES.map((f) => [f.producto.toLowerCase().trim(), f]),
);

export function fertilizantePorProducto(producto: string): Fertilizante | undefined {
  return FERTILIZANTE_POR_PRODUCTO.get(producto.toLowerCase().trim());
}

export function todosLosFertilizantes(): Fertilizante[] {
  return [...FERTILIZANTES].sort((a, b) => a.producto.localeCompare(b.producto, "es"));
}

/* Fenología por especie (normalizada en minúsculas). */
const FENOLOGIA_POR_ESPECIE = new Map<string, FenologiaFertilizacion[]>();
for (const fila of FENOLOGIA) {
  const clave = fila.especie.toLowerCase().trim();
  const lista = FENOLOGIA_POR_ESPECIE.get(clave) ?? [];
  lista.push(fila);
  FENOLOGIA_POR_ESPECIE.set(clave, lista);
}

export function fenologiaPorEspecie(especie: string): FenologiaFertilizacion[] {
  return FENOLOGIA_POR_ESPECIE.get(especie.toLowerCase().trim()) ?? [];
}

/** ¿La guía (xlsx) tiene datos de esta especie? */
export function tieneFertilizacion(especie: string): boolean {
  const clave = especie.toLowerCase().trim();
  return PROGRAMAS.some((p) => p.especie.toLowerCase() === clave);
}

export function cosechaTipicaAdulta(especie: string): number | undefined {
  return COSECHA_TIPICA[especie];
}

/**
 * Programa completo de una especie en una región con un método de riego.
 * orden 0 = cuando despierta, 1 = cuando engorda la fruta, 2 = cuando se recupera.
 */
export function programaDeEspecie(
  especie: string,
  regionGuia: string,
  metodo: "suelo" | "goteo",
): ProgramaFertilizacion[] {
  return PROGRAMAS.filter(
    (p) =>
      p.especie.toLowerCase() === especie.toLowerCase() &&
      p.region_guia === regionGuia &&
      p.metodo === metodo,
  ).sort((a, b) => a.orden - b.orden);
}

/**
 * Ajuste del programa de un adulto al árbol del usuario (hoja MI PLAN):
 * (cosecha del usuario ÷ cosecha típica de la especie) × factor de edad.
 * Si no hay dato de cosecha, aplica solo el factor de edad.
 */
export function ajustePorArbol(
  especie: string,
  rangoEdad: RangoEdad,
  cosechaKgPorArbol?: number | null,
): number {
  const tipica = COSECHA_TIPICA[especie];
  if (!tipica || !cosechaKgPorArbol) return FACTORES_EDAD[rangoEdad];
  return Math.max(0.1, Math.min(3, (cosechaKgPorArbol / tipica) * FACTORES_EDAD[rangoEdad]));
}

/* Gramos por cucharada sopera cuando el catálogo no define el producto. */
const GRAMOS_CUCHARADA_DEFAULT = 11;

/**
 * Grasas a medida casera: usa el «Una cucharada sopera pesa» del catálogo.
 * Trazado al prototipo del socio: menos de 6 g → «menos de ½ cucharada»;
 * de 6 a 15 cucharadas → medio y cuarto de cucharadas; más de 15 → tazas (16).
 */
export function gramosACaseras(gramos: number | null, producto: string | null): string {
  if (!gramos || gramos <= 0) return "—";
  const fertilizante =
    producto && producto !== "—" ? FERTILIZANTE_POR_PRODUCTO.get(producto.toLowerCase()) : undefined;
  const gramosCucharada = fertilizante?.gramos_cucharada ?? GRAMOS_CUCHARADA_DEFAULT;
  const cucharadas = gramos / gramosCucharada;

  if (gramos < 6) return "menos de ½ cucharada";

  if (cucharadas < 15) {
    const cuartos = Math.round(cucharadas * 4) / 4;
    if (cuartos <= 1.5) {
      return cuartos === 1 ? "1 cucharada" : `${formatoFraccion(cuartos)} cucharadas`;
    }
    return `${formatoFraccion(cuartos)} cucharadas`;
  }

  const tazas = Math.round((cucharadas / 16) * 4) / 4;
  return `${formatoFraccion(tazas)} ${tazas === 1 ? "taza" : "tazas"} (≈ ${Math.round(cucharadas)} cucharadas)`;
}

/* 0.5 → "½", 1.25 → "1 ¼", 2 → "2". */
function formatoFraccion(n: number): string {
  const enteros = Math.floor(n);
  const fraccion = Math.round((n - enteros) * 4) / 4;
  const simbolos: Record<number, string> = { 0: "", 0.25: " ¼", 0.5: " ½", 0.75: " ¾" };
  const parteEntera = enteros > 0 ? String(enteros) : "";
  if (fraccion === 0) return String(enteros);
  if (enteros === 0) return (simbolos[fraccion] ?? "").trimStart();
  return `${parteEntera}${simbolos[fraccion] ?? ""}`;
}

/* Mapeo región administrativa (perfil) → región de la guía (xlsx). */
const REGION_GUIA = [
  { guia: "Norte (Atacama-Coquimbo)", claves: ["Atacama", "Coquimbo", "Arica", "Tarapacá", "Antofagasta"] },
  { guia: "Valparaíso-Aconcagua", claves: ["Valparaíso", "Valparaiso"] },
  { guia: "Santiago-RM", claves: ["Metropolitana"] },
  { guia: "Centro-Sur (O'Higgins-Maule)", claves: ["O'Higgins", "Maule", "Libertador"] },
  { guia: "Transición (Ñuble-Biobío)", claves: ["Ñuble", "Biobío", "Biobio", "Bio Bío"] },
  { guia: "Sur (Araucanía-Los Lagos)", claves: ["Araucanía", "Los Ríos", "Los Lagos"] },
] as const;

/** Región de la guía que corresponde a la región administrativa del perfil. null = sin cobertura del xlsx. */
export function regionGuiaDeRegion(region?: string | null): string | null {
  if (!region) return null;
  const r = region.toLowerCase();
  for (const candidata of REGION_GUIA) {
    if (candidata.claves.some((c) => r.includes(c.toLowerCase()))) return candidata.guia;
  }
  return null;
}

/** Regiones con cobertura en la guía. */
export function regionesGuia(): string[] {
  return REGION_GUIA.map((r) => r.guia);
}
