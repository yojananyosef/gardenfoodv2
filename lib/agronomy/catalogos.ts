/**
 * Catálogos agronómicos de referencia, leídos de la base.
 *
 * Hasta ahora estos datos vivían escritos a mano en
 * `lib/agronomy/comunas.ts`, `lib/agronomy/zonas.ts` y `lib/riego/datos.ts`.
 * Desde `import-base-maestra` viven en `dim_*`, así que el código duplicaba lo
 * que ya estaba en la base. Este módulo los lee con el mismo patrón que
 * `lib/riego/actions.ts`: cliente sin cookies, caché de 7 días, tag
 * `riego-base`.
 *
 * Son de solo lectura y casi estáticos. Si un cambio de `dim_comunas` no se ve
 * en la app, es la caché, no un error: `revalidate: 604800`.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getZonaIdDeComuna } from "./comunas";
import {
  numeroDeCelda,
  rangoLegible,
  ZONA_NEUTRA_ID,
  type ComunaCatalogo,
  type SueloCatalogo,
  type ZonaCatalogo,
} from "./catalogo";

export type { ComunaCatalogo, SueloCatalogo, ZonaCatalogo } from "./catalogo";
export { ZONA_NEUTRA_ID };

import type { Database } from "@/types/database.types";

function createPublicClient() {
  // Tipado contra el esquema real: si una columna se renombra en la base,
  // el `.select("...")` de abajo deja de compilar en vez de devolver `null`
  // en runtime. El archivo lo genera `scripts/generar_database_types.mjs`.
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Las 20 zonas agroclimáticas.
 *
 * Reemplaza a las que estaban escritas a mano en `lib/agronomy/zonas.ts`, que
 * autogeneró el legacy. Las dos son 1:1 en los 20 ids y en los 9 campos de
 * clima; lo que cambia es el formato con que llegan desde la hoja de cálculo
 * (`"27°C"` en vez de `27`, guion corto en vez de `–`), y eso lo resuelve
 * `numeroDeCelda` y `rangoLegible` al leer.
 *
 * La base trae dos columnas que el TS no tenía: `t_min_absoluta` y
 * `estacion_agromet`.
 */
export const getZonas = unstable_cache(
  async (): Promise<ZonaCatalogo[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("dim_zonas_agro")
      .select(
        "zona_agro_id, zona_agro, region, tipo_clima, t_max_enero, t_min_julio, t_min_absoluta, precipitacion_anual_mm, horas_frio, heladas_dias_ano, riesgo_sequia, estacion_agromet",
      )
      .order("zona_agro_id");
    return (data ?? []).map((r) => ({
      id: Number(r.zona_agro_id),
      nombre: (r.zona_agro as string) ?? "",
      region: (r.region as string) ?? "",
      clima: (r.tipo_clima as string) ?? "",
      txMax: numeroDeCelda(r.t_max_enero),
      tnMin: numeroDeCelda(r.t_min_julio),
      pp: numeroDeCelda(r.precipitacion_anual_mm),
      hf: rangoLegible(r.horas_frio),
      heladas: rangoLegible(r.heladas_dias_ano),
      sequia: (r.riesgo_sequia as string) ?? "",
      tMinAbsoluta: numeroDeCelda(r.t_min_absoluta),
      estacion: (r.estacion_agromet as string) ?? "",
    }));
  },
  ["catalogo-zonas"],
  { revalidate: 604800, tags: ["riego-base"] },
);

/**
 * La zona agroclimática de una comuna.
 *
 * Antes esto era un `Record` a nivel de módulo y la función era síncrona.
 * Ahora son 20 filas que salen de la base, así que es `async` y llama a
 * `getZonas()`: los seis call-sitos que la usan son de servidor y ya estaban
 * esperando datos.
 *
 * Se queda en la zona neutra cuando la comuna no está en el catálogo, que es
 * lo que hacía el `?? 7` de antes. Para distinguir el caso hay que usar
 * `resolverZonaDeComuna`, que sigue siendo síncrona porque solo mira el mapa
 * comuna→zona, que todavía no viene de la base.
 */
export async function getZonaDeComuna(comuna?: string | null): Promise<ZonaCatalogo | null> {
  const zonas = await getZonas();
  const zonaId = getZonaIdDeComuna(comuna);
  return zonas.find((z) => z.id === zonaId) ?? zonas.find((z) => z.id === ZONA_NEUTRA_ID) ?? null;
}

/** Zona por id, o `null` si el id no está en `dim_zonas_agro`. */
export async function getZonaPorId(zonaId: number | null | undefined): Promise<ZonaCatalogo | null> {
  if (!zonaId) return null;
  const zonas = await getZonas();
  return zonas.find((z) => z.id === zonaId) ?? null;
}

/**
 * Las 346 comunas con su zona agroclimática y su zona de riego.
 *
 * Antes esto venía de `lib/agronomy/comunas.ts` y la zona de riego salía de
 * `zonaRiegoDeZonaId()`, 14 líneas de `if` anidados sobre el número de zona.
 * La tabla sabe la zona de riego por comuna, que es más preciso: dentro de una
 * misma zona agroclimática hay comunas con clima de riego distinto. Las dos
 * coinciden en 16 de 20 zonas y discrepan en la comuna correcta en las otras 4.
 * El detalle está en `tests/zona-riego-catalogo.test.ts`.
 *
 * OJO con `zona_agro_id`: viene `null` en 217 de las 346, y se conserva como
 * `null` en vez de convertirse en 0. Antes se leía con `Number(v)`, y como
 * `Number(null)` es `0` esas 217 salían con `zonaId: 0`, que no es una zona
 * ni la neutro: era un id imposible que el tipo no delataba.
 */
export const getComunas = unstable_cache(
  async (): Promise<ComunaCatalogo[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("dim_comunas")
      .select("comuna_id, comuna, region, zona_agro_id, zona_riego_id, macrozona_id")
      .order("comuna_id");
    return (data ?? []).map((r) => ({
      comuna: r.comuna as string,
      zonaId: r.zona_agro_id == null ? null : Number(r.zona_agro_id),
      region: r.region as string,
      zonaRiegoId: (r.zona_riego_id as string) || "C1",
      macrozonaId: (r.macrozona_id as string) || "",
      zonaAgroId: String(r.zona_agro_id ?? ""),
    }));
  },
  ["catalogo-comunas"],
  { revalidate: 604800, tags: ["riego-base"] },
);

/**
 * Las 4 texturas de suelo con cómo se sienten y cómo se manejan.
 *
 * `SueloForm` usaba tres copias del mismo dato: el catálogo `TIPOS_SUELO`, un
 * `SENSACION` local y la fila de la base. Las tres conviven acá: `sensacion`
 * viene de `dim_suelos.como_se_siente`, que antes no leía nadie.
 */
export const getSuelos = unstable_cache(
  async (): Promise<SueloCatalogo[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("dim_suelos")
      .select(
        "suelo_id, suelo, nombres_usda, agua_min_mm_m, agua_max_mm_m, factor_suelo, como_se_siente, como_manejarlo",
      )
      .order("factor_suelo");
    return (data ?? []).map((r) => ({
      id: r.suelo_id as string,
      nombre: r.suelo as string,
      tecnico: (r.nombres_usda as string) || "",
      factor: numeroDeCelda(r.factor_suelo, 1),
      aguaMinMm: numeroDeCelda(r.agua_min_mm_m),
      aguaMaxMm: numeroDeCelda(r.agua_max_mm_m),
      sensacion: (r.como_se_siente as string) || "",
      manejo: (r.como_manejarlo as string) || "",
    }));
  },
  ["catalogo-suelos"],
  { revalidate: 604800, tags: ["riego-base"] },
);