/**
 * Antes de poblar `fact_viabilidad_zona.razon`, comprueba que se puede mapear
 * cada especie del codigo a su `especie_id`.
 *
 * El codigo usa `dbKey` ("Avellano Europeo", con mayuscula y especifico) y la
 * base usa `especie_id` ("avellano", en minuscula). Son tres nombres distintos
 * por especie: `especie_id`, `especie` y `alias_riego`.
 *
 * Si el mapeo falla, la fila se queda sin razon y no se nota: es el mismo modo
 * de fallo silencioso que ya encontramos en `index.ts:99`. Asi que se valida
 * antes y el script aborta si algo no cuadra.
 *
 * Uso: node scripts/mapeo_dbkey_a_especie.mjs
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const dbKeys = [...new Set([...vTxt.matchAll(/\n  "([^"]+)": \{/g)].map((x) => x[1]))];
console.log(`dbKey en el codigo: ${dbKeys.length}\n`);

const { rows } = await db.query(
  `select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel
     from dim_especies order by especie_id`,
);

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const porNorm = new Map();
for (const r of rows) {
  for (const campo of [r.especie_id, r.especie, r.alias, r.excel]) {
    if (campo) porNorm.set(norm(campo), r.especie_id);
  }
}

console.log("== como se mapea cada dbKey ==");
const fallidos = [];
const metodos = {};
for (const k of dbKeys) {
  const exacto = rows.find((r) => r.especie === k || r.alias === k);
  const id = exacto?.especie_id ?? porNorm.get(norm(k));
  const metodo = exacto
    ? exacto.especie === k
      ? "especie"
      : "alias_riego"
    : id
      ? "normalizado"
      : "NINGUNO";
  metodos[metodo] = (metodos[metodo] ?? 0) + 1;
  if (!id) fallidos.push(k);
  else if (metodo !== "especie") console.log(`   ${k.padEnd(22)} -> ${id.padEnd(20)} (${metodo})`);
}

console.log(`\nresumen: ${JSON.stringify(metodos)}`);
if (fallidos.length) {
  console.log(`\nNO SE PUDO MAPEAR ${fallidos.length}:`);
  for (const f of fallidos) console.log(`   ${f}`);
  process.exitCode = 1;
} else {
  console.log("\nlas 30 se mapean");
}

// Las 87 combinaciones que el codigo no tiene: si van a quedar sin razon, hay
// que saber cuales son antes de llenar la columna.
const zonas = new Map();
for (const b of vTxt.matchAll(/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g)) {
  for (const e of b[2].matchAll(/\n    (\d+): \{ v:/g)) {
    zonas.set(`${norm(b[1])}|${e[1]}`, true);
  }
}
const { rows: vdb } = await db.query(
  `select v.especie_id, v.zona_agro_id::int as zona from fact_viabilidad_zona v`,
);
const huerfanas = vdb.filter((r) => !zonas.has(`${norm(r.especie_id)}|${r.zona}`));
console.log(`\ncombinaciones que quedarian SIN razon: ${huerfanas.length} de ${vdb.length}`);
const porZona = {};
for (const h of huerfanas) porZona[h.zona] = (porZona[h.zona] ?? 0) + 1;
console.log(`   por zona: ${JSON.stringify(porZona)}`);

await db.end();