/**
 * Revisa si las 33 FKs sin indice de una columna ya estan cubiertas por un
 * indice COMPUESTO que empiece por esa columna.
 *
 * Hace falta antes de crear indices, porque un indice `(especie_id, mes_n)`
 * ya sirve tanto para filtrar por especie como para validar la FK de
 * especie_id. Crear un indice de una sola columna encima seria redundante.
 *
 * El advisor de Supabase no lo ve asi: pide un indice de una columna y marca
 * como faltante todo lo que no lo sea, aunque un compuesto lo cubra.
 *
 * Uso: node scripts/fks_sin_indice_reales.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  with fks as (
    select c.conrelid, c.conrelid::regclass::text as tabla,
           a.attname as columna, a.attnum
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and n.nspname = 'public'
       and array_length(c.conkey, 1) = 1
       and not exists (
         select 1 from pg_index i
          where i.indrelid = c.conrelid
            and i.indnatts = 1
            and i.indkey[0] = a.attnum
       )
  ), cubiertas as (
    select f.tabla, f.columna,
           (select string_agg(ic.relname, ', ')
              from pg_index i
              join pg_class ic on ic.oid = i.indexrelid
             where i.indrelid = f.conrelid
               and i.indkey[0] = f.attnum
               and i.indnatts > 1) as compuestas
      from fks f
  )
  select tabla, columna, compuestas from cubiertas
   where compuestas is not null
   order by tabla, columna`);

const { rows: todas } = await db.query(`
  with fks as (
    select c.conrelid, c.conrelid::regclass::text as tabla, a.attname as columna, a.attnum
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and n.nspname = 'public'
       and array_length(c.conkey, 1) = 1
       and not exists (
         select 1 from pg_index i
          where i.indrelid = c.conrelid and i.indnatts = 1 and i.indkey[0] = a.attnum)
  )
  select f.tabla, f.columna,
         (select string_agg(ic.relname, ', ')
            from pg_index i join pg_class ic on ic.oid = i.indexrelid
           where i.indrelid = f.conrelid and i.indkey[0] = f.attnum and i.indnatts > 1) as compuestas
    from fks f order by tabla, columna`);

console.log(`FKs sin indice propio de una columna: ${todas.length}\n`);
console.log("== YA CUBIERTAS por un indice compuesto (no hay que crear nada) ==");
for (const r of rows) {
  console.log(`   ${(r.tabla + "." + r.columna).padEnd(42)} <- ${r.compuestas}`);
}
console.log(`   (${rows.length} de ${todas.length})\n`);

console.log("== HAY QUE CREAR indice para estas ==");
const faltan = todas.filter((r) => !r.compuestas);
for (const r of faltan) console.log(`   ${(r.tabla + "." + r.columna).padEnd(42)}`);
console.log(`   (${faltan.length} de ${todas.length})`);

await db.end();