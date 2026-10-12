/**
 * Tipos y funciones puras del catálogo de comunas y suelos.
 *
 * Va aparte de `catalogos.ts` a propósito: ese archivo usa `unstable_cache` y
 * necesita el cliente de Supabase, o sea que es server-only. Este no lo es, y
 * lo necesitan los componentes cliente que reciben el catálogo por props.
 */

export interface ComunaCatalogo {
  comuna: string;
  /**
   * Zona agroclimática de la comuna, o `null` si el catálogo no la trae.
   *
   * El tipo admite `null` a propósito. `dim_comunas.zona_agro_id` está vacío
   * en 217 de las 346 comunas (Aysén, Magallanes y Tarapacá enteras, y más de
   * la mitad de la Región Metropolitana), así que un número no sería
   * cierto. Con `0` o con un `?? 7` el hueco se vuelve indistinguible de una
   * zona real, y quien lo use sin mirar termina mostrando la zona neutra como
   * si fuera la del usuario.
   */
  zonaId: number | null;
  region: string;
  /** Zona de riego de esa comuna. La sabe la tabla, no un `if`. */
  zonaRiegoId: string;
  macrozonaId: string;
  zonaAgroId: string;
}

export interface SueloCatalogo {
  id: string;
  nombre: string;
  tecnico: string;
  factor: number;
  aguaMinMm: number;
  aguaMaxMm: number;
  /** `dim_suelos.como_se_siente`: cómo se siente la tierra en la mano. */
  sensacion: string;
  manejo: string;
}

/** Sin tildes y en minúscula, para comparar lo que escribió el usuario. */
export function normalizar(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Índice por nombre de comuna, para no recorrer 346 filas en cada consulta.
 *
 * Guarda dos claves por comuna, la original y la normalizada: el perfil guarda
 * la comuna como la escribió la persona, que puede no llevar tilde ni
 * mayúscula. `buscarComuna` del catálogo viejo ya era case-insensitive, así
 * que el nuevo tiene que serlo igual o se pierden esos perfiles.
 */
export function indicePorComuna(comunas: ComunaCatalogo[]): Map<string, ComunaCatalogo> {
  const m = new Map<string, ComunaCatalogo>();
  for (const c of comunas) {
    m.set(c.comuna, c);
    m.set(normalizar(c.comuna), c);
  }
  return m;
}

/**
 * Una zona agroclimática tal como la guarda `dim_zonas_agro`.
 *
 * Reemplaza a la interfaz `ZonaClimatica` que estaba escrita a mano en
 * `lib/agronomy/zonas.ts`. Mismos nombres de campo a propósito: `lib/climate`
 * (`umbralHelada`, `diasDeHelada`, `resolverClima`) consume ese contrato, y
 * renombrarlo no agregaba nada.
 */
export interface ZonaCatalogo {
  id: number;
  nombre: string;
  region: string;
  clima: string;
  txMax: number;
  tnMin: number;
  pp: number;
  /** Horas de frío, como rango legible: «500–800». */
  hf: string;
  /** Días de helada al año, como texto: «15–35 días» o «Sin heladas». */
  heladas: string;
  sequia: string;
  /** Mínima absoluta histórica. La trae la base y el TS antigo no la tenía. */
  tMinAbsoluta: number;
  /** Estación agrometeorológica de referencia. Igual: nueva en la base. */
  estacion: string;
}

/**
 * Lee un número que la base guarda con unidad: `"27°C"`, `"-8°C (INIA: -5.5°C
 * Humán)"`, `"1"`.
 *
 * `dim_zonas_agro` es una hoja de cálculo, así que las celdas numéricas
 * llegaron como texto con el sufijo puesto a mano. Se queda con el primer
 * número del texto, que es el que la hoja quiso decir: en la mínima absoluta
 * la celda es un número seguido de la referencia de la fuente, no una frase
 * que haya que interpretar.
 *
 * Devuelve `porDefecto` si no hay ningún número, en vez de `NaN`: un `NaN` en
 * `txMax` termina pintado como temperatura en la ficha.
 */
export function numeroDeCelda(valor: unknown, porDefecto = 0): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : porDefecto;
  if (valor === null || valor === undefined) return porDefecto;
  const m = String(valor).match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return porDefecto;
  const n = Number(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : porDefecto;
}

/**
 * Deja un rango con guion largo: `"0-50"` pasa a `"0–50"`.
 *
 * La hoja usa guion corto y el TS escrito a mano usaba `–`. El guion no
 * cambia ningún cálculo (`diasDeHelada` saca los dígitos con `\d+`), así que
 * se normaliza solo para que la ficha siga mostrando exactamente lo mismo.
 */
export function rangoLegible(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
}

/** Índice por id de zona, para no recorrer 20 filas en cada consulta. */
export function indicePorZona(zonas: ZonaCatalogo[]): Map<number, ZonaCatalogo> {
  return new Map(zonas.map((z) => [z.id, z]));
}

/**
 * Zona neutra: la que se muestra cuando la comuna no está en el catálogo o el
 * perfil no tiene comuna. Es la 7 (Santiago Norte).
 *
 * Vive acá y no junto a las zonas porque la necesitan dos capas: el servidor,
 * para elegir la fila de `dim_zonas_agro`, y `lib/agronomy/index.ts`, que es
 * client-safe y no puede importar de `catalogos.ts`.
 */
export const ZONA_NEUTRA_ID = 7;