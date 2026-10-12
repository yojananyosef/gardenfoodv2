/**
 * Lee el cuerpo de las funciones que tocan gf_analytics_events, una por una.
 *
 * `pg_get_functiondef` tira `array_agg is an aggregate function` con alguna de
 * las funciones de este proyecto, asi que hay que aislar cual es: si no se puede
 * leer el cuerpo, tampoco se puede recrear con `create or replace`, y eso
 * cambia como se hace la migracion.
 *
 * Uso: node scripts/leer_rpcs_analytics.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: lista } = await db.query(`
  select p.proname as nombre, p.oid::text as oid, p.prosrc
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('admin_overview_metrics','admin_insights_metrics','admin_media_kit')
   order by p.proname`);

for (const f of lista) {
  let def = null;
  let error = null;
  try {
    def = (await db.query(`select pg_get_functiondef($1::oid) as d`, [f.oid])).rows[0]?.d ?? null;
  } catch (e) {
    error = e.message;
  }
  console.log(`\n========== ${f.nombre} ==========`);
  if (error) console.log(`   pg_get_functiondef FALLA: ${error}`);
  console.log(`   prosrc disponible: ${f.prosrc ? "si" : "no"}  (${(f.prosrc ?? "").length} chars)`);
  if (def) console.log(def.split("\n").map((l) => "   " + l).join("\n"));
}

await db.end();