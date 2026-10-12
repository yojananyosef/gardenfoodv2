/**
 * Tipos y funciones puras del catálogo de comunas y suelos.
 *
 * Va aparte de `catalogos.ts` a propósito: ese archivo usa `unstable_cache` y
 * necesita el cliente de Supabase, o sea que es server-only. Este no lo es, y
 * lo necesitan los componentes cliente que reciben el catálogo por props.
 */

export interface ComunaCatalogo {
  comuna: string;
  zonaId: number;
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