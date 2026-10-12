/**
 * Revisa si el trabajo de cron que refresca las audiencias sigue funcionando
 * despues de que la migracion 0045 dropeara `region` y `comuna` de
 * gf_analytics_events.
 *
 * lib/telemetry/refresh.ts selecciona esas dos columnas y el cast
 * `as EventRow[]` de la linea 70 ocultaba el error a TypeScript. Con el
 * cliente de admin tipado el error aparece, o sea que la rotura es real y solo
 * estaba tapada.
 *
 * Este script confirma tres cosas:
 *   1. Que columnas pide refresh.ts y si siguen existiendo.
 *   2. Si hay un cron que la llame, y cada cuanto corre.
 *   3. Que la consulta devuelve un error de verdad, no solo un tipo.
 *
 * Uso: node scripts/checar_refresh_audiences.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

console.log("== 1. columnas que pide refresh.ts vs las que existen ==");
const fuente = readFileSync("lib/telemetry/refresh.ts", "utf8");
const pedidas = [...new Set([...fuente.matchAll(/event_category|event_name|especie_id|region|comuna/g)].map((x) => x[0]))];

const { rows: cols } = await db.query(`
  select column_name from information_schema.columns
   where table_name = 'gf_analytics_events' order by column_name`);
const existen = new Set(cols.map((c) => c.column_name));
for (const c of pedidas) {
  console.log(`   ${existen.has(c) ? "ok     " : "FALTA  "} ${c}`);
}
const faltantes = pedidas.filter((c) => !existen.has(c));
console.log(`   -> ${faltantes.length} columnas que el codigo pide y ya no existen`);

console.log("\n== 2. cron que la invoca ==");
const { rows: jobs } = await db.query(`
  select jobname, schedule, active, left(command, 120) as comando
    from cron.job order by jobname`);
if (!jobs.length) console.log("   no hay ningun cron configurado");
for (const j of jobs) {
  console.log(`   ${j.jobname} (${j.schedule}) activo=${j.active}`);
  console.log(`      ${j.comando}`);
}
let runs = [];
try {
  ({ rows: runs } = await db.query(`
    select jobid, status, start_time from cron.job_run
     order by start_time desc limit 5`));
} catch {
  console.log("   (cron.job_run no existe en este proyecto: pg_cron sin historial)");
}
console.log("\n== ultimas corridas ==");
if (!runs.length) console.log("   (sin registro)");
for (const r of runs) {
  console.log(`   job ${r.jobid}  ${r.status}  ${new Date(r.start_time).toISOString()}`);
}

console.log("\n== 3. la consulta real, tal cual la hace refresh.ts ==");
try {
  const { data, error } = await db.query(`
    select user_id, event_category, event_name, especie_id, dwell_time_ms,
           scroll_depth_percent, payload, region, comuna, client_timestamp
      from gf_analytics_events
     where client_timestamp > now() - interval '30 days'
       and user_id is not null
     order by client_timestamp asc limit 500`);
  console.log(`   filas: ${data?.length ?? 0}`);
  if (error) console.log(`   ERROR: ${error.message}`);
} catch (e) {
  console.log(`   ERROR REAL: ${e.message}`);
}

await db.end();