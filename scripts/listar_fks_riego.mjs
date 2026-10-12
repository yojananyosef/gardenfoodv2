/**
 * Lista las claves foraneas reales de las dos tablas fact_riego_*.
 *
 * El plan (Fase 10.4) pide agregar 4 FKs. El chequeo dijo que ya existen, y
 * ese punto del plan se escribio antes de la migracion 0037, que creo estas
 * tablas desde cero. Conviene ver los nombres y las columnas exactas antes de
 * cerrar el punto como ya cumplido, para no confiar en un `like` del nombre.
 *
 * Uso: node scripts/listar_fks_riego.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  select con.conname,
         con.conrelid::regclass::text  as desde,
         con.confrelid::regclass::text as hacia,
         con.convalidated as validada,
         (select string_agg(att.attname, ', ' order by k.ord)
            from unnest(con.conkey) with ordinality as k(attnum, ord)
            join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum) as columnas
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
   where con.contype = 'f' and n.nspname = 'public'
     and (con.conrelid::regclass::text like 'fact_riego%'
       or con.conrelid::regclass::text like 'gf_riego%'
       or con.conrelid::regclass::text like 'fact_fert%')
   order by desde, conname`);

console.log(`${rows.length} claves foraneas en las tablas de riego y fertilizacion:\n`);
for (const r of rows) {
  console.log(
    `   ${r.desde.padEnd(22)} ${r.columnas.padEnd(24)} -> ${r.hacia.padEnd(20)} ${r.validada ? "validada" : "NO validada"}   (${r.conname})`,
  );
}

const sinFk = await db.query(`
  select c.relname as nombre
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and (c.relname like 'fact_riego%' or c.relname like 'gf_riego%' or c.relname like 'fact_fert%')
     and not exists (select 1 from pg_constraint k where k.contype = 'f' and k.conrelid = c.oid)
   order by c.relname`);
console.log(`\ntablas de riego/fertilizacion sin ninguna FK: ${sinFk.rows.length ? sinFk.rows.map((r) => r.nombre).join(", ") : "ninguna"}`);

await db.end();