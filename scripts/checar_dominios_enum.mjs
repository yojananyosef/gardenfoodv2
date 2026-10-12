/**
 * Verifica los dominios de las columnas que la Fase 10.2 quiere convertir en enum.
 *
 * Agregar un enum es una decision de dominio, no un detalle de tipo: si el
 * `alter column ... type` falla es porque hay un valor fuera del dominio, y
 * "ampliar el enum para que pase" convierte el enum en decoracion. Este script
 * dice, por columna, cuales son los valores reales, cuantos hay y cuales caen
 * fuera del dominio que propone el plan.
 *
 * Tambien avisa de los NULL: un enum admite NULL, pero si el codigo espera
 * `string` y pasa a esperar el union, los nulos se vuelven mas visibles de lo
 * que eran.
 *
 * Uso: node scripts/checar_dominios_enum.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

/** Dominios que propone el plan 10.2. Los de pagos se excluded a proposito. */
const OBJETIVO = [
  {
    tabla: "gf_analytics_events",
    columna: "event_category",
    dominio: ["PRODUCT_USAGE", "AD_INTERACTION", "CMP_CONSENT", "COMMERCE_INTENT"],
  },
  {
    tabla: "gf_analytics_events",
    columna: "event_name",
    dominio: [
      "VIEW_FICHA", "PAGE_VIEW", "CALCULATOR_SUBMIT", "AD_IMPRESSION", "AD_CLICK",
      "SEARCH_INP", "CMP_CONSENT_GRANTED", "CMP_CONSENT_UPDATED", "INPUT_QUOTE",
    ],
  },
  { tabla: "gf_sponsorships", columna: "screen", dominio: ["explorar", "huerto", "ficha", "calendario"] },
  {
    tabla: "gf_sponsorships",
    columna: "payment_status",
    dominio: ["unpaid", "pending", "paid", "failed"],
  },
];

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

let fueraDeDominio = 0;
let conNulos = 0;

for (const o of OBJETIVO) {
  console.log(`\n== ${o.tabla}.${o.columna} ==`);

  const { rows: tipo } = await db.query(
    `select data_type, udt_name, is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [o.tabla, o.columna],
  );
  if (!tipo.length) {
    console.log("   LA COLUMNA NO EXISTE");
    fueraDeDominio++;
    continue;
  }
  console.log(`   tipo actual: ${tipo[0].data_type}  (${tipo[0].udt_name}), nullable=${tipo[0].is_nullable}`);

  const { rows } = await db.query(
    `select coalesce("${o.columna}"::text, '(null)') as valor, count(*)::int as n
       from "${o.tabla}" group by 1 order by n desc, 1`,
  );

  const reales = rows.filter((r) => r.valor !== "(null)").map((r) => r.valor);
  const nulos = rows.find((r) => r.valor === "(null)");

  for (const r of rows) {
    if (r.valor === "(null)") {
      console.log(`   ${"(null)".padEnd(22)} ${String(r.n).padEnd(7)} NULL`);
      continue;
    }
    const ok = o.dominio.includes(r.valor);
    if (!ok) fueraDeDominio += r.n;
    console.log(
      `   ${r.valor.padEnd(22)} ${String(r.n).padEnd(7)} ${ok ? "" : "*** FUERA DEL DOMINIO ***"}`,
    );
  }
  if (nulos) conNulos += nulos.n;

  const noUsados = o.dominio.filter((d) => !reales.includes(d));
  if (noUsados.length) console.log(`   en el dominio pero sin usar: ${noUsados.join(", ")}`);
}

console.log("\n== resumen ==");
console.log(`   filas fuera del dominio: ${fueraDeDominio}`);
console.log(`   filas en NULL: ${conNulos}`);
console.log(
  fueraDeDominio
    ? "\n*** No aplicar el cast todavia: hay valores fuera del dominio."
    : "\nOK: todos los valores caben en el dominio del plan. El cast no falla.",
);
if (conNulos) {
  console.log("   Ojo: hay NULLs. Un enum los admite, pero el tipo pasa de string a");
  console.log("   union y el codigo que las espera como string va a pedir revision.");
}

await db.end();