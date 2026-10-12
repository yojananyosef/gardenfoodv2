/**
 * Compara el vocabulario de telemetria de TypeScript contra los enums reales de
 * la base.
 *
 * salio a la luz al probar el insert despues de arreglar la 0047: la respuesta
 * paso de PGRST204 (columna inexistente) a 22P02 (valor fuera del enum). O
 * sea que hay una segunda rotura, independiente, y anterior: la 0044 creo los
 * enums telem_event_category y telem_event_name.
 *
 * Si las etiquetas del enum no coinciden con TELEMETRY_CATEGORIES y
 * TELEMETRY_EVENT_NAMES, cada POST de telemetria falla y no se guarda nada.
 *
 * Este script no adivina: lee los dos lados y muestra la diferencia.
 *
 * Uso: node scripts/comparar_vocabulario_telemetria.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env)[1].trim();
const db = new pg.Client({ connectionString: m, ssl: { rejectUnauthorized: false } });
await db.connect();

// --- lado TypeScript ---
const tipos = readFileSync("types/index.ts", "utf8");
const bloque = (nombre) => {
  const i = tipos.indexOf(nombre);
  if (i < 0) return [];
  const desde = tipos.slice(i);
  const fin = desde.indexOf("] as const");
  const cuerpo = desde.slice(0, fin < 0 ? desde.indexOf(";") : fin);
  return [...cuerpo.matchAll(/"([A-Z0-9_]+)"/g)].map((x) => x[1]);
};
const catsTs = bloque("TELEMETRY_CATEGORIES");
const namesTs = bloque("TELEMETRY_EVENT_NAMES");

// --- lado base ---
const leerEnum = async (nombre) => {
  const { rows } = await db.query(
    `select e.enumlabel from pg_enum e
       join pg_type t on t.oid = e.enumtypid
      where t.typname = $1 order by e.enumsortorder`,
    [nombre],
  );
  return rows.map((x) => x.enumlabel);
};
const catsDb = await leerEnum("telem_event_category");
const namesDb = await leerEnum("telem_event_name");

const comparar = (etiqueta, ts, db_) => {
  console.log(`\n== ${etiqueta} ==`);
  console.log(`   TypeScript : ${ts.length} valores`);
  console.log(`   Base       : ${db_.length} valores`);
  const soloTs = ts.filter((x) => !db_.includes(x));
  const soloDb = db_.filter((x) => !ts.includes(x));
  if (!soloTs.length && !soloDb.length) {
    console.log("   COINCIDEN");
    return { ok: true };
  }
  if (soloTs.length) console.log(`   SOLO EN TS (el insert manda esto y revienta): ${soloTs.join(", ")}`);
  if (soloDb.length) console.log(`   SOLO EN LA BASE (nadie los manda): ${soloDb.join(", ")}`);
  return { ok: false, soloTs, soloDb };
};

console.log("== TELEMETRY_CATEGORIES ==");
console.log(`   TS  : ${catsTs.join(", ")}`);
console.log(`   DB  : ${catsDb.join(", ")}`);
const c = comparar("categorias", catsTs, catsDb);

console.log("\n== TELEMETRY_EVENT_NAMES ==");
console.log(`   TS  : ${namesTs.join(", ")}`);
console.log(`   DB  : ${namesDb.join(", ")}`);
const n = comparar("nombres", namesTs, namesDb);

console.log("\n\n== RESUMEN ==");
const roto = !c.ok || !n.ok;
console.log(roto ? "   LA INGESTA ESTA ROTA" : "   la ingesta funciona");

await db.end();