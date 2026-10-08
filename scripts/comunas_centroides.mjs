#!/usr/bin/env node
/**
 * Genera el seed de centroides por comuna para el pronóstico meteorológico.
 *
 * Fuente: Nominatim (OpenStreetMap), centroide de la relación administrativa.
 * Se consulta UNA vez y el resultado se versiona en Git, igual que hace
 * `scripts/fertilizacion_seed.py` con el XLSX del socio: la app no depende de
 * un tercero en runtime.
 *
 * Uso:
 *   node scripts/comunas_centroides.mjs
 *
 * Escribe:
 *   supabase/comunas_centroides.json
 *
 * Por qué no en runtime: la política de uso de Nominatim prohíbe el tráfico de
 * producción sin identificación, y 346 requests en la primera carga de cada
 * usuario no es una consulta, es un abuse.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setDefaultResultOrder } from "node:dns";

// En esta máquina el `fetch` de Node resolvía nominatim por IPv6 y moría con
// «Connect Timeout Error» a los 10 s, mientras curl por IPv4 respondía 200 en
// un segundo. Sin esto el script no saca ni una coordenada.
setDefaultResultOrder("ipv4first");

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "supabase", "comunas_centroides.json");
const FUENTE_COMUNAS = join(RAIZ, "lib", "agronomy", "comunas.ts");

/** Nominatim pide 1 request por segundo como máximo. */
const PAUSA_MS = 1100;
const USER_AGENT = "gardenfood-centroides/1.0 (semilla one-shot; contacto del repo)";

/**
 * Caja que descarta respuestas que no son de Chile.
 *
 * El extremo occidental NO es -75,5: Chile tiene territorio oceánico y el
 * catálogo incluye las dos comunas insulares. Una caja ajustada al continente
 * rechazaba con «SIN COORDENADAS» a Isla de Pascua (-109,3°) y Juan Fernández
 * (-78,8°), que sí son comuna del catálogo.
 *
 * Rangos reales: lat -55,9 (Cabo Horno) a -17,5 (Arica); lng -109,4 (Rapa Nui)
 * a -66,5 (frontera con Argentina).
 */
const CHILE = { latMin: -56.5, latMax: -17, lngMin: -110.5, lngMax: -66 };

function dentroDeChile(lat, lng) {
  return (
    lat >= CHILE.latMin && lat <= CHILE.latMax &&
    lng >= CHILE.lngMin && lng <= CHILE.lngMax
  );
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Una consulta con reintentos.
 *
 * La conexión con Nominatim desde esta máquina es intermitente: la misma
 * consulta que un segundo antes devolvía 200 se caía con «fetch failed» al
 * siguiente intento. Sin reintento se perdían unas 20 de las 346 comunas y
 * quedaban sin pronóstico sin que nada lo anunciara.
 */
async function consultarNominatim(comuna, region) {
  const intentos = 3;
  let ultimoError = null;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await consultarUna(comuna, region);
    } catch (err) {
      ultimoError = err;
      if (intento < intentos) {
        process.stdout.write(`reintento ${intento}… `);
        await dormir(PAUSA_MS * 2 * intento);
      }
    }
  }
  throw ultimoError ?? new Error("sin respuesta");
}

async function consultarUna(comuna, region) {
  // La caja se amplía sin pedir `featuretype=boundary`: en las communes
  // insulares el resultado con ese filtro no viene, y sin él «Isla de Pascua»
  // devuelve el punto del unsettled tipo `island` en lugar de nada.
  const q = encodeURIComponent(`${comuna}, ${region}, Chile`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=cl`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.length) return null;
  // Se prefiere la relación administrativa: un topónimo homónimo puede devolver
  // un barrio, una olvidada o una Boyau, y para un pronóstico da casi lo mismo
  // pero para el seed ensucia el diff.
  const elegido =
    json.find((h) => h.type === "administrative") ?? json[0];
  const lat = Number(elegido.lat);
  const lng = Number(elegido.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!dentroDeChile(lat, lng)) return null;
  return { lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4 };
}

/** Lee `COMUNAS` del .ts sin importar TS ni el módulo completo del proyecto. */
function leerComunas() {
  const texto = readFileSync(FUENTE_COMUNAS, "utf8");
  const inicio = texto.indexOf("export const COMUNAS");
  if (inicio === -1) throw new Error("No encontré COMUNAS en lib/agronomy/comunas.ts");
  const entradas = [];
  const re = /\{\s*comuna:\s*"([^"]+)",\s*zonaId:\s*(\d+),\s*region:\s*"([^"]+)"\s*\}/g;
  const cuerpo = texto.slice(inicio);
  let m;
  while ((m = re.exec(cuerpo)) !== null) {
    entradas.push({ comuna: m[1], zonaId: Number(m[2]), region: m[3] });
  }
  return entradas;
}

async function main() {
  const comuna = process.argv[2] ?? null;
  const todas = leerComunas();
  console.log(`Catálogo: ${todas.length} comunas.`);

  // Resumible: se lee lo ya consultado y se sigue desde ahí. 346 requests a
  // 1,1 s son ~380 s mínimo, así que una corrida completa se pasa fácil del
  // timeout de una sesión y sin esto se perdería todo el avance.
  let salida = {};
  if (existsSync(SALIDA)) {
    try {
      salida = JSON.parse(readFileSync(SALIDA, "utf8"));
      console.log(`Resumiendo desde ${Object.keys(salida).length} comunas ya consultadas.`);
    } catch {
      console.log("El seed existente no se pudo leer; empiezo de cero.");
      salida = {};
    }
  }

  const pendientes = comuna
    ? todas.filter((c) => c.comuna === comuna)
    : todas.filter((c) => !salida[c.comuna]);
  if (!pendientes.length) {
    console.log("No hay nada pendiente.");
    return;
  }
  console.log(`Faltan ${pendientes.length}. A ~1,1 s por consulta: ~${Math.round((pendientes.length * 1.1) / 60)} min.\n`);

  const fallidas = [];
  let i = 0;
  for (const c of pendientes) {
    i += 1;
    process.stdout.write(`[${i}/${pendientes.length}] ${c.comuna} … `);
    try {
      const punto = await consultarNominatim(c.comuna, c.region);
      if (punto) {
        salida[c.comuna] = punto;
        console.log(`${punto.lat}, ${punto.lng}`);
      } else {
        fallidas.push(c.comuna);
        console.log("SIN COORDENADAS");
      }
    } catch (err) {
      fallidas.push(c.comuna);
      console.log(`ERROR ${err.message}`);
    }
    // Escritura incremental: si la corrida se corta, lo consultado no se pierde.
    escribir(salida);
    await dormir(PAUSA_MS);
  }

  const coords = Object.values(salida);
  const dupes = coords.length - new Set(coords.map((p) => `${p.lat},${p.lng}`)).size;

  console.log("\n── Resumen ──");
  console.log(`Coordenadas: ${coords.length}`);
  console.log(`Sin coordenadas o con error: ${fallidas.length}`);
  console.log(`Coordenadas repetidas: ${dupes}`);

  if (!comuna) {
    const faltan = todas.filter((c) => !salida[c.comuna]).map((c) => c.comuna);
    // Falla ruidosamente en vez de dejar pasar un seed incompleto: se
    // descubriría en producción, cuando esa comuna quede sin pronóstico.
    if (faltan.length) {
      console.error(`\nFALTAN ${faltan.length}: ${faltan.join(", ")}`);
      console.error("Vuelve a correr el script para seguir desde donde quedó.");
      process.exit(1);
    }
    console.log(`\nCompleto: ${SALIDA}`);
  } else {
    console.log(`\n${comuna}: ${JSON.stringify(salida[comuna] ?? null)}`);
  }
}

/** Orden alfabético para que el archivo no se reordera en cada corrida. */
function escribir(salida) {
  const ordenado = Object.fromEntries(
    Object.entries(salida).sort(([a], [b]) => a.localeCompare(b, "es")),
  );
  writeFileSync(SALIDA, JSON.stringify(ordenado, null, 2) + "\n", "utf8");
}

mkdirSync(dirname(SALIDA), { recursive: true });
await main();
