/**
 * Busca y borra las filas que dejaron las pruebas de hoy en la tabla real.
 *
 * Las pruebas de ingesta seSuprimen con `Prefer: return=minimal` y con un
 * DELETE al final, pero si una falla a medio camino la fila se queda. Esto
 * revisa que no haya sobrado ninguna y limpia lo que encuentre.
 *
 * Usa las mismas credenciales de entorno que probar_ingesta_con_sesion.mjs.
 *
 * Uso: node scripts/limpiar_filas_de_prueba.mjs
 */
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const url = /NEXT_PUBLIC_SUPABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();
const anon = /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();

const email = process.env.TELEMETRY_TEST_EMAIL;
const password = process.env.TELEMETRY_TEST_PASSWORD;
if (!email || !password) {
  console.log("sin credenciales: no se revisa");
  process.exit(0);
}

const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.log(`login HTTP ${login.status}`);
  process.exit(1);
}
const { access_token } = await login.json();
const headers = { apikey: anon, Authorization: `Bearer ${access_token}` };

console.log("== filas de prueba que quedan ==");
const r = await fetch(
  `${url}/rest/v1/gf_analytics_events?select=id,session_id,device_id,created_at&or=(session_id.like.prueba_*,device_id.like.prueba_*,session_id.like.*0047*,device_id.like.*0047*)&order=created_at.desc`,
  { headers },
);
const filas = await r.json();
if (!filas.length) {
  console.log("   ninguna");
} else {
  for (const f of filas) {
    console.log(`   ${f.id}  session=${f.session_id}  device=${f.device_id}  ${f.created_at}`);
  }
  const ids = filas.map((f) => f.id).join(",");
  const b = await fetch(`${url}/rest/v1/gf_analytics_events?id=in.(${ids})`, {
    method: "DELETE",
    headers,
  });
  console.log(`\n   borradas ${filas.length} filas (HTTP ${b.status})`);
}

const t = await fetch(`${url}/rest/v1/gf_analytics_events?select=id&limit=1`, {
  headers,
  method: "HEAD",
});
console.log(`\n   la tabla sigue respondiendo: HTTP ${t.status}`);