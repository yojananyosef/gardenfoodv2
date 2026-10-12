/**
 * Compara `gf_riego_kc` contra `dim_etapas` antes de borrar la primera.
 *
 * Que el codigo no lea una tabla no significa que su contenido este en otro
 * lado. Las 8 filas de `gf_riego_kc` son el coeficiente Kc de cada etapa
 * fenologica, y `dim_etapas` se supone que las reemplaza. Si no coinciden, el
 * `drop table` pierde informacion real y no hay forma de recuperarla.
 *
 * Uso: node scripts/comparar_kc_con_dim_etapas.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
if (!m) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: kcCols } = await db.query(
  `select column_name from information_schema.columns where table_name = 'dim_etapas' order by ordinal_position`,
);
console.log(`dim_etapas columnas: ${kcCols.map((c) => c.column_name).join(", ")}`);

const { rows: et } = await db.query(`select * from dim_etapas order by 1`);
const { rows: kc } = await db.query(`select codigo, descripcion, kc from gf_riego_kc order by codigo`);
console.log(`dim_etapas filas=${et.length}   gf_riego_kc filas=${kc.length}`);

const colCodigo = ["codigo_etapa", "codigo", "etapa", "nombre"].find((c) =>
  kcCols.some((x) => x.column_name === c),
);
const colDesc = ["descripcion", "lo_que_ve", "nombre", "etapa"].find((c) =>
  kcCols.some((x) => x.column_name === c),
);
const colKc = ["kc", "kc_referencial", "coef_kc"].find((c) =>
  kcCols.some((x) => x.column_name === c),
);
console.log(`usando: codigo=${colCodigo} descripcion=${colDesc} kc=${colKc}`);

const { rows: tipos } = await db.query(
  `select column_name, data_type from information_schema.columns where table_name = 'dim_etapas' and column_name = any($1)`,
  [[colKc, colDesc].filter(Boolean)],
);
for (const t of tipos) console.log(`  tipo de ${t.column_name}: ${t.data_type}`);
console.log();

/**
 * `gf_riego_kc.kc` es numeric, as que la celda `—` de la hoja quedo como NULL.
 * `dim_etapas.kc_referencial` es text y conserva el `—`. Son la misma
 * ausencia de dato escrita de dos formas, asi que se comparan como iguales.
 */
const vacio = (v) => v === null || v === undefined || String(v).trim() === "" || String(v).trim() === "—";

const porCodigo = new Map(et.map((e) => [String(e[colCodigo]), e]));
console.log("codigo | kc viejo -> kc dim_etapas | descripcion vieja -> lo_que_ve | veredicto");
let faltantes = 0, distintos = 0;
for (const r of kc) {
  const e = porCodigo.get(r.codigo);
  if (!e) {
    console.log(`  ${r.codigo.padEnd(6)} | FALTA LA ETAPA EN dim_etapas`);
    faltantes++;
    continue;
  }
  const kcIgual = vacio(r.kc) && vacio(e[colKc])
    ? true
    : String(e[colKc]) === String(r.kc);
  const descIgual = !colDesc
    ? false
    : normal(e[colDesc]) === normal(r.descripcion);
  if (!kcIgual || !descIgual) distintos++;
  const veredicto = kcIgual && descIgual ? "ok" : `kc:${kcIgual ? "ok" : "DIFIERE"} desc:${descIgual ? "ok" : "DIFIERE"}`;
  console.log(
    `  ${r.codigo.padEnd(6)} | ${String(r.kc).padEnd(6)} -> ${String(e[colKc]).padEnd(6)} | ${normal(r.descripcion).slice(0, 30).padEnd(32)} -> ${normal(e[colDesc]).slice(0, 30).padEnd(32)} | ${veredicto}`,
  );
}

function normal(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

console.log(`\netapas ausentes en dim_etapas: ${faltantes}   con diferencia: ${distintos}`);
if (faltantes || distintos) {
  console.log("\n*** NO se puede borrar gf_riego_kc: la informacion no esta completa en dim_etapas.");
} else {
  console.log("\nOK: dim_etapas tiene las 8 etapas con el mismo kc. Borrar gf_riego_kc no pierde datos.");
}

await db.end();