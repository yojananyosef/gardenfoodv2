/**
 * Dice a que base se conecta cada acceso, para no comparar peras con manzanas.
 *
 * La migracion 0040 fallo con `"gf_riego_kc" is not a table`, cuando la tabla
 * existe y tiene 8 filas segun lo consultado antes. O el `DATABASE_URL` de
 * `.env.local` no apunta a la misma base que el proyecto de Supabase, o el
 * nombre resuelve a otra cosa. Esto imprime las dos cosas.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env);
const url = m[1].trim();

// El host sin las credenciales, que es lo unico que hay que mostrar.
const host = new URL(url.replace("postgres://", "postgres://u:p@")).host;

console.log(`DATABASE_URL host: ${host}`);
console.log(`  proyecto MCP: ayhpmsocohrorabvrmow`);

const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: ident } = await db.query(`
  select current_database() as db,
         current_user as usuario,
         current_schema() as esquema,
         current_setting('search_path') as search_path,
         inet_server_addr()::text as servidor,
         inet_server_port() as puerto`);
console.log("\n== a donde conecto ==");
for (const [k, v] of Object.entries(ident[0])) console.log(`   ${k}: ${v}`);

const { rows: obj } = await db.query(`
  select n.nspname as esquema, c.relname as nombre, c.relkind as tipo
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relname in ('gf_riego_kc','dim_etapas','gf_fertilizacion_programa')
   order by c.relname`);
console.log("\n== objetos con esos nombres ==");
for (const o of obj) console.log(`   ${o.esquema}.${o.nombre}  (${o.tipo})`);

const { rows: n } = await db.query(`select count(*)::int as c from gf_riego_kc`);
console.log(`\ngf_riego_kc filas en ESTA base: ${n[0].c}`);

const { rows: tablas } = await db.query(
  `select count(*)::int as c from information_schema.tables where table_schema = current_schema() and table_type = 'BASE TABLE'`,
);
console.log(`tablas en ${ident[0].esquema}: ${tablas[0].c}`);

await db.end();