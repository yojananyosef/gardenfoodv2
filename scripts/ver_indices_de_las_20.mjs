/**
 * Muestra los indices que ya existen en las 20 tablas donde hay que crear uno.
 *
 * Importa para no crear indices redundantes ni duplicar un compuesto que ya
 * este ahi con otro nombre, y para elegir el orden de las columnas de los
 * nuevos compuestos mirando como estan armados los que ya existen.
 *
 * Uso: node scripts/ver_indices_de_las_20.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const tablas = [
  "dim_comunas",
  "fact_fenologia",
  "fact_fert_programa",
  "fact_labores_mes",
  "fact_riego_etapa",
  "fact_riego_mes",
  "fact_tareas_mes",
  "fact_viabilidad_zona",
  "gf_aplicaciones",
  "gf_arboles",
];

const { rows } = await db.query(
  `select tablename, indexname, indexdef
     from pg_indexes
    where schemaname = 'public' and tablename = any ($1)
    order by tablename, indexname`,
  [tablas],
);

let actual = "";
for (const r of rows) {
  if (r.tablename !== actual) {
    actual = r.tablename;
    console.log(`\n== ${actual} ==`);
  }
  const cols = /USING btree \(([^)]*)\)/.exec(r.indexdef)?.[1] ?? "(expresion)";
  const unico = /CREATE UNIQUE INDEX/.test(r.indexdef) ? " UNICO" : "";
  console.log(`   ${cols.padEnd(46)} ${r.indexname}${unico}`);
}

console.log("\n\n== los indices compuestos que ya existen, como ordenan las columnas ==");
const compuestos = rows.filter((r) => /USING btree \([^)]*,/.test(r.indexdef));
for (const r of compuestos) {
  const cols = /USING btree \(([^)]*)\)/.exec(r.indexdef)[1];
  console.log(`   ${r.tablename.padEnd(22)} (${cols})`);
}

await db.end();