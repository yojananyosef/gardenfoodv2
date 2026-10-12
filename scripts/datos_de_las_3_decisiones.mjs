/**
 * Los datos concretos de las tres decisiones pendientes, para explicarlas sin
 * inventar nada.
 *
 * Uso: node scripts/datos_de_las_3_decisiones.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

// ---------- 1. las 217 comunas ----------
const { rows: c } = await db.query(`
  select
    count(*)::int as total,
    count(*) filter (where zona_agro_id is null)::int as sin_zona,
    count(*) filter (where zona_agro_id is not null)::int as con_zona
    from dim_comunas`);
console.log("== 1. LAS 217 COMUNAS ==");
console.log(`   total ${c[0].total}, con zona ${c[0].con_zona}, SIN zona ${c[0].sin_zona}\n`);

const { rows: porRegion } = await db.query(`
  select region, count(*)::int as n,
         count(*) filter (where zona_agro_id is not null)::int as con_zona
    from dim_comunas group by region order by n desc`);
console.log("   por region:");
for (const r of porRegion) {
  console.log(`      ${String(r.region).padEnd(28)} ${String(r.n).padStart(3)} comunas, ${r.con_zona} con zona`);
}
const { rows: ejemplo } = await db.query(`
  select comuna, region, zona_riego_id from dim_comunas
   where zona_agro_id is null order by comuna_id limit 6`);
console.log("\n   ejemplos sin zona:", ejemplo.map((e) => e.comuna).join(", "));
const { rows: conZona } = await db.query(`
  select comuna, region, zona_agro_id from dim_comunas
   where zona_agro_id is not null order by comuna_id limit 6`);
console.log("   ejemplos con zona:", conZona.map((e) => `${e.comuna} -> z${e.zona_agro_id}`).join(", "));

// ---------- 2. las 49 combinaciones ----------
console.log("\n\n== 2. LAS 49 COMBINACIONES DE ZONA ==");
const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const codigo = new Set();
for (const b of vTxt.matchAll(/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g)) {
  // El set se guarda NORMALIZADO. Antes se guardaba el dbKey crudo y despues se
  // comparaba contra el nombre normalizado de la base, asi que no coincidia
  // nunca y el script reportaba que faltaban las 600 en vez de 49.
  for (const e of b[2].matchAll(/\n    (\d+): \{ v:/g)) codigo.add(`${norm(b[1])}|${e[1]}`);
}
const { rows: especies } = await db.query(`
  select e.especie_id, e.especie, coalesce(e.alias_riego,'') as alias
    from dim_especies e`);
const alias = new Map();
for (const e of especies) {
  alias.set(norm(e.especie_id), e.especie);
  alias.set(norm(e.especie), e.especie);
  if (e.alias) alias.set(norm(e.alias), e.especie);
}
const { rows: viab } = await db.query(`
  select d.especie, v.zona_agro_id::int as zona, v.viabilidad, v.razon
    from fact_viabilidad_zona v join dim_especies d on d.especie_id = v.especie_id`);

const faltan = viab.filter((v) => !codigo.has(`${norm(v.especie)}|${v.zona}`));
console.log(`   en la base: ${viab.length}   en el codigo: ${codigo.size}   FALTAN en el codigo: ${faltan.length}\n`);
const porZona = {};
for (const f of faltan) (porZona[f.zona] ??= []).push(f.especie);
console.log("   por zona:");
for (const [z, es] of Object.entries(porZona).sort((a, b) => a[0] - b[0])) {
  console.log(`      zona ${String(z).padStart(2)}: ${es.length} especies${es.length <= 3 ? " -> " + es.join(", ") : ""}`);
}
const porEspecie = {};
for (const f of faltan) (porEspecie[f.especie] ??= []).push(f.zona);
console.log("\n   por especie:");
for (const [e, zs] of Object.entries(porEspecie)) {
  console.log(`      ${e.padEnd(20)} le faltan ${zs.length} zonas: ${zs.join(",")}`);
}
console.log("\n   que veredicto tienen esas filas en la base:");
const conV = faltan.filter((f) => f.viabilidad && String(f.viabilidad).toUpperCase() !== "");
const sinV = faltan.filter((f) => !f.viabilidad);
console.log(`      con veredicto: ${conV.length}   sin veredicto: ${sinV.length}`);
const dist = {};
for (const f of conV) dist[f.viabilidad] = (dist[f.viabilidad] ?? 0) + 1;
console.log(`      reparto: ${JSON.stringify(dist)}`);

// ---------- 3. los consejos ----------
console.log("\n\n== 3. LOS CONSEJOS ==");
const { rows: conDb } = await db.query(`
  select d.especie, c.consejo, c.fuente
    from fact_consejos c join dim_especies d on d.especie_id = c.especie_id order by c.n`);
const fuentes = [...new Set(conDb.map((c) => c.fuente))];
console.log(`   en la base: ${conDb.length} consejos, ${new Set(conDb.map(c=>c.especie)).size} especies`);
console.log(`   fuentes declaradas: ${fuentes.map(f => `"${f}"`).join(", ")}`);
const porEsp = {};
for (const c of conDb) (porEsp[c.especie] ??= []).push(c.consejo);
const porOrden = Object.entries(porEsp).sort((a, b) => a[1].length - b[1].length);
console.log(`   con menos consejos: ${porOrden.slice(0, 3).map(([e, v]) => `${e} (${v.length})`).join(", ")}`);
console.log(`   con mas consejos: ${porOrden.slice(-3).map(([e, v]) => `${e} (${v.length})`).join(", ")}`);

const cTxt = readFileSync("lib/agronomy/consejos.ts", "utf8").replace(/\r\n/g, "\n");
const codigoCon = new Set();
for (const b of cTxt.matchAll(/\n  "([^"]+)": \[\n([\s\S]*?)\n  \],/g)) {
  for (const c of b[2].matchAll(/^\s*"((?:[^"\\]|\\.)*)",?$/gm)) codigoCon.add(JSON.parse(`"${c[1]}"`));
}
console.log(`   en el codigo: ${codigoCon.size} consejos, ${[...new Set([...cTxt.matchAll(/\n  "([^"]+)": \[/g)].map(x=>x[1]))].length} especies`);
const comunes = conDb.filter((c) => codigoCon.has(c.consejo));
console.log(`   consejos identicos en los dos: ${comunes.length}`);
if (comunes.length) console.log(`      ejemplo: "${comunes[0].consejo.slice(0, 80)}"`);
console.log(`   las ${conDb.length - comunes.length} filas de la base son texto que el usuario NO ve hoy`);

await db.end();