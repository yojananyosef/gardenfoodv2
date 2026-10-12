/**
 * Lista las claves foraneas sin indice en la columna que referencian.
 *
 * Son 60 advisors de rendimiento de Supabase, la mayoria `unindexed_foreign_keys`.
 * Una FK sin indice no es un error: Postgres la usa para validar los inserts y
 * para el borrado en cascada. Lo que falta es el indice por el lado que
 * referencia, que es lo que hace que un JOIN o un filtro por esa columna
 * recorra la tabla entera.
 *
 * Hoy no duele nada porque las tablas son chicas. Duele cuando crecen, y las de
 * catálogos agronómicos estan pensadas para crecer.
 *
 * El script ordena por tamaño de tabla, que es donde el escaneo se paga.
 *
 * Uso: node scripts/listar_fks_sin_indice.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  with fks as (
    select c.conrelid, c.conrelid::regclass::text as tabla,
           c.conname, a.attname as columna
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and n.nspname = 'public'
       and array_length(c.conkey, 1) = 1
       and not exists (
         select 1 from pg_index i
          where i.indrelid = c.conrelid and i.indkey[0] = a.attnum and i.indnatts = 1
       )
  )
  select f.tabla, f.columna, f.conname, coalesce(s.n_live_tup, 0)::int as filas
    from fks f
    left join pg_stat_user_tables s on s.relid = f.conrelid
   order by filas desc, f.tabla, f.columna`);

console.log(`${rows.length} claves foraneas sin indice en la columna que referencian:\n`);
for (const r of rows) {
  console.log(`   ${r.tabla.padEnd(28)} ${r.columna.padEnd(20)} ${String(r.filas).padStart(6)} filas`);
}

const grandes = rows.filter((r) => r.filas >= 100);
console.log(`\n== de esas, ${grandes.length} estan en tablas de 100 filas o mas ==`);

console.log("\n== el SQL para arreglarlo ==");
console.log(
  rows
    .map(
      (r) =>
        `create index concurrently if not exists idx_${r.tabla}_${r.columna}\n  on ${r.tabla} (${r.columna});`,
    )
    .join("\n"),
);

await db.end();