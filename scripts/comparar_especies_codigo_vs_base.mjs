/**
 * Compara el catalogo hardcodeado de lib/agronomy/especies.ts con dim_especies.
 *
 * Salio a la luz porque el script anteriorBuscaba una columna `slug` que no
 * existe: el PK de dim_especies es `especie_id`, de tipo texto.
 *
 * Lo que interesa no es si las especies coinciden, sino que campos del array no
 * tienen columna: `imagen`, `descripcion`, `clima` y `dificultad` salen del
 * array pero no aparecen en el listado de columnas. Antes de migrar hay que
 * saber si viven en otra tabla o si no viven en ninguna parte.
 *
 * Uso: node scripts/comparar_especies_codigo_vs_base.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: cols } = await db.query(`
  select column_name from information_schema.columns
   where table_name = 'dim_especies' order by ordinal_position`);
const columnas = new Set(cols.map((c) => c.column_name));

const { rows: especies } = await db.query(`
  select especie_id, especie, nombre_cientifico, grupo, alias_riego,
         nombre_en_excel_riego, suelo_preferido, ph_ideal, tiene_ficha_bd20
    from dim_especies order by especie_id`);

console.log(`== dim_especies: ${columnas.size} columnas, ${especies.length} filas ==\n`);

const fuente = readFileSync("lib/agronomy/especies.ts", "utf8");
const slugsCodigo = [...fuente.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((x) => x[1]);
const dbKeys = [...fuente.matchAll(/^\s*dbKey:\s*"([^"]+)"/gm)].map((x) => x[1]);

console.log("== especies del codigo vs de la base ==");
const ids = especies.map((e) => e.especie_id);
const soloCodigo = slugsCodigo.filter((s) => !ids.includes(s));
const soloBase = ids.filter((s) => !slugsCodigo.includes(s));
console.log(`   codigo ${slugsCodigo.length}   base ${ids.length}`);
console.log(`   solo en el codigo: ${soloCodigo.length ? soloCodigo.join(", ") : "ninguna"}`);
console.log(`   solo en la base  : ${soloBase.length ? soloBase.join(", ") : "ninguna"}`);

console.log("\n== dbKey del codigo vs alias/nombre_en_excel de la base ==");
const aliasBase = new Set(especies.flatMap((e) => [e.alias_riego, e.nombre_en_excel_riego]).filter(Boolean));
const huerfanos = dbKeys.filter((k) => !aliasBase.has(k));
console.log(`   ${dbKeys.length} dbKey en el codigo, ${huerfanos.length} sin equivalente en la base`);
if (huerfanos.length) console.log(`   ${huerfanos.join(", ")}`);

console.log("\n== CAMPOS DEL ARRAY QUE NO TIENEN COLUMNA EN dim_especies ==");
const delArray = ["id", "slug", "dbKey", "nombre", "imagen", "descripcion", "clima", "dificultad", "grupo"];
const posible = {
  id: "especie_id",
  slug: "especie_id",
  dbKey: "nombre_en_excel_riego",
  nombre: "especie",
  grupo: "grupo",
};
for (const campo of delArray) {
  if (columnas.has(campo)) {
    console.log(`   ${campo.padEnd(12)} -> columna directa`);
  } else if (posible[campo] && columnas.has(posible[campo])) {
    console.log(`   ${campo.padEnd(12)} -> ${posible[campo]} (mismo dato, otro nombre)`);
  } else {
    console.log(`   ${campo.padEnd(12)} *** NO HAY DONDE ESTE ***`);
  }
}

console.log("\n== que otros campos trae la ficha del array ==");
const ficha = [...fuente.matchAll(/^\s{4}(riego|suelo|cosecha|plagas|cuidados):/gm)].map((x) => x[1]);
console.log(`   ${[...new Set(ficha)].join(", ")}`);

console.log("\n== tablas disponibles que podrian guardarlos ==");
const { rows: tablas } = await db.query(`
  select table_name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
     and (table_name like '%especie%' or table_name like 'fact_ficha%')
   order by table_name`);
for (const t of tablas) {
  const { rows: c } = await db.query(
    `select string_agg(column_name, ', ' order by ordinal_position) as cols
       from information_schema.columns where table_name = $1`,
    [t.table_name],
  );
  console.log(`   ${t.table_name}\n      ${c[0].cols}`);
}

await db.end();