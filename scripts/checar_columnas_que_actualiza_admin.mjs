/**
 * Comprueba que las columnas que el panel de admin intenta actualizar existan
 * de verdad en perfiles.
 *
 * Los tres sitios que fallan con el cliente tipado arman un
 * `Record<string, unknown>` y se lo pasan a `.update()`. Con el cliente sin
 * tipar eso no se nota: Postgres acepta lo que le manden y contesta con un
 * error en tiempo de ejecucion, o peor, acepta el update de las columnas que si
 * existen e ignora las que no.
 *
 * Aqui se comprueba columna por columna contra el esquema real.
 *
 * Uso: node scripts/checar_columnas_que_actualiza_admin.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: cols } = await db.query(`
  select column_name from information_schema.columns
   where table_name = 'perfiles' order by column_name`);
const existe = new Set(cols.map((c) => c.column_name));

console.log("== columnas reales de perfiles ==");
console.log(`   ${[...existe].join(", ")}\n`);

// Se leen de los tres archivos que arman el update, no de memoria.
const archivos = [
  "app/api/v1/admin/users/[id]/route.ts",
  "app/api/v1/payments/subscribe/status/route.ts",
  "app/api/v1/payments/webhook/route.ts",
  "app/(dashboard)/admin/usuarios/page.tsx",
];

console.log("== que escribe cada archivo ==");
const usadas = new Set();
for (const f of archivos) {
  let txt;
  try {
    txt = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const updates = [...txt.matchAll(/\.update\(\s*([A-Za-z_$][\w$]*)/g)].map((x) => x[1]);
  const props = [...txt.matchAll(/update\.([a-z_]+)\s*=/g)].map((x) => x[1]);
  const inline = [...txt.matchAll(/\.update\(\s*\{([^}]*)\}/g)]
    .flatMap((x) => x[1].split(",").map((p) => p.split(":")[0].trim()))
    .filter(Boolean);
  const todas = [...new Set([...props, ...inline])];
  for (const p of todas) usadas.add(p);
  console.log(`   ${f}`);
  console.log(`      update(${updates.join(", ")})  campos: ${todas.join(", ") || "(ninguno legible)"}`);
}

console.log("\n== esas columnas existen? ==");
let malas = 0;
for (const c of [...usadas].sort()) {
  const ok = existe.has(c);
  if (!ok) malas += 1;
  console.log(`   ${ok ? "ok    " : "NO EXISTE"}  perfiles.${c}`);
}
console.log(`\n   ${malas} columnas que el codigo escribe y no existen`);

await db.end();