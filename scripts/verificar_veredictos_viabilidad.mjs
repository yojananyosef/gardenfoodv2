/**
 * Las 336 "diferencias" de viabilidad, cuantas son de verdad.
 *
 * La base escribe "SI" con tilde y mayuscula; el codigo escribe "si". Con
 * `.toLowerCase()` aparecen 336 diferencias, y los ejemplos son todos
 * si contra SI. Este script separa el ruido del formato de los cambios reales
 * de veredicto, que son los que importan: si la base dice NO donde el codigo
 * decia si, migrar cambia lo que el usuario ve.
 *
 * Tambien separa las claves que no matchean por el nombre de la especie (el
 * codigo usa dbKey, como "Arandano"; la base trae el nombre de dim_especies)
 * de las que faltan de verdad.
 *
 * Uso: node scripts/verificar_veredictos_viabilidad.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const codigo = new Map();
for (const b of vTxt.matchAll(/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g)) {
  for (const e of b[2].matchAll(/\n    (\d+): \{ v: "([^"]*)", razon:/g)) {
    codigo.set(`${b[1]}|${e[1]}`, e[2].toLowerCase());
  }
}

const { rows } = await db.query(`
  select d.especie, d.nombre_en_excel_riego, d.alias_riego,
         v.zona_agro_id::int as zona, v.viabilidad
    from fact_viabilidad_zona v join dim_especies d on d.especie_id = v.especie_id`);

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const codigoNorm = new Map([...codigo].map(([k, v]) => [norm(k.split("|")[0]) + "|" + k.split("|")[1], v]));
const dbNorm = new Map(rows.map((r) => [norm(r.especie) + "|" + r.zona, String(r.viabilidad).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()]));

const comunes = [...codigoNorm.keys()].filter((k) => dbNorm.has(k));
console.log(`codigo: ${codigo.size}   base: ${rows.length}   comparables: ${comunes.length}\n`);

let cambios = 0;
const ejemplos = [];
for (const k of comunes) {
  if (codigoNorm.get(k) !== dbNorm.get(k)) {
    cambios += 1;
    if (ejemplos.length < 12) ejemplos.push(`   ${k}: codigo=${codigoNorm.get(k)} base=${dbNorm.get(k)}`);
  }
}
console.log(`== CAMBIOS REALES DE VEREDICTO: ${cambios} ==`);
for (const e of ejemplos) console.log(e);

const soloCodigo = [...codigoNorm.keys()].filter((k) => !dbNorm.has(k));
const soloBase = [...dbNorm.keys()].filter((k) => !codigoNorm.has(k));
console.log(`\nsolo en el codigo (${soloCodigo.length}): ${soloCodigo.slice(0, 10).join(", ")}`);
console.log(`solo en la base   (${soloBase.length}): ${soloBase.slice(0, 10).join(", ")}`);

// Como se ven los nombres: el codigo usa dbKey y la base el nombre de la tabla.
console.log("\n== nombres: codigo (dbKey) vs base (dim_especies.especie) ==");
const { rows: nom } = await db.query(`select especie, alias_riego, nombre_en_excel_riego from dim_especies order by especie_id`);
const clavesCodigo = [...new Set([...codigo.keys()].map((k) => k.split("|")[0]))];
for (const n of nom) {
  if (!clavesCodigo.some((c) => norm(c) === norm(n.especie))) {
    console.log(`   base=${n.especie.padEnd(20)} alias=${n.alias_riego ?? "-"} excel=${n.nombre_en_excel_riego ?? "-"}`);
  }
}

await db.end();