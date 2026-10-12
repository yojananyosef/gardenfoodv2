/**
 * Recarga el schema cache de PostgREST.
 *
 * Cuando se hace un ALTER TABLE en la base, PostgREST no se entera solo: sigue
 * sirviendo el esquema que tinha cacheado. El sintoma es desconcertante porque
 * la columna SI existe:
 *
 *   - por pg la consulta funciona
 *   - por REST sale PGRST204 "Could not find the 'x' column in the schema cache"
 *
 *asi que parece que la migracion no sirvio, cuando si.
 *
 * En Supabase el cache se recarga solo a veces. Este script lo fuerza con el
 * NOTIFY que PostgREST escucha.
 *
 * Uso: node scripts/recargar_schema_postgrest.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: antes } = await db.query(`
  select count(*)::int as n
    from information_schema.columns
   where table_name = 'gf_analytics_events'
     and column_name in ('comuna','region','zona_agroclimatica')`);
console.log(`columnas de geo en Postgres: ${antes[0].n} de 3`);

if (antes[0].n < 3) {
  console.log("   -> faltan columnas en la base. Recargar el cache no arregla eso.");
  await db.end();
  process.exit(1);
}

await db.query("notify pgrst, 'reload schema'");
console.log("   -> NOTIFY pgrst enviado");

// PostgREST recarga de forma asincrona. Se espera un poco y se comprueba por
// REST, que es donde se ve el cache de verdad.
await new Promise((r) => setTimeout(r, 4000));

const env = readFileSync(".env.local", "utf8");
const url = /NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();
const key = /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();

const r = await fetch(`${url}/rest/v1/gf_analytics_events?select=comuna,region&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log(`   -> REST responde ${r.status} ${r.statusText}`);
if (!r.ok) console.log(`      ${(await r.text()).slice(0, 300)}`);
else console.log("      el cache ya ve las columnas");

await db.end();