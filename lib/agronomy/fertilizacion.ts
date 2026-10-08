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
import { ZONAS } from "./zonas";

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

/* ══════════════════════════════════════════════════════════════════
   MATERIAL VISUAL DE LA FICHA — «los 3 momentos» del año.

   Traduce el programa del xlsx a las dos piezas que hacen que la tab
   se lea sin conocimiento técnico:
     1. un calendario de 12 meses coloreado por momento (cuándo le toca)
     2. la dosis en cucharadas/tazas dibujadas, no en gramos/crudos
   Todo es puro y sin efectos: se testea en tests/fertilizacion.test.ts.
   ══════════════════════════════════════════════════════════════════ */

export const MESES_GUIA = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

const MES_GUIA_NUM = new Map<string, number>(MESES_GUIA.map((m, i) => [m.toLowerCase(), i + 1]));

/**
 * «Jul, Ago» → [7, 8]. El xlsx enumera los meses con abreviatura de 3
 * letras separada por comas, y la ventana puede dar la vuelta al año
 * («Nov, Dic, Ene, Feb»): se queda con los números de mes y el orden
 * del calendario lo resuelve el consumidor.
 */
export function mesesDeGuia(meses: string | null | undefined): number[] {
  if (!meses) return [];
  const out: number[] = [];
  for (const parte of meses.split(",")) {
    const n = MES_GUIA_NUM.get(parte.trim().slice(0, 3).toLowerCase());
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

/**
 * Lo que se le dice al usuario cuando en un momento no hay nada que aplicar.
 *
 * Habla de meses y no de estados del árbol, que es el criterio que se pidió:
 * la calendarización es la referencia y el resto sobra. El texto viejo
 * («el árbol descansa y la tierra guarda lo que le diste») era el mismo tono
 * poético que el socio pidió recortar.
 */
export const REPOSO_MOMENTO = "En estos meses no se abona.";

export interface ProductoGuia {
  nutriente: string;
  producto: string | null;
  /** Gramos por aplicación para un árbol ADULTO (la base de la guía). */
  gramos: number;
  veces: number;
}

export interface MomentoGuia {
  orden: 0 | 1 | 2;
  /**
   * NO hay `titulo` ni `proposito`: eran el nombre del estado fenológico del
   * XLSX («cuando despierta», «cuando engorda la fruta», «cuando se recupera»),
   * jerga que se pidió quitar de la vista. El bloque se identifica por sus
   * meses, que es lo que el calendario ya muestra.
   *
   * El `orden` sigue siendo la clave: decide el color del mes y el token
   * `--momento-N`, así que la calendarización no depende del texto.
   */
  /** Meses (1-12) que cubre este momento. */
  meses: number[];
  /** «Jul · Ago», el título del bloque y el encabezado del calendario. */
  mesesTexto: string;
  veces: number;
  cadaDias: number;
  productos: ProductoGuia[];
}

export interface GuiaRegional {
  region: string;
  metodo: "suelo" | "goteo";
  momentos: MomentoGuia[];
  /**
   * Mes (1-12) → momento principal que le toca, o null si ese mes no se
   * abona. Cuando dos momentos se pisan (el mes de traspaso, p. ej. Sep
   * es el último de «despierta» y el primero de «engorda»), gana el
   * primero: el calendario se pinta con un color y el traspaso queda
   * anotado aparte para no mentir.
   */
  calendario: (0 | 1 | 2 | null)[];
  /** Meses en que el abono cambia de momento. */
  traspasos: number[];
  /** Aplicaciones al año en total (suma de `veces` de los momentos). */
  totalAplicaciones: number;
  /** La guía marca esta especie como no viable en la región. */
  seCultiva: boolean;
  /** Aviso del xlsx para esta especie en esta región (heladas, pH, K:Ca…). */
  nota: string | null;
}

function momentosVisibles(programa: ProgramaFertilizacion[]): MomentoGuia[] {
  return programa.map((p) => ({
    orden: p.orden as 0 | 1 | 2,
    meses: mesesDeGuia(p.meses),
    mesesTexto: p.meses,
    veces: p.veces,
    cadaDias: p.cada_dias,
    productos: p.detalle
      .filter((d) => (d.gramos_cada_vez ?? 0) > 0)
      .map((d) => ({
        nutriente: d.nutriente,
        producto: d.producto,
        gramos: d.gramos_cada_vez as number,
        veces: d.veces,
      })),
  }));
}

/**
 * Programa de una especie translated a las piezas visuales del calendario.
 * null = la guía no cubre esta especie en esta región.
 */
export function guiaRegional(
  especie: string,
  regionGuia: string,
  metodo: "suelo" | "goteo",
): GuiaRegional | null {
  const programa = programaDeEspecie(especie, regionGuia, metodo);
  if (!programa.length) return null;

  const momentos = momentosVisibles(programa);
  const calendario: (0 | 1 | 2 | null)[] = Array.from({ length: 12 }, () => null);
  const traspasos: number[] = [];

  for (const m of momentos) {
    for (const mes of m.meses) {
      const previo = calendario[mes - 1];
      if (previo === null) calendario[mes - 1] = m.orden;
      else if (previo !== m.orden && !traspasos.includes(mes)) traspasos.push(mes);
    }
  }

  const feno = fenologiaPorEspecie(especie).find((f) => f.region_guia === regionGuia);

  return {
    region: regionGuia,
    metodo,
    momentos,
    calendario,
    traspasos: traspasos.sort((a, b) => a - b),
    totalAplicaciones: momentos.reduce((acc, m) => acc + m.veces, 0),
    seCultiva: feno?.se_cultiva ?? true,
    nota: feno?.nota ?? null,
  };
}

/* ── La dosis dibujada: cucharadas y tazas en vez de gramos ──────── */

export type UnidadCasera = "pizca" | "cuchara" | "taza" | "pesa";

export interface MedidaCasera {
  /** Qué ilustración dibujar. */
  unidad: UnidadCasera;
  /** Cuchadas o tazas a dibujar (admite 0,5 para la media). */
  valor: number;
  /** Frase completa: «3,5 cucharadas soperas». Para lector de pantalla. */
  texto: string;
  /**
   * Solo la unidad, SIN el número: «cuchadas soperas». La ficha pinta el
   * número aparte y grande, así que usar `texto` ahí lo dejaba duplicado
   * («3,5» y debajo «3,5 cucharadas soperas»).
   */
  unidadTexto: string;
}

/** 16 cucharadas soperas llenan una taza de té. */
export const CUCHARADAS_POR_TAZA = 16;

/**
 * Misma cuenta que gramosACaseras() pero devolviendo la medida estructurada
 * para poder DIBUJARLA (el prototipo del socio dibuja las cucharadas en vez
 * de escribirlas). El texto usa el vocabulario del prototipo —«pizca»,
 * «cucharadas soperas», «tazas de té»— que es más didáctico que el de
 * gramosACaseras(), que se queda en el módulo del dashboard por compatibilidad.
 */
export function medidaCasera(gramos: number | null, producto: string | null): MedidaCasera {
  const g = gramos ?? 0;
  if (g <= 0) return { unidad: "pesa", valor: 0, texto: "—", unidadTexto: "" };

  const fertilizante =
    producto && producto !== "—" ? FERTILIZANTE_POR_PRODUCTO.get(producto.toLowerCase()) : undefined;
  const gramosCucharada = fertilizante?.gramos_cucharada ?? GRAMOS_CUCHARADA_DEFAULT;
  const n = g / gramosCucharada;

  if (n < 0.4) {
    return { unidad: "pizca", valor: 0.5, texto: "una pizca", unidadTexto: "una pizca" };
  }
  if (n < 0.8) {
    return { unidad: "cuchara", valor: 0.5, texto: "media cucharada", unidadTexto: "media cucharada" };
  }

  if (n <= 10) {
    const v = n < 4 ? Math.round(n * 2) / 2 : Math.round(n);
    return {
      unidad: "cuchara",
      valor: v,
      texto: v === 1 ? "1 cucharada sopera" : `${String(v).replace(".", ",")} cucharadas soperas`,
      unidadTexto: v === 1 ? "cucharada sopera" : "cucharadas soperas",
    };
  }

  const tazas = n / CUCHARADAS_POR_TAZA;
  if (tazas > 8) {
    return { unidad: "pesa", valor: 0, texto: "pésalo en una pesa", unidadTexto: "pésalo en una pesa" };
  }
  const v = tazas < 4 ? Math.round(tazas * 2) / 2 : Math.round(tazas);
  return {
    unidad: "taza",
    valor: v,
    texto: v === 1 ? "1 taza de té" : `${String(v).replace(".", ",")} tazas de té`,
    unidadTexto: v === 1 ? "taza de té" : "tazas de té",
  };
}

/** «388 g» · «1,2 kilos», para el texto que acompaña a las dasar. */
export function textoGramos(gramos: number): string {
  if (gramos >= 1000) return `${(gramos / 1000).toFixed(1).replace(".", ",")} kilos`;
  return `${Math.round(gramos)} gramos`;
}

/* ── Ajustes de edad para el visual ───────────────────────────────── */

export interface RangoEdadGuia {
  id: RangoEdad;
  nombre: string;
  desc: string;
}

/** Las tres edades del paso «¿Qué tan grande está?» del prototipo. */
export const EDADES_GUIA: RangoEdadGuia[] = [
  { id: "recien", nombre: "Chico", desc: "Recién plantado, 1 o 2 años" },
  { id: "formacion", nombre: "Mediano", desc: "Ya creció, 3 o 4 años" },
  { id: "adulto", nombre: "Grande", desc: "Da fruta, 5 años o más" },
];

/**
 * Tipo de fertilizante, en el vocabulario del=XLSX.
 *
 * Los `id` siguen siendo `suelo`/`goteo` porque son la clave con la que se
 * consulta `programaDeEspecie` contra el campo `metodo` del seed. Lo que el
 * usuario ve es el nombre del fertilizante, no el modo de riego: quien va a la
 * bodega busca «granulado» o «soluble», no «con manguera».
 *
 * Los `desc` ya no se renderizan (el texto era largo y no aportaba), pero se
 * conservan como documentación de a qué programa del XLSX corresponde cada
 * entrada.
 */
export const METODOS_GUIA = [
  { id: "suelo", nombre: "Fertilizantes granulados", desc: "Programa al suelo: se echa al pie y se riega encima" },
  { id: "goteo", nombre: "Fertilizantes solubles", desc: "Programa por goteo: se disuelven en el agua" },
] as const;

export type MetodoGuia = (typeof METODOS_GUIA)[number]["id"];

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

/**
 * Región de la guía que corresponde a la zona del perfil, o `null` si la guía
 * no cubre esa combinación.
 *
 * Devolver `null` es deliberado. Antes esta función caía a la primera región
 * que tuviera programa para la especie, y la ficha la mostraba como si fuera
 * la del usuario: el calendario se repintaba con los meses y el color de otra
 * región mientras el pie decía «salen de tu perfil». Un vacío honesto es
 * mejor que un dato de otra zona.
 *
 * Se evalúa el método `suelo` para decidir si hay programa, no el que el
 * usuario tenga elegido: las dos variantes cubren las mismas especies y
 * regiones en el seed, así que usar el método activo haría que el estado vacío
 * dependiera de un control que no tiene relación con la pregunta.
 */
export function regionDelPerfil(especie: string, zonaId: number): string | null {
  const region = regionGuiaDeRegion(ZONAS[zonaId]?.region);
  if (region && guiaRegional(especie, region, "suelo")) return region;
  return null;
}
