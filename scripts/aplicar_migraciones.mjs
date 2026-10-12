#!/usr/bin/env node
/**
 * Aplica las migraciones generadas de supabase/migrations contra Postgres.
 *
 * Existe porque la migración de datos del Excel maestro pesa ~1 MB y el MCP
 * `apply_migration` exige que el SQL pase por el mensaje. Este script hace
 * lo mismo que la herramienta: una transacción por migración y una fila en
 * `supabase_migrations.schema_migrations` con la version timestamp.
 *
 * NUNCA se usa `supabase db push`: el remoto versions con timestamp y los
 * archivos del repo con `NNNN_`, asi que push intentaria reaplicar las 36
 * migraciones ya aplicadas.
 *
 * Empareja por NOMBRE, no por version, porque el remoto versiona con
 * timestamp y el repo con `NNNN_`.
 *
 * IMPORTANTE: este script NO aplica "todo lo que falta". Diez migraciones
 * viejas estan en el remoto con el nombre cambiado y sin prefijo numerico
 * (`user_huerto_tables`, `perfil_terreno`, `plano_arboles_matriz`...), asi que
 * comparar nombres marca 10 falsos pendientes que ya estan aplicadas.
 * Por eso hay que nombrar los archivos a mano, como hace apply_migration.
 *
 * Uso:
 *   node scripts/aplicar_migraciones.mjs --estado
 *   node scripts/aplicar_migraciones.mjs --dry-run 0037_base_maestra_ddl.sql
 *   node scripts/aplicar_migraciones.mjs 0037_base_maestra_ddl.sql 0038_....sql
 *
 * La conexion sale de DATABASE_URL en .env.local (que esta en .gitignore).
 * Ese archivo es el lugar correcto para la contrasena: no pasa por el chat
 * ni por el historial de git.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_MIG = join(RAIZ, "supabase", "migrations");
const REF = "ayhpmsocohrorabvrmow";

function leerEnvLocal() {
  const txt = readFileSync(join(RAIZ, ".env.local"), "utf8");
  const env = {};
  for (const linea of txt.split("\n")) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    // Los valores guardados en el dashboard a veces vienen con comillas
    // adentro del valor (le pasa a NEXT_PUBLIC_SITE_URL, ver app/layout.tsx).
    if (v.length > 1 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.length > 1 && v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const soloEstado = args.includes("--estado");
const pedidos = args.filter((a) => !a.startsWith("--"));

/** Version timestamp en el formato que usa Supabase (YYYYMMDDHHMMSS). */
function version() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
         `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

const env = leerEnvLocal();
if (!env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local.\n");
  console.error("Supabase > Settings > Database > Connection string > Session pooler.");
  console.error(`Agrega esta linea a .env.local (esta en .gitignore):`);
  console.error(`  DATABASE_URL=postgresql://postgres.${REF}:<TU_PASSWORD>` +
                `@aws-0-<region>.pooler.supabase.com:5432/postgres`);
  process.exit(2);
}

const client = new pg.Client({ connectionString: env.DATABASE_URL });
try {
  await client.connect();
} catch (e) {
  console.error(`No se pudo conectar a Postgres: ${e.message}\n`);
  if (env.DATABASE_URL.includes("<PASSWORD>") || env.DATABASE_URL.includes("YOUR-PASSWORD")) {
    console.error("DATABASE_URL tiene el placeholder sin reemplazar.");
  } else {
    console.error("Revisar la contraseña y que el proyecto allowlist esta IP en");
    console.error("Settings > Database > Network Restrictions. El pooler de Supabase");
    console.error("rechaza conexiones desde IPs unknown.");
  }
  process.exit(1);
}

const { rows: aplicadas } = await client.query(
  "select name from supabase_migrations.schema_migrations",
);
const yaHechas = new Set(aplicadas.map((r) => r.name).filter(Boolean));

const archivos = readdirSync(DIR_MIG).filter((f) => f.endsWith(".sql")).sort();

const sinPrefijo = aplicadas.map((r) => r.name).filter((n) => n && !/^\d/.test(n));

console.log(`proyecto    : ${REF}`);
console.log(`repo        : ${archivos.length} archivos`);
console.log(`remoto      : ${aplicadas.length} aplicadas`);

if (sinPrefijo.length) {
  console.log(`\n${sinPrefijo.length} migraciones del remoto no llevan prefijo numerico:`);
  for (const n of sinPrefijo) console.log(`   ${n}`);
  console.log("\nPor eso NO se deduce 'que falta' comparando nombres: esas ya estan");
  console.log("aplicadas con otro nombre. Hay que nombrar los archivos a mano.");
}

if (soloEstado) {
  console.log("\n(estado solamente, no se aplico nada)");
  await client.end();
  process.exit(0);
}

if (!pedidos.length) {
  console.error("\nFalta indicar que migracion aplicar. A proposito: este script no");
  console.error("adivina cual falta. Usar:");
  console.error("  node scripts/aplicar_migraciones.mjs --estado");
  console.error("  node scripts/aplicar_migraciones.mjs --dry-run <archivo.sql>");
  await client.end();
  process.exit(2);
}

const aAplicar = [];
for (const pedido of pedidos) {
  const f = pedido.endsWith(".sql") ? pedido : `${pedido}.sql`;
  if (!archivos.includes(f)) {
    console.error(`No existe en supabase/migrations/: ${f}`);
    await client.end();
    process.exit(2);
  }
  if (yaHechas.has(f.replace(/\.sql$/, ""))) {
    console.error(`Ya esta aplicada en el remoto, no se toca: ${f}`);
    await client.end();
    process.exit(2);
  }
  aAplicar.push(f);
}
aAplicar.sort();

for (const f of aAplicar) {
  const sql = readFileSync(join(DIR_MIG, f), "utf8");
  const nombre = f.replace(/\.sql$/, "");
  const tam = (Buffer.byteLength(sql) / 1024).toFixed(0);
  console.log(`\n--- ${f} (${tam} KB)`);

  if (dryRun) {
    console.log("    (dry-run, no se aplica)");
    continue;
  }

  // Una transaccion por migracion. Si algo falla, esa migracion cae entera
  // y las anteriores siguen aplicadas. Es el mismo criterio que usa
  // apply_migration, y es lo que hace que un fallo en el swap no deje la
  // base a medias.
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query(
      "insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)",
      [version(), nombre],
    );
    await client.query("commit");
    console.log("    aplicada");
  } catch (e) {
    await client.query("rollback");
    console.error(`    FALLO: ${e.message}`);
    if (e.position) {
      const pos = Number(e.position);
      const cerca = sql.slice(Math.max(0, pos - 200), pos + 200);
      console.error(`    cerca del caracter ${pos}:\n${cerca}`);
    }
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(dryRun ? "\ndry-run terminado." : "\nlisto.");