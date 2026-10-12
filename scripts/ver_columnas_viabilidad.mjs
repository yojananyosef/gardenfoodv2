/** Columnas reales de las dos tablas de viabilidad y consejos, y una fila. */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

for (const t of ["fact_viabilidad_zona", "fact_consejos"]) {
  const r = await db.query(
    `select string_agg(column_name, ', ' order by ordinal_position) as c
       from information_schema.columns where table_name = $1`,
    [t],
  );
  console.log(`${t}:\n   ${r.rows[0].c}\n`);
}

const v = await db.query("select * from fact_viabilidad_zona limit 2");
console.log("ejemplo de fact_viabilidad_zona:");
for (const row of v.rows) {
  for (const [k, val] of Object.entries(row)) {
    console.log(`   ${k.padEnd(20)} ${String(val).slice(0, 62)}`);
  }
  console.log("");
}

const c = await db.query("select * from fact_consejos limit 2");
console.log("ejemplo de fact_consejos:");
for (const row of c.rows) {
  for (const [k, val] of Object.entries(row)) {
    console.log(`   ${k.padEnd(20)} ${String(val).slice(0, 62)}`);
  }
  console.log("");
}

await db.end();