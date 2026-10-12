/**
 * Las 20 zonas para los tests.
 *
 * En producción salen de `dim_zonas_agro` vía `getZonas()` (`lib/agronomy/
 * catalogos.ts`), que es server-only y necesita `unstable_cache`. Un test
 * unitario no puede usar eso, así que aquí se leen del CSV versionado que
 * genera esa misma tabla — `scripts/importar_base_maestra.py` lo escribe y
 * la migración 0037 lo aplica — y se pasan por los mismos `numeroDeCelda` y
 * `rangoLegible`.
 *
 * El motivo de no duplicar las 20 zonas a mano en un fixture es que un
 * fixture se pudre: nadie lo actualiza cuando cambia la base y el test sigue
 * pasando contra datos que ya no existen. Leyendo el CSV, el test falla si la
 * base y el archivo se separan.
 *
 * Lo que este archivo NO cubre es que la tabla de producción tenga las mismas
 * filas que el CSV. Eso lo verifica `tests/zona-riego-catalogo.test.ts` para
 * las comunas, y la importación los verificó fila por fila al aplicarse.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getZonaIdDeComuna } from "@/lib/agronomy";
import {
  numeroDeCelda,
  rangoLegible,
  ZONA_NEUTRA_ID,
  type ZonaCatalogo,
} from "@/lib/agronomy/catalogo";

const COLUMNAS = [
  "zona_agro_id",
  "zona_agro",
  "region",
  "tipo_clima",
  "t_max_enero",
  "t_min_julio",
  "t_min_absoluta",
  "precipitacion_anual_mm",
  "horas_frio",
  "heladas_dias_ano",
  "riesgo_sequia",
  "estacion_agromet",
] as const;

function cargar(): Record<number, ZonaCatalogo> {
  const csv = readFileSync(join(process.cwd(), "data", "dim_zonas_agro.csv"), "utf8");
  const lineas = csv.split("\n").filter((l) => !l.startsWith("#") && l.trim());
  const cab = lineas[0].split(",");
  // Si el CSV cambia de columnas, que lo diga el test y no un undefined
  // silencioso bajando a 0.
  for (const c of COLUMNAS) expectColumna(cab, c);

  const out: Record<number, ZonaCatalogo> = {};
  for (const linea of lineas.slice(1)) {
    const c = linea.split(",");
    const v = (nombre: string) => c[cab.indexOf(nombre)] ?? "";
    out[Number(v("zona_agro_id"))] = {
      id: Number(v("zona_agro_id")),
      nombre: v("zona_agro"),
      region: v("region"),
      clima: v("tipo_clima"),
      txMax: numeroDeCelda(v("t_max_enero")),
      tnMin: numeroDeCelda(v("t_min_julio")),
      pp: numeroDeCelda(v("precipitacion_anual_mm")),
      hf: rangoLegible(v("horas_frio")),
      heladas: rangoLegible(v("heladas_dias_ano")),
      sequia: v("riesgo_sequia"),
      tMinAbsoluta: numeroDeCelda(v("t_min_absoluta")),
      estacion: v("estacion_agromet"),
    };
  }
  return out;
}

function expectColumna(cab: string[], nombre: string): void {
  if (!cab.includes(nombre)) {
    throw new Error(
      `dim_zonas_agro.csv no tiene la columna "${nombre}". Revisa COLUMNAS en este archivo.`,
    );
  }
}

/** Las 20 zonas por id. Mismo contrato que el `ZONAS` que estaba en `lib/agronomy/zonas.ts`. */
export const ZONAS: Record<number, ZonaCatalogo> = cargar();

/** Espejo síncrono de `getZonaDeComuna()` para los tests. */
export function zonaDeComuna(comuna?: string | null): ZonaCatalogo | null {
  return ZONAS[getZonaIdDeComuna(comuna) ?? ZONA_NEUTRA_ID] ?? null;
}