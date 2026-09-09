#!/usr/bin/env node
/**
 * Inserta (upsert) el seed de fertilización en Supabase vía PostgREST.
 * Uso:  node scripts/fertilizacion_push.mjs [ruta_seed_json]
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.production
 * (service key porque PostgREST con anon no puede bypase RLS para carga masiva).
 */
import { readFileSync, existsSync } from "node:fs";

const seedPath = process.argv[2] ?? "supabase/fertilizacion_seed.json";

function envDe(archivo) {
  if (!existsSync(archivo)) return {};
  const env = {};
  for (const linea of readFileSync(archivo, "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_0-9]+)\s*=\s*"?([^"#]+?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = { ...envDe(".env.production"), ...envDe(".env.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(seedPath, "utf8"));

async function upsert(tabla, filas, onConflict) {
  const res = await fetch(`${url}/rest/v1/${tabla}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(filas),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${tabla}: ${res.status} ${t.slice(0, 300)}`);
  }
  return filas.length;
}

const partes = [
  ["gf_fertilizacion_fertilizantes", seed.fertilizantes, "producto"],
  ["gf_fertilizacion_fenologia", seed.fenologia, "especie,region_guia"],
  ["gf_fertilizacion_cosecha_tipica", seed.cosecha_tipica, "especie"],
  ["gf_fertilizacion_programa", seed.programas, "especie,region_guia,metodo,orden"],
];

for (const [tabla, filas, conflict] of partes) {
  for (let i = 0; i < filas.length; i += 200) {
    const n = await upsert(tabla, filas.slice(i, i + 200), conflict);
    console.log(`${tabla}: chunk offset ${i} ok (${n} filas)`);
  }
}
console.log("seed de fertilización aplicado");
