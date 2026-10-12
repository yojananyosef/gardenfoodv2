/**
 * Inventario de las tres tablas de especies y de los huecos que dejaria
 * migrar lib/agronomy/especies.ts.
 *
 * El array del codigo tiene 4 campos (imagen, descripcion, clima, dificultad)
 * que no estan en dim_especies. Antes de decidir si se agregan columnas o se
 * dejan en el codigo, hay que ver si ya viven en especies_bc o en
 * especies_ficha_bd20.
 *
 * Uso: node scripts/inventario_especies.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

console.log("== cobertura por tabla ==");
for (const t of ["dim_especies", "especies_bc", "especies_ficha_bd20"]) {
  const { rows } = await db.query(`select count(*)::int as n from ${t}`);
  const { rows: vacias } = await db.query(
    `select count(*)::int as n from ${t} where especie_id is null`,
  );
  console.log(`   ${t.padEnd(24)} ${String(rows[0].n).padStart(3)} filas, ${vacias[0].n} sin especie_id`);
}

const { rows: todas } = await db.query(`
  select coalesce(d.especie_id, b.especie_id, f.especie_id) as especie_id,
         d.especie_id is not null as en_dim,
         b.especie_id is not null as en_bc,
         f.especie_id is not null as en_bd20,
         b.dificultad, f.clima_ideal, b.observaciones
    from dim_especies d
    full outer join especies_bc b on b.especie_id = d.especie_id
    full outer join especies_ficha_bd20 f on f.especie_id = d.especie_id
   order by 1`);

console.log(`\n== ${todas.length} especies unidas por especie_id ==`);
const soloDim = todas.filter((t) => t.en_dim && !t.en_bc && !t.en_bd20);
const soloBc = todas.filter((t) => !t.en_dim && t.en_bc);
const sinBc = todas.filter((t) => t.en_dim && !t.en_bc);
const sinBd20 = todas.filter((t) => t.en_dim && !t.en_bd20);
const sinDificultad = todas.filter((t) => t.en_bc && !t.dificultad);
const sinClima = todas.filter((t) => t.en_bd20 && !t.clima_ideal);

console.log(`   en las 3 tablas          : ${todas.filter((t) => t.en_dim && t.en_bc && t.en_bd20).length}`);
console.log(`   en dim, sin especies_bc  : ${sinBc.length} ${sinBc.map((t) => t.especie_id).join(", ")}`);
console.log(`   en dim, sin ficha_bd20   : ${sinBd20.length} ${sinBd20.map((t) => t.especie_id).join(", ")}`);
console.log(`   solo en especies_bc      : ${soloBc.length} ${soloBc.map((t) => t.especie_id).join(", ")}`);
console.log(`   solo en dim_especies     : ${soloDim.length}`);
console.log(`   en bc pero sin dificultad: ${sinDificultad.length}`);
console.log(`   en bd20 pero sin clima    : ${sinClima.length}`);

console.log("\n== donde acaba cada campo del array ==");
const campos = [
  ["dificultad", "especies_bc.dificultad"],
  ["clima", "especies_ficha_bd20.clima_ideal"],
  ["descripcion", "especies_bc.observaciones (¿?)"],
  ["imagen", "NINGUNA: es una ruta de archivo /frutas/*.webp"],
];
for (const [c, d] of campos) console.log(`   ${c.padEnd(12)} -> ${d}`);

console.log("\n== el slug que no coincide ==");
const { rows: papayo } = await db.query(`
  select especie_id, especie, nombre_cientifico from dim_especies
   where especie_id ilike '%papayo%' or especie ilike '%papayo%'`);
for (const p of papayo) console.log(`   ${JSON.stringify(p)}`);
console.log("   en el codigo el slug es 'papayo-chileno'");

console.log("\n== especies_bc: cuantas columnas traen texto largo (descripcion?) ==");
const { rows: largas } = await db.query(`
  select column_name, data_type from information_schema.columns
   where table_name = 'especies_bc'
     and column_name in ('observaciones','referencias','ficha_fuente','descripcion')`);
for (const l of largas) console.log(`   ${l.column_name} (${l.data_type})`);

await db.end();