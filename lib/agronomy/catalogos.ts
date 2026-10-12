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
import type { ComunaCatalogo, SueloCatalogo } from "./catalogo";

export type { ComunaCatalogo, SueloCatalogo } from "./catalogo";

function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const N = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Las 346 comunas con su zona agroclimática y su zona de riego.
 *
 * Antes esto venía de `lib/agronomy/comunas.ts` y la zona de riego salía de
 * `zonaRiegoDeZonaId()`, 14 líneas de `if` anidados sobre el número de zona.
 * La tabla sabe la zona de riego por comuna, que es más preciso: dentro de una
 * misma zona agroclimática hay comunas con clima de riego distinto. Las dos
 * coinciden en 16 de 20 zonas y discrepan en lakommune correcta en las otras 4.
 * El detalle está en `tests/zona-riego-catalogo.test.ts`.
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
      zonaId: N(r.zona_agro_id),
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
      factor: N(r.factor_suelo, 1),
      aguaMinMm: N(r.agua_min_mm_m),
      aguaMaxMm: N(r.agua_max_mm_m),
      sensacion: (r.como_se_siente as string) || "",
      manejo: (r.como_manejarlo as string) || "",
    }));
  },
  ["catalogo-suelos"],
  { revalidate: 604800, tags: ["riego-base"] },
);