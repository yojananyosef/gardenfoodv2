/**
 * Comprueba si la ingestion de telemetria esta rota desde la migracion 0045.
 *
 * La 0045 dropeo `comuna`, `region` y `zona_agroclimatica` de
 * gf_analytics_events. Pero app/api/v1/telemetry/route.ts las sigue metiendo en
 * el INSERT (lineas 63-65), asi que cada POST deberia estar fallando con 500.
 *
 * Si es cierto, el ultimo evento guardado se queda congelado en la fecha en que
 * se aplico la migracion, aunque la gente siga navegando.
 *
 * Uso: node scripts/checar_ingesta_telemetria.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  select
    count(*)::int as total,
    max(created_at)::text as ultima_insercion,
    max(client_timestamp)::text as ultimo_evento,
    now()::text as ahora
    from gf_analytics_events`);

const r = rows[0];
const ult = new Date(r.ultima_insercion);
const ahora = new Date(r.ahora);
const dias = Math.floor((ahora - ult) / 86400000);

console.log("== estado de la ingesta ==");
console.log(`   eventos totales     : ${r.total}`);
console.log(`   ultima insercion    : ${r.ultima_insercion}`);
console.log(`   ahora               : ${r.ahora}`);
console.log(`   hace                : ${dias} dias`);

console.log("\n== eventos por dia, los ultimos 14 ==");
const { rows: porDia } = await db.query(`
  select created_at::date::text as dia, count(*)::int as n
    from gf_analytics_events
   where created_at > now() - interval '14 days'
   group by 1 order by 1`);
for (const d of porDia) console.log(`   ${d.dia}  ${"█".repeat(Math.min(d.n, 40))} ${d.n}`);

console.log("\n== la migracion 0047 (si existe) ==");
const { rows: mig } = await db.query(
  `select version from supabase_migrations.schema_migrations order by version desc limit 3`,
);
for (const x of mig) console.log(`   ${x.version}`);

await db.end();