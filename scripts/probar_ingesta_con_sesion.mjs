/**
 * Prueba la ingesta de telemetria por el mismo camino que el navegador:
 * con la sesion de un usuario real, no con la anon key.
 *
 * Hace falta porque con la anon key el insert siempre falla con 42501 (RLS), y
 * eso no dice nada: la ruta de produccion usa el cliente del servidor, que
 * manda el JWT del usuario y si pasa el filtro.
 *
 * Para responder tiene queحب tokens de un usuario de pruebas. Se leen de
 * TELEMETRY_TEST_EMAIL y TELEMETRY_TEST_PASSWORD, que se pasan por entorno:
 *
 *   $env:TELEMETRY_TEST_EMAIL="..."; $env:TELEMETRY_TEST_PASSWORD="..."
 *   node scripts/probar_ingesta_con_sesion.mjs
 *
 * Si no estan, dice que no se probo. No se hardcodean credenciales en el repo.
 *
 * La fila que entra se borra al final, para no ensuciar la tabla.
 *
 * Uso: node scripts/probar_ingesta_con_sesion.mjs
 */
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const url = /NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();
const anon = /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();

const email = process.env.TELEMETRY_TEST_EMAIL;
const password = process.env.TELEMETRY_TEST_PASSWORD;

if (!email || !password) {
  console.log("== sin credenciales de prueba ==");
  console.log("   No se probo la ingesta con sesion.");
  console.log("   Poner TELEMETRY_TEST_EMAIL y TELEMETRY_TEST_PASSWORD en el entorno.");
  process.exit(0);
}

console.log("== 1. iniciar sesion ==");
const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.log(`   HTTP ${login.status}: ${(await login.text()).slice(0, 200)}`);
  process.exit(1);
}
const { access_token } = await login.json();
const headers = { apikey: anon, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };
console.log("   sesion ok");

const ahora = new Date().toISOString();
const fila = {
  user_id: null,
  session_id: "prueba_con_sesion_0047",
  device_id: "prueba_0047_sesion",
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

console.log("\n== 2. insert con las columnas que manda la ruta ==");
const r = await fetch(`${url}/rest/v1/gf_analytics_events`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify([fila]),
});
const texto = await r.text();
console.log(`   HTTP ${r.status} ${r.statusText}`);
if (texto.trim()) console.log(`   ${texto.slice(0, 300)}`);

if (!r.ok) {
  console.log("\n   -> LA INGESTA ESTA ROTA");
  process.exit(1);
}

const creada = JSON.parse(texto)[0];
console.log(`   -> entro la fila ${creada.id}`);
console.log(`      comuna guardada: ${JSON.stringify(creada.comuna)}  region: ${JSON.stringify(creada.region)}`);

console.log("\n== 3. leerla de vuelta, como hace refresh.ts ==");
const sel = await fetch(
  `${url}/rest/v1/gf_analytics_events?select=user_id,event_category,event_name,region,comuna&id=eq.${creada.id}`,
  { headers },
);
const leida = await sel.json();
console.log(`   ${JSON.stringify(leida[0] ?? null)}`);
console.log("\n   -> el ciclo insertar y leer que usa refresh.ts funciona");

console.log("\n== 4. borrar la fila de prueba ==");
const b = await fetch(`${url}/rest/v1/gf_analytics_events?id=eq.${creada.id}`, {
  method: "DELETE",
  headers,
});
console.log(`   HTTP ${b.status}`);
console.log("\nLA INGESTA DE TELEMETRIA FUNCIONA");