/**
 * Compara VIABILIDAD y CONSEJOS del codigo contra sus tablas.
 *
 * VIABILIDAD son 30 especies x 20 zonas = 600 entradas, y fact_viabilidad_zona
 * tiene 600 filas. CONSEJOS tiene 211 y fact_consejos 211. El numero calza, que
 * no dice nada del contenido: eso se compara aqui.
 *
 * A diferencia de las especies, aca no hay conflicto de vocabulario: `v` es
 * "si"/"riesgo"/"no" en los dos lados y la razon es texto libre en los dos.
 * Asi que la migracion deberia ser exacta, no "casi exacta".
 *
 * Uso: node scripts/comparar_viabilidad_consejos.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

// --- codigo ---
const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const cTxt = readFileSync("lib/agronomy/consejos.ts", "utf8").replace(/\r\n/g, "\n");

const codigoViab = [];
for (const b of vTxt.matchAll(/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g)) {
  const [, dbKey, cuerpo] = b;
  for (const e of cuerpo.matchAll(/\n    (\d+): \{ v: "([^"]*)", razon: "((?:[^"\\]|\\.)*)" \}/g)) {
    codigoViab.push({
      dbKey,
      zona: Number(e[1]),
      v: e[2],
      razon: JSON.parse(`"${e[3]}"`),
    });
  }
}

const codigoConsejos = [];
for (const b of cTxt.matchAll(/\n  "([^"]+)": \[\n([\s\S]*?)\n  \],/g)) {
  const [, dbKey, cuerpo] = b;
  for (const c of cuerpo.matchAll(/^\s*"((?:[^"\\]|\\.)*)",?$/gm)) {
    codigoConsejos.push({ dbKey, consejo: JSON.parse(`"${c[1]}"`) });
  }
}

// --- base ---
const { rows: viabDb } = await db.query(`
  select d.especie, v.zona_agro_id::int as zona, v.viabilidad
    from fact_viabilidad_zona v join dim_especies d on d.especie_id = v.especie_id`);
const { rows: conDb } = await db.query(`
  select d.especie, c.consejo, c.fuente, c.n::int as n
    from fact_consejos c join dim_especies d on d.especie_id = c.especie_id
   order by d.especie, c.n`);

console.log("== VIABILIDAD ==");
console.log(`   codigo: ${codigoViab.length}   base: ${viabDb.length}\n`);
const clave = (x) => `${x.dbKey ?? x.especie}|${x.zona}`;
const mapaCodigo = new Map(codigoViab.map((x) => [clave(x), x]));
const mapaDb = new Map(viabDb.map((x) => [clave(x), x]));
console.log(`   claves que matchean: ${[...mapaCodigo.keys()].filter((k) => mapaDb.has(k)).length}`);
console.log(`   solo en el codigo  : ${[...mapaCodigo.keys()].filter((k) => !mapaDb.has(k)).slice(0, 8).join(", ") || "ninguna"}`);
console.log(`   solo en la base    : ${[...mapaDb.keys()].filter((k) => !mapaCodigo.has(k)).slice(0, 8).join(", ") || "ninguna"}`);

let difV = 0;
const ejemploV = [];
for (const [k, c] of mapaCodigo) {
  const d = mapaDb.get(k);
  if (!d) continue;
  // El codigo usa "si"/"no"/"riesgo" en minuscula y la base "SI"/"NO"/"RIESGO".
  if (c.v.toLowerCase() !== String(d.viabilidad).toLowerCase()) {
    difV += 1;
    if (ejemploV.length < 8) ejemploV.push(`   ${k}: codigo=${c.v} base=${d.viabilidad}`);
  }
}
console.log(`\n   diferencias de viabilidad (ignorando mayusculas): ${difV}`);
for (const e of ejemploV) console.log(e);

// La razon NO existe en la tabla. Ver cuantas hay distintas en el codigo.
const razones = new Map();
for (const x of codigoViab) {
  razones.set(x.razon, (razones.get(x.razon) ?? 0) + 1);
}
const masRepetidas = [...razones.entries()].sort((a, b) => b[1] - a[1]);
console.log(`\n   LA RAZON NO ESTA EN LA TABLA`);
console.log(`   600 entradas -> ${razones.size} textos distintos`);
console.log(`   los 6 mas repetidos:`);
for (const [r, n] of masRepetidas.slice(0, 6)) {
  console.log(`      ${String(n).padStart(3)}x  "${r.slice(0, 62)}"`);
}
const sinRazon = masRepetidas.filter(([, n]) => n >= 8);
console.log(`   los que se repiten 8+ veces: ${sinRazon.length} textos, cubren ${sinRazon.reduce((a, [, n]) => a + n, 0)} de las 600 entradas`);

console.log("\n== columnas de fact_viabilidad_zona ==");
const { rows: cols } = await db.query(`
  select string_agg(column_name, ', ' order by ordinal_position) as c
    from information_schema.columns where table_name = 'fact_viabilidad_zona'`);
console.log(`   ${cols[0].c}`);

console.log("\n\n== CONSEJOS ==");
console.log(`   codigo: ${codigoConsejos.length}   base: ${conDb.length}`);
const conCodigo = new Set(codigoConsejos.map((x) => `${x.dbKey}|${x.consejo}`));
const conBase = new Set(conDb.map((x) => `${x.especie}|${x.consejo}`));
const comunes = [...conCodigo].filter((k) => conBase.has(k));
console.log(`   consejos identicos en los dos: ${comunes.length} de ${codigoConsejos.length}`);
console.log(`   solo en el codigo: ${[...conCodigo].filter((k) => !conBase.has(k)).slice(0, 3).join(" / ")}`);
console.log(`   solo en la base  : ${[...conBase].filter((k) => !conCodigo.has(k)).slice(0, 3).join(" / ")}`);
const { rows: ccols } = await db.query(`
  select string_agg(column_name, ', ' order by ordinal_position) as c
    from information_schema.columns where table_name = 'fact_consejos'`);
console.log(`   columnas: ${ccols[0].c}`);

await db.end();