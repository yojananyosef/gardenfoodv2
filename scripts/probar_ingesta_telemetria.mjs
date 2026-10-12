/**
 * Prueba definitiva de si la ingesta de telemetria esta rota.
 *
 * Hace un insert por REST con la anon key, metiendo las mismas columnas que
 * mete app/api/v1/telemetry/route.ts. Si la 0045 dropeo las que el codigo
 * sigue mandando, el insert tiene que fallar con 400 y el codigo de columna.
 *
 * No escribe nada: la peticion va con `Prefer: return=minimal` y ademas borra
 * la fila si llegara a entrar, para no dejar basura en la tabla.
 *
 * Uso: node scripts/probar_ingesta_telemetria.mjs
 */
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const url = /NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();
const key = /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();

const ahora = new Date().toISOString();
// Los valores salen del vocabulario real (types/index.ts), no inventados: un
// valor inventado devuelve 22P02 y hace creer que el enum esta roto cuando lo
// que esta roto es el script de prueba.
const fila = {
  user_id: null,
  session_id: "prueba_migracion_0047",
  device_id: "prueba_0047",
  event_category: "PRODUCT_USAGE",
  event_name: "PAGE_VIEW",
  comuna: "Maipú",
  region: "Metropolitana",
  zona_agroclimatica: null,
  gps_lat: null,
  gps_lng: null,
  gps_accuracy_meters: null,
  especie_id: null,
  dwell_time_ms: null,
  scroll_depth_percent: null,
  ad_unit_id: null,
  ad_partner_id: null,
  payload: {},
  device_metadata: {},
  client_timestamp: ahora,
};

console.log("== insert de prueba con las columnas que manda la ruta de telemetria ==\n");
const r = await fetch(`${url}/rest/v1/gf_analytics_events`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify([fila]),
});

const texto = await r.text();
console.log(`   HTTP ${r.status} ${r.statusText}`);
if (texto.trim()) console.log(`   ${texto.slice(0, 400)}`);

if (r.ok) {
  const creado = JSON.parse(texto)[0];
  console.log(`\n   -> la ingesta FUNCIONA. entro la fila ${creado.id}`);
  const b = await fetch(
    `${url}/rest/v1/gf_analytics_events?id=eq.${creado.id}`,
    { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  console.log(`   -> fila de prueba borrada (HTTP ${b.status})`);
} else {
  console.log("\n   -> la ingesta esta ROTA. Este es el error que vera el cliente.");
}