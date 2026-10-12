/**
 * Genera `lib/agronomy/especies.generado.ts` desde las tres tablas de
 * especies, con el mismo patron que `scripts/generar_database_types.mjs`.
 *
 * POR QUE GENERAR Y NO MIGRAR A ASYNC
 * -----------------------------------
 *
 * La primera idea era hacer `getEspecies()` async y pasar las especies por
 * props, como se hizo con las zonas. No: `ESPECIES` se lee de forma sincronica
 * en cinco componentes cliente, y uno de ellos hace
 * `useState(ESPECIES[0].dbKey)`, que no se puede await. T国有 que threading por
 * props en 14 archivos, y el modo de fallo de eso es un selector de especie
 * vacio en produccion, no un error de tipos.
 *
 * Generar deja los 14 archivos sin tocar y la base sigue siendo la fuente: el
 * archivo se regenera cuando cambia el Excel.
 *
 * El riesgo de esto es que el archivo generado quede viejo. Para eso esta
 * `scripts/verificar_especies_generadas.mjs`, que compara lo generado contra la
 * base y falla si no coinciden.
 *
 * QUE SE GENERA
 * -------------
 *
 * De `dim_especies`:     especie_id, especie, nombre_cientifico, grupo
 * De `especies_bc`:      dificultad, tipo_suelo, ph, observaciones, y el resto
 * De `especies_ficha_bd20`: clima_ideal, y el resto de la ficha
 *
 * NO se genera `imagen` ni `descripcion`: no existen en ninguna de las 47
 * hojas del Excel (se verifico celda por celda buscando rutas de archivo y
 * columnas de descripcion). Son contenido editorial y siguen en
 * `especies.ts`, que los mezcla con esto.
 *
 * Uso: node scripts/generar_especies.mjs
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  select d.especie_id, d.especie, d.nombre_cientifico, d.grupo,
         b.dificultad, b.tipo_suelo, b.ph, b.observaciones, b.categoria,
         b.zonas_recomendadas, b.horas_frio, b.requerimiento_hidrico,
         b.exposicion_solar, b.epoca_plantacion, b.epoca_cosecha,
         b.distancia_plantacion, b.plagas_principales,
         b.enfermedades_principales, b.nivel_mantenimiento,
         b.tiempo_hasta_produccion, b.rendimiento_esperado,
         b.compatible_patio, b.compatible_maceta, b.referencias,
         f.clima_ideal, f.distancia, f.primera_cosecha, f.vida_productiva,
         f.variedades, f.polinizacion, f.tamano_adulto, f.cosecha_cuando,
         f.cosecha_como_saber, f.cosecha_tecnica, f.postcosecha,
         f.rendimiento_esperado as bd20_rendimiento
    from dim_especies d
    left join especies_bc b on b.especie_id = d.especie_id
    left join especies_ficha_bd20 f on f.especie_id = d.especie_id
   order by d.especie_id`);

await db.end();

// --- los tres ids donde el codigo y la base no coinciden ---
//
// El codigo usa guiones en los slugs y estan en URLs (/especies/<slug> en el
// sitemap y en los enlaces del mapa). Cambiarlos rompe links que ya existen,
// asi que se respetan. Se corrigen en el Excel, que es donde corresponde.
//
// `papayo_chileno` con guion bajo es el unico que se sale de la convencion; no
// es un typo, la palabra esta bien escrita.
const ALIAS = {
  avellano: "avellano-europeo",
  nispero: "nispero-japones",
  papayo_chileno: "papayo-chileno",
};

const lit = (v) =>
  v === null || v === undefined
    ? "null"
    : typeof v === "number"
      ? String(v)
      : JSON.stringify(String(v));

const claves = [
  "especie_id", "especie", "nombre_cientifico", "grupo", "dificultad",
  "tipo_suelo", "ph", "observaciones", "categoria", "zonas_recomendadas",
  "horas_frio", "requerimiento_hidrico", "exposicion_solar",
  "epoca_plantacion", "epoca_cosecha", "distancia_plantacion",
  "plagas_principales", "enfermedades_principales", "nivel_mantenimiento",
  "tiempo_hasta_produccion", "rendimiento_esperado", "compatible_patio",
  "compatible_maceta", "referencias", "clima_ideal", "distancia",
  "primera_cosecha", "vida_productiva", "variedades", "polinizacion",
  "tamano_adulto", "cosecha_cuando", "cosecha_como_saber", "cosecha_tecnica",
  "postcosecha", "bd20_rendimiento",
];

const cuerpo = rows
  .map((r) => {
    const id = ALIAS[r.especie_id] ?? r.especie_id;
    return `  {
    especie_id: ${lit(id)},
${claves.slice(1).map((k) => `    ${k}: ${lit(r[k])},`).join("\n")}
  },`;
  })
  .join("\n");

const salida = `/**
 * GENERADO. No editar a mano.
 *
 * Lo produce \`scripts/generar_especies.mjs\` desde \`dim_especies\`,
 * \`especies_bc\` y \`especies_ficha_bd20\`. Para cambiarlo se cambia el Excel y
 * se regenera; editarlo acá se pierde en la proxima generacion.
 *
 * \`especies.ts\` mezcla esto con el contenido editorial (\`imagen\` y
 * \`descripcion\`) que el Excel no tiene.
 *
 * ${new Date().toISOString().slice(0, 10)} · ${rows.length} especies
 */

export interface EspecieGenerada {
${claves.map((k) => `  ${k}: string | null;`).join("\n")}
}

export const ESPECIES_GENERADAS: EspecieGenerada[] = [
${cuerpo}
];

/**
 * Los tres \`especie_id\` donde la base y el codigo no coinciden.
 *
 * El codigo usa guiones en los slugs y estan en URLs, asi que se respetan. Se
 * cambian en el Excel, no aca. \`avellano\` y \`nispero\` pierden el especifico
 * que tiene en el codigo, y \`papayo_chileno\` usa guion bajo donde el resto
 * usan guion.
 */
export const ESPECIES_ALIAS_ID: Record<string, string> = ${JSON.stringify(ALIAS, null, 2)};
`;

writeFileSync("lib/agronomy/especies.generado.ts", salida, "utf8");
console.log(`lib/agronomy/especies.generado.ts: ${rows.length} especies, ${claves.length} campos`);
console.log(`   alias aplicados: ${Object.entries(ALIAS).map(([a, b]) => `${a} -> ${b}`).join(", ")}`);
const sinClima = rows.filter((r) => !String(r.clima_ideal ?? "").trim());
console.log(`   sin clima_ideal (lo aporta el overlay): ${sinClima.map((r) => ALIAS[r.especie_id] ?? r.especie_id).join(", ")}`);