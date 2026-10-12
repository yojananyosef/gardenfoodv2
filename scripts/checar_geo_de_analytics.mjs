/**
 * La Fase 10.1 quiere borrar `comuna`, `region` y `zona_agroclimatica` de
 * `gf_analytics_events` porque serían copias desnormalizadas de `perfiles`.
 *
 * El plan lo da por hecho, pero `lib/telemetry/geo.ts` guarda la geo que
 * **envía el cliente** (`region: geo.region ?? null`), no la del perfil. Si fuera
 * una copia, derivarla por join no perdería nada. Si es la posición del
 * visitante en ese momento, derivarla perdería los eventos sin perfil.
 *
 * Este script responde las tres preguntas que deciden el punto:
 *
 *   1. Cuántos eventos no tienen user_id (esos no se pueden derivar de nadie).
 *   2. Si esos eventos anónimos traen comuna o region igual.
 *   3. Si en los eventos con perfil, la comuna guardada es la misma que la del
 *      perfil hoy. Si difieren, la columna registra el dónde en el momento, no
 *      una copia, y borrarla cambia lo que el panel muestra.
 *
 * Uso: node scripts/checar_geo_de_analytics.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();
const q = async (sql) => (await db.query(sql)).rows;

const cols = await q(`
  select column_name, data_type from information_schema.columns
   where table_name = 'gf_analytics_events'
     and column_name in ('comuna','region','zona_agroclimatica','user_id','device_id')
   order by column_name`);
console.log("== columnas de gf_analytics_events ==");
for (const c of cols) console.log(`   ${c.column_name} (${c.data_type})`);

const total = (await q(`select count(*)::int as n from gf_analytics_events`))[0].n;
const sinUsuario = (
  await q(`select count(*)::int as n from gf_analytics_events where user_id is null`)
)[0].n;
console.log(`\n== volumen ==\n   total ${total}   sin user_id ${sinUsuario}`);

console.log("\n== 1. los eventos sin user_id traen geo? ==");
const anonGeo = await q(`
  select count(*)::int as n,
         count(*) filter (where comuna is not null)::int as con_comuna,
         count(*) filter (where region is not null)::int as con_region,
         count(*) filter (where zona_agroclimatica is not null)::int as con_zona
    from gf_analytics_events where user_id is null`);
console.log(`   ${anonGeo[0].n} eventos anonimos: con comuna ${anonGeo[0].con_comuna}, con region ${anonGeo[0].con_region}, con zona ${anonGeo[0].con_zona}`);

console.log("\n== 2. la comuna guardada es la del perfil? ==");
const cruce = await q(`
  select
    count(*)::int as total,
    count(*) filter (where e.comuna is not null)::int as con_comuna,
    count(*) filter (where p.comuna is not null)::int as perfil_con_comuna,
    count(*) filter (where e.comuna = p.comuna)::int as iguales,
    count(*) filter (where e.comuna is distinct from p.comuna)::int as distintas
    from gf_analytics_events e
    join perfiles p on p.id = e.user_id
    where e.comuna is not null or p.comuna is not null`);
const c = cruce[0];
console.log(`   eventos con perfil: ${c.total}`);
console.log(`   con comuna en el evento: ${c.con_comuna}`);
console.log(`   con comuna en el perfil: ${c.perfil_con_comuna}`);
console.log(`   iguales: ${c.iguales}   DISTINTAS: ${c.distintas}`);
if (c.distintas > 0) console.log("   -> la columna NO es una copia: registra el dónde en el momento");

console.log("\n== 3. ejemplos de la diferencia ==");
const ejemplos = await q(`
  select e.created_at::date as dia, e.comuna as comuna_evento, p.comuna as comuna_perfil, e.user_id
    from gf_analytics_events e join perfiles p on p.id = e.user_id
   where e.comuna is distinct from p.comuna
   order by e.created_at desc limit 5`);
for (const x of ejemplos) console.log(`   ${x.dia}  evento=${x.comuna_evento}  perfil=${x.comuna_perfil}`);

console.log("\n== quien lee las 3 columnas ==");
const { rows: fns } = await db.query(`
  select p.proname as nombre, p.oid::text as oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'`);
for (const f of fns) {
  const def = (await db.query(`select pg_get_functiondef($1::oid) as d`, [f.oid])).rows[0].d;
  const usa = ["comuna", "region", "zona_agroclimatica"].filter((col) =>
    new RegExp(`(analytics|events)[^)]*\\b${col}\\b|\\b${col}\\b\\s*(=|is|in)`, "i").test(def) &&
    /analytics_events/.test(def),
  );
  if (usa.length) console.log(`   ${f.nombre}: ${usa.join(", ")}`);
}
const { rows: idx } = await db.query(
  `select indexname, indexdef from pg_indexes where schemaname='public' and tablename='gf_analytics_events' and indexdef ~* '(comuna|region)'`,
);
console.log("\n== indices que las usan ==");
for (const i of idx) console.log(`   ${i.indexname}: ${i.indexdef.replace(/\s+/g, " ")}`);
if (!idx.length) console.log("   ninguno");

await db.end();