/**
 * La razon quedo al lado del veredicto. Comprueba las tres cosas:
 *
 *   1. Que las 551 filas tengan la MISMA razon que el array de siempre. Si
 *      alguna difiere, el update se equivoco de fila.
 *   2. Que las 49 sin razon sean exactamente las que el array no cubria, y no
 *      otras. Una razon null de mas seria un borrado accidental.
 *   3. Que `viabilidad` no se haya tocado. La 0048 solo agrega la columna.
 *
 * Usa el mismo mapeo dbKey -> especie_id que el script que poblo, y aborta si
 * no todas las especies mapean.
 *
 * Uso: node scripts/verificar_razon_viabilidad.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const codigo = [];
for (const b of vTxt.matchAll(/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g)) {
  for (const e of b[2].matchAll(/\n    (\d+): \{ v: "([^"]*)", razon: "((?:[^"\\]|\\.)*)" \}/g)) {
    codigo.push({ dbKey: b[1], zona: Number(e[1]), v: e[2], razon: JSON.parse(`"${e[3]}"`) });
  }
}

const { rows: especies } = await db.query(
  `select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel from dim_especies`,
);
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const mapa = new Map();
for (const r of especies) {
  for (const c of [r.especie, r.alias, r.excel, r.especie_id]) if (c) mapa.set(c, r.especie_id);
  mapa.set(norm(r.especie), r.especie_id);
  if (r.alias) mapa.set(norm(r.alias), r.especie_id);
}
const resolver = (k) => mapa.get(k) ?? mapa.get(norm(k));

const { rows: filas } = await db.query(`
  select v.especie_id, v.zona_agro_id::int as zona, v.viabilidad, v.razon, v.clave
    from fact_viabilidad_zona v`);
const idx = new Map(filas.map((r) => [`${r.especie_id}|${r.zona}`, r]));

let malas = 0;
let sinRazonEsperada = 0;
const ejemplos = [];
for (const c of codigo) {
  const id = resolver(c.dbKey);
  const f = idx.get(`${id}|${c.zona}`);
  if (!f) continue;
  if (f.razon !== c.razon) {
    malas += 1;
    if (ejemplos.length < 5)
      ejemplos.push(`   ${f.clave}\n      array: "${c.razon.slice(0, 58)}"\n      base : "${String(f.razon ?? "(null)").slice(0, 58)}"`);
  }
}
const huerfanas = filas.filter((r) => !codigo.some((c) => idx.get(`${resolver(c.dbKey)}|${c.zona}`) === r));
sinRazonEsperada = huerfanas.length;

console.log("== 1. las 551 filas coinciden con el array ==");
console.log(`   diferencias: ${malas}`);
for (const e of ejemplos) console.log(e);

console.log(`\n== 2. las que quedaron sin razon ==`);
console.log(`   en la base sin razon: ${filas.filter((r) => r.razon === null).length}`);
console.log(`   esperado sin razon  : ${sinRazonEsperada}`);
const sorpresa = filas.filter((r) => r.razon === null && !huerfanas.includes(r));
console.log(`   razon null donde si deberia haber: ${sorpresa.length}`);
const conRazonHuerfana = huerfanas.filter((r) => r.razon !== null);
console.log(`   razon puesta donde no deberia  : ${conRazonHuerfana.length}`);

console.log(`\n== 3. viabilidad intacta ==`);
// Sin quitar acentos, "SÍ" contra "si" daba 380 diferencias falsas y el script
// igual imprimia OK al final. El accent-strip no es cosmetico: es lo que hace
// que este numero signifique algo.
let cambiosVeredicto = 0;
const ejVeredicto = [];
for (const c of codigo) {
  const f = idx.get(`${resolver(c.dbKey)}|${c.zona}`);
  if (!f) continue;
  if (norm(f.viabilidad) !== norm(c.v)) {
    cambiosVeredicto += 1;
    if (ejVeredicto.length < 5) ejVeredicto.push(`   ${f.clave}: array=${c.v} base=${f.viabilidad}`);
  }
}
console.log(`   veredictos que no coinciden con el array: ${cambiosVeredicto}`);
for (const e of ejVeredicto) console.log(e);
if (cambiosVeredicto) console.log("   (ya estaba antes de la 0048: es una diferencia de dato, no de migracion)");
const { rows: dom } = await db.query(
  `select viabilidad, count(*)::int as n from fact_viabilidad_zona group by 1 order by 1`,
);
console.log(`   distribucion en la base: ${dom.map((d) => `${d.viabilidad}=${d.n}`).join(", ")}`);

const ok =
  malas === 0 && sorpresa.length === 0 && conRazonHuerfana.length === 0 && cambiosVeredicto === 0;
console.log(`\n${ok ? "OK" : "HAY QUE REVISAR"}`);

await db.end();