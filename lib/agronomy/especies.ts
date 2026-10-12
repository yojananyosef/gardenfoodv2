/**
 * Las 30 especies, con los datos agronómicos de la base y el contenido
 * editorial del código.
 *
 * ANTES ERA UN ARRAY DE 565 LÍNEAS
 * --------------------------------
 *
 * Vivía entero en este archivo, autogenerado por el legacy. Ahora se compone de
 * dos partes:
 *
 *   `especies.generado.ts`  lo produce `scripts/generar_especies.mjs` desde
 *                           `dim_especies`, `especies_bc` y
 *                           `especies_ficha_bd20`. Es el 90% del contenido:
 *                           nombre, grupo, dificultad, suelo, pH, clima,
 *                           observaciones,Compatibilidad,como se siembra.
 *
 *   `especies.editorial.ts`  `imagen` y `descripcion`. No estan en ninguna de
 *                           las 47 hojas del Excel, asi que no hay de donde
 *                           sacarlos.
 *
 * Lo que se perdio: el bloque `ficha` (riego, suelo, cosecha, plagas, cuidados).
 * Nadie lo leia — `.ficha` no aparecia en ningun archivo fuera de este — y su
 * contenido vive ahora en `fact_ficha_riego`, `fact_sanidad` y
 * `fact_labores_mes`. Queda volcado en `data/especies_ficha_legacy.csv` por si
 * acaso.
 *
 * POR QUÉ SE GENERA Y NO SE LEE DE LA BASE EN RUNTIME
 * ---------------------------------------------------
 *
 * Se probó la otra vía: hacer `getEspecies()` async y pasar por props, como se
 * hizo con las zonas. No funciona acá sin tocar 14 archivos, y uno de ellos hace
 * `useState(ESPECIES[0].dbKey)`, que no se puede await. El modo de fallo de eso
 * es un selector de especie vacío en producción, no un error de tipos.
 *
 * Generar deja los 14 consumidores intactos y la base igual de autoritativa:
 * se regenera cuando cambia el Excel. El riesgo de que el archivo quede viejo
 * lo vigila `scripts/verificar_especies_generadas.mjs`, que compara el archivo
 * contra la base y falla si no coinciden.
 */
import { ESPECIES_GENERADAS } from "./especies.generado";
import { EDITORIAL } from "./especies.editorial";

export type Dificultad = "Fácil" | "Moderado" | "Avanzado" | "Difícil" | "Alto";

export type GrupoFruta =
  | "Carozo" | "Pomácea" | "Cítrico" | "Baya" | "Fruto seco" | "Subtropical" | "Otros";

export interface Especie {
  id: number;
  slug: string;
  dbKey: string;
  nombre: string;
  imagen: string;
  descripcion: string;
  clima: string;
  dificultad: Dificultad;
  grupo: string;
}

const txt = (v: string | null | undefined) => (v == null ? "" : String(v).trim());

export const ESPECIES: Especie[] = ESPECIES_GENERADAS.map((e) => {
  const slug = txt(e.especie_id);
  const ed = EDITORIAL[slug];
  return {
    // El id no existe en la base: `especie_id` es texto. Se conserva la
    // posición curada del array original, que vive en el overlay.
    id: ed?.orden ?? 0,
    slug,
    dbKey: txt(ed?.dbKey ?? e.especie),
    nombre: txt(ed?.nombre ?? e.especie),
    imagen: txt(ed?.imagen),
    descripcion: txt(ed?.descripcion),
    // El editorial pisa al de la base a propósito: `clima_ideal` viene vacío
    // para 10 especies y el texto del código es el único que hay. Cuando se
    // llene la hoja, la entrada del overlay pasa a `clima: null` y empieza a
    // mandar la base.
    clima: ed?.clima ?? txt(e.clima_ideal),
    // La escala del código tiene 5 valores y la del Excel es texto libre con
    // "Media", "Muy fácil" y "Fácil-Media", que no entran en `Dificultad`.
    // El detalle está en el bloque de EDITORIAL.
    dificultad: txt(ed?.dificultad ?? e.dificultad) as Dificultad,
    grupo: txt(ed?.grupo ?? e.grupo ?? e.categoria),
  };
}).sort((a, b) => a.id - b.id);

/** Los 30 datos de ficha completa que hoy solo estan en la base. */
export function getEspecieCompleta(slug: string) {
  const generada = ESPECIES_GENERADAS.find((e) => e.especie_id === slug);
  if (!generada) return null;
  const publica = ESPECIES.find((e) => e.slug === slug);
  return { ...publica, ...generada };
}