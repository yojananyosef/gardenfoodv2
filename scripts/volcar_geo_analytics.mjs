/**
 * Vuelca las columnas de geo de gf_analytics_events antes de borrarlas (10.1).
 *
 * Precaucion, no rescate: no hay ningun lector de esas columnas. Pero guardan
 * 577 filas de donde se reportaba cada evento, y no todas son re-derivables:
 * 6 son de eventos anonimos (sin user_id, sin perfil que consultar) y 304
 * difieren de la comuna que el perfil tiene hoy. Si alguien algún día las quiere
 * para un analisis de geolocalizacion, el volcado evita ir a un backup.
 *
 * Se vuelcan solo los eventos que tienen algo de geo, de los 1647 totales.
 *
 * Uso: node scripts/volcar_geo_analytics.mjs
 * Salida: data/analytics_geo_historico.csv
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`
  select id, created_at::text as created_at, user_id, device_id,
         comuna, region, zona_agroclimatica,
         (user_id is null) as anonimo,
         (select p.comuna from perfiles p where p.id = e.user_id) as comuna_del_perfil_actual
    from gf_analytics_events e
   where comuna is not null or region is not null or zona_agroclimatica is not null
   order by created_at`);
await db.end();

const esc = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const salida = [
  "# Geo de gf_analytics_events antes de la Fase 10.1.",
  "# Ninguna funcion ni vista leia estas columnas: no era desnormalizacion que",
  "# sobrara, era el 'donde' que el cliente reportaba en el momento del evento.",
  "# 310 de estas filas NO son re-derivables del perfil: 6 son de eventos",
  "# anonimos y 304 tienen una comuna distinta de la que el perfil tiene hoy.",
  "id,created_at,user_id,device_id,comuna,region,zona_agroclimatica,anonimo,comuna_del_perfil_actual",
  ...rows.map(
    (r) =>
      [
        r.id,
        r.created_at,
        r.user_id,
        r.device_id,
        r.comuna,
        r.region,
        r.zona_agroclimatica,
        r.anonimo,
        r.comuna_del_perfil_actual,
      ]
        .map(esc)
        .join(","),
  ),
  "",
].join("\n");

writeFileSync("data/analytics_geo_historico.csv", salida, "utf8");
const anon = rows.filter((r) => r.anonimo).length;
const difiere = rows.filter((r) => r.user_id && r.comuna_del_perfil_actual !== r.comuna).length;
console.log(`${rows.length} filas con geo -> data/analytics_geo_historico.csv`);
console.log(`   de ellas, ${anon} anonimas y ${difiere} con comuna distinta a la del perfil`);