/**
 * Por que la consulta de refresh.ts devuelve 0 filas.
 *
 * scripts/checar_refresh_audiences.mjs corrio la consulta tal cual y salio
 * `filas: 0`, cuando hay 47 eventos de hoy. Si eso fuera cierto, el refresco
 * de audiencias estaria "funcionando" pero no recalcularia nada, que es peor que
 * que fallara.
 *
 * Uso: node scripts/checar_ventana_refresh.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: tipo } = await db.query(`
  select column_name, data_type
    from information_schema.columns
   where table_name = 'gf_analytics_events'
     and column_name in ('client_timestamp','created_at')`);
console.log("== tipos de las columnas de tiempo ==");
for (const t of tipo) console.log(`   ${t.column_name.padEnd(18)} ${t.data_type}`);

const { rows: base } = await db.query(`
  select
    count(*)::int as total,
    count(*) filter (where user_id is not null)::int as con_usuario,
    count(*) filter (where user_id is null)::int as anonimos,
    max(client_timestamp)::text as ultimo_client_ts,
    max(created_at)::text as ultimo_created,
    now()::text as ahora
    from gf_analytics_events`);
const b = base[0];
console.log("\n== la tabla ==");
console.log(`   total ${b.total}   con usuario ${b.con_usuario}   anonimos ${b.anonimos}`);
console.log(`   ultimo client_timestamp : ${b.ultimo_client_ts}`);
console.log(`   ultimo created_at       : ${b.ultimo_created}`);
console.log(`   ahora                   : ${b.ahora}`);

console.log("\n== la ventana que aplica refresh.ts: 30 dias sobre client_timestamp ==");
const { rows: v } = await db.query(`
  select
    count(*)::int as dentro,
    (select count(*)::int from gf_analytics_events
      where created_at > now() - interval '30 days') as por_created_at
    from gf_analytics_events
   where client_timestamp > now() - interval '30 days'
     and user_id is not null`);
console.log(`   con client_timestamp y usuario: ${v[0].dentro}`);
console.log(`   con created_at (sin filtro de usuario): ${v[0].por_created_at}`);

console.log("\n== los eventos mas recientes, con su client_timestamp ==");
const { rows: ult } = await db.query(`
  select session_id, user_id is null as anonimo,
         client_timestamp::text as client_ts, created_at::text as creado
    from gf_analytics_events order by created_at desc limit 5`);
for (const u of ult) {
  console.log(`   ${u.creado.slice(0, 19)}  client_ts=${String(u.client_ts).slice(0, 19)}  anon=${u.anonimo}`);
}

console.log("\n== hace cuanto se aplico la 0044 (enums) ==");
const { rows: mig } = await db.query(`
  select version from supabase_migrations.schema_migrations
   order by version desc limit 8`);
for (const x of mig) console.log(`   ${x.version}`);

await db.end();