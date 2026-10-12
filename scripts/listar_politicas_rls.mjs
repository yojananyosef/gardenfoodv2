/**
 * Lista las politicas RLS que mencionan las columnas de la migracion 0044.
 *
 * Postgres no deja cambiar el tipo de una columna usada en una politica: el
 * error es `cannot alter type of a column used in a policy definition`. Hay que
 * quitar la politica, hacer el alter y volver a crearla.
 *
 * Este script imprime el `qual` y el `with_check` exactos de cada politica, para
 * poder copiarlos en la migracion sin reescribirlos de memoria.
 *
 * Uso: node scripts/listar_politicas_rls.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const OBJETIVO = ["gf_analytics_events", "gf_sponsorships"];
const COLUMNAS = ["event_category", "event_name", "screen", "payment_status"];

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: pol } = await db.query(`
  select schemaname, tablename, policyname, permissive, roles::text,
         coalesce(qual, '(null)') as qual,
         coalesce(with_check, '(null)') as with_check
    from pg_policies
   where schemaname = 'public' and tablename = any($1)
   order by tablename, policyname`, [OBJETIVO]);

console.log(`${pol.length} politicas en ${OBJETIVO.join(", ")}:\n`);

const bloqueantes = [];
for (const p of pol) {
  const texto = `${p.qual} ${p.with_check}`;
  // Postgres compara la dependencia por el nombre de la columna literal.
  const usa = COLUMNAS.filter((c) =>
    new RegExp(`(^|[^a-z_])${c}([^a-z_]|$)`, "i").test(texto),
  );
  const marca = usa.length ? `*** USA ${usa.join(", ")} ***` : "";
  if (usa.length) bloqueantes.push({ p, usa });
  console.log(`-- ${p.tablename}.${p.policyname}  (${p.permissive}, roles: ${p.roles})  ${marca}`);
  console.log(`   using      : ${p.qual}`);
  console.log(`   with_check : ${p.with_check}\n`);
}

console.log("== resumen ==");
if (!bloqueantes.length) console.log("   Ninguna politica menciona esas columnas. El alter deberia funcionar.");
else {
  console.log("   Hay que quitar y reponer estas politicas en la migracion:");
  for (const b of bloqueantes) console.log(`     ${b.p.tablename}.${b.p.policyname}  (usa ${b.usa.join(", ")})`);
}

// Como se ven las RLS activadas en esas tablas.
const { rows: rls } = await db.query(
  `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1) order by c.relname`,
  [OBJETIVO],
);
console.log("\n== RLS activada? ==");
for (const r of rls) console.log(`   ${r.relname}: relrowsecurity=${r.relrowsecurity}`);

await db.end();