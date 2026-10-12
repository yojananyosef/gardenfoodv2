/**
 * La hoja API_RESPUESTAS llego a la base?
 *
 * API_RESPUESTAS tiene 6.480 filas: 30 especies x 18 zonas de riego x 12 meses.
 * Cada fila trae la respuesta YA CALCULADA (litros, dias, fertilizacion, tareas,
 * consejo) mas columnas `h_*` que dicen de que fila de que tabla salio cada
 * numero. O sea: el Excel ya tiene hecho el join que la app hace en runtime.
 *
 * Este script lista las tablas del esquema y dice si hay alguna que venga de ahi.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  select table_name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
   order by table_name`);

console.log(`== ${rows.length} tablas en el esquema ==\n`);
const nombres = rows.map((r) => r.table_name);
const api = nombres.filter((t) => /api|respuesta|consulta/i.test(t));
console.log("tablas que podrian venir de API_RESPUESTAS:");
console.log(api.length ? api.map((t) => `   ${t}`).join("\n") : "   NINGUNA. La hoja no se importo.");
console.log(`\ntodas:\n${nombres.map((t) => `   ${t}`).join("\n")}`);

console.log("\n== las fact_* que si se importaron, y cuanto cubren ==");
for (const t of nombres.filter((n) => n.startsWith("fact_"))) {
  const { rows: c } = await db.query(`select count(*)::int as n from ${t}`);
  console.log(`   ${t.padEnd(28)} ${String(c[0].n).padStart(5)} filas`);
}

await db.end();