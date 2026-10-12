/**
 * Desglose de los dos juegos de consejos: `fact_consejos` (base, 211) y
 * `consejos.ts` (legacy, 154).
 *
 * Que responde, consejo por consejo:
 *
 *   1. Si un consejo de la base dice EXACTAMENTE lo mismo que uno del legacy.
 *   2. Si dice lo mismo con otras palabras (similitud de palabras).
 *   3. Si se repite dentro del mismo juego (el mismo consejo dos veces para la
 *      misma especie, o el mismo consejo en especies distintas).
 *   4. Si contradice a otro consejo.
 *
 * La similitud es de palabras, no de significado: dos frases pueden decir lo
 * mismo con distinta redaccion yIBR no las detecta, y dos frases pueden
 * compartir palabras y decir cosas distintas. Por eso el resultado es una
 * lista para revisar, no una verdad.
 *
 * Uso: node scripts/desglosar_consejos.mjs
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: deDb } = await db.query(`
  select d.especie, c.n, c.consejo, coalesce(c.fuente,'') as fuente
    from fact_consejos c join dim_especies d on d.especie_id = c.especie_id
   order by d.especie, c.n`);
await db.end();

// --- legacy ---
const cTxt = readFileSync("lib/agronomy/consejos.ts", "utf8").replace(/\r\n/g, "\n");
const inicios = [...cTxt.matchAll(/\n  "([^"]+)": \[\n([\s\S]*?)\n  \],/g)];
const deLegacy = [];
for (const [, especie, cuerpo] of inicios) {
  let n = 0;
  for (const c of cuerpo.matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)) {
    n += 1;
    deLegacy.push({ especie, n, consejo: JSON.parse(`"${c[1]}"`) });
  }
}

// El legacy usa dbKey ("Arandano" con tilde, "Avellano Europeo") y la base usa
// `dim_especies.especie` ("Arandano" sin tilde, "Avellano"). Sin normalizar,
// esas cuatro especies parecian no existir en el otro juego y todos sus
// consejos se contaban como faltantes.
const normNombre = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const { rows: mapeo } = await (async () => {
  const c2 = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
  await c2.connect();
  const r = await c2.query(`
    select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel
      from dim_especies`);
  await c2.end();
  return r;
})();
const porNombre = new Map();
for (const e of mapeo) {
  for (const c of [e.especie, e.alias, e.excel, e.especie_id]) {
    if (c) porNombre.set(normNombre(c), e.especie);
  }
}
/** Nombre canonico de la base, para whichever de los dos lados venga. */
const canonico = (nombre) => porNombre.get(normNombre(nombre)) ?? nombre;

for (const c of deDb) c.canon = canonico(c.especie);
for (const c of deLegacy) c.canon = canonico(c.especie);

// Aviso de los nombres que no coincidian, porque es informacion util: son 4
// especies con dos nombres y eso explica parte del desajuste.
console.log("\n== NOMBRES QUE NO COINCIDIAN ENTRE LOS DOS JUEGOS ==");
const baseCanon = new Set(deDb.map((c) => c.canon));
const legCanon = new Set(deLegacy.map((c) => c.canon));
for (const c of deDb) {
  if (c.canon !== c.especie) {
    const legacy = [...new Set(deLegacy.filter((x) => x.canon === c.canon).map((x) => x.especie))];
    console.log(`   base "${c.especie}"  <->  legacy "${legacy.join(", ") || "(no esta)"}`);
  }
}
for (const c of deLegacy) {
  if (!baseCanon.has(c.canon)) console.log(`   legacy "${c.especie}" no existe en la base (canonico: ${c.canon})`);
}
console.log(`\n   base: ${baseCanon.size} especies unicas   legacy: ${legCanon.size} especies unicas`);

// --- normalizacion para comparar ---
const norm = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();

const palabras = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 3));

/** Indice de Jaccard: cuanto se parecen dos frases. */
function jaccard(a, b) {
  const A = palabras(a), B = palabras(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / (A.size + B.size - inter);
}

// --- 1. coincidencia exacta entre juegos ---
const legacyNorm = new Map(deLegacy.map((c) => [c.canon + "|" + norm(c.consejo), c]));
const exactas = [];
const sinLegacy = [];
for (const c of deDb) {
  const hit = legacyNorm.get(c.canon + "|" + norm(c.consejo));
  if (hit) exactas.push({ ...c, legacy: hit });
  else sinLegacy.push(c);
}
console.log(`\n== 1. COINCIDENCIA EXACTA base<->legacy: ${exactas.length} ==`);
for (const e of exactas) console.log(`   ${e.especie}: "${e.consejo.slice(0, 100)}"`);

// --- 2. casi iguales (mismo con otras palabras) ---
const pares = [];
for (const c of sinLegacy) {
  let mejor = null;
  let puntaje = 0;
  for (const l of deLegacy) {
    if (l.canon !== c.canon) continue;
    const j = jaccard(c.consejo, l.consejo);
    if (j > puntaje) { puntaje = j; mejor = l; }
  }
  if (puntaje >= 0.45) pares.push({ ...c, legacy: mejor, j: puntaje });
}
console.log(`\n== 2. CASI IGUALES (mismo con otras palabras): ${pares.length} ==`);
for (const p of pares.sort((a, b) => b.j - a.j)) {
  console.log(`   ${p.especie}  (similitud ${(p.j * 100).toFixed(0)}%)`);
  console.log(`      base  : "${p.consejo.slice(0, 110)}"`);
  console.log(`      legacy: "${p.legacy.consejo.slice(0, 110)}"`);
}

// --- 3. legacy que no tienen nada equivalente en la base ---
const cubiertos = new Set(exactas.map((e) => `${e.especie}|${norm(e.consejo)}`));
for (const p of pares) cubiertos.add(`${p.canon}|${norm(p.legacy.consejo)}`);
const huerfanos = deLegacy.filter((c) => !cubiertos.has(`${c.canon}|${norm(c.consejo)}`));
console.log(`\n== 3. DEL LEGACY QUE NO TIENEN PAR EN LA BASE: ${huerfanos.length} de ${deLegacy.length} ==`);

// --- 4. repetidos dentro del mismo juego ---
const repBase = [];
const vistosBase = new Map();
for (const c of deDb) {
  const k = norm(c.consejo);
  if (vistosBase.has(k)) repBase.push({ ...c, otro: vistosBase.get(k) });
  else vistosBase.set(k, c);
}
const repLegacy = [];
const vistosLegacy = new Map();
for (const c of deLegacy) {
  const k = norm(c.consejo);
  if (vistosLegacy.has(k)) repLegacy.push({ ...c, otro: vistosLegacy.get(k) });
  else vistosLegacy.set(k, c);
}
console.log(`\n== 4. REPETIDOS DENTRO DEL MISMO JUEGO ==`);
console.log(`   en la base: ${repBase.length}`);
for (const r of repBase.slice(0, 6)) console.log(`      "${r.consejo.slice(0, 90)}" (${r.especie} y ${r.otro.especie})`);
console.log(`   en el legacy: ${repLegacy.length}`);
for (const r of repLegacy.slice(0, 6)) console.log(`      "${r.consejo.slice(0, 90)}" (${r.especie} y ${r.otro.especie})`);

// --- 5. distribucion por especie ---
console.log(`\n== 5. CUANTOS CONSEJOS TIENE CADA ESPECIE ==`);
const porEsp = new Map();
for (const c of deDb) porEsp.set(c.canon, (porEsp.get(c.canon) ?? 0) + 1);
const porLeg = new Map();
for (const c of deLegacy) porLeg.set(c.canon, (porLeg.get(c.canon) ?? 0) + 1);
const filas = [...new Set([...porEsp.keys(), ...porLeg.keys()])]
  .map((e) => ({ e, db: porEsp.get(e) ?? 0, leg: porLeg.get(e) ?? 0 }))
  .sort((a, b) => b.db - a.db || b.leg - a.leg);
for (const f of filas) {
  const marca = f.db === 0 ? "SOLO LEGACY" : f.leg === 0 ? "solo base  " : "         ";
  console.log(`   ${f.e.padEnd(20)} base ${String(f.db).padStart(2)}   legacy ${String(f.leg).padStart(2)}  ${marca}`);
}

console.log(`\n== RESUMEN ==`);
console.log(`   coincidencia exacta      : ${exactas.length}`);
console.log(`   casi iguales             : ${pares.length}`);
console.log(`   legacy sin par en la base: ${huerfanos.length}`);
console.log(`   repetidos en la base     : ${repBase.length}`);
console.log(`   repetidos en el legacy   : ${repLegacy.length}`);

// --- CSV para decidir ---
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const lineas = [
  "especie,consejo_base,n_base,fuente,coincide_exacta_con_legacy,casi_igual_con_legacy,similitud,decision_sugerida,consejo_legacy_se_queda",
  ...filas.map((f) => {
    const cs = deDb.filter((c) => c.canon === f.e);
    const ls = deLegacy.filter((c) => c.canon === f.e);
    if (!cs.length) {
      return [f.e, "", 0, "", "", "", "", "NO_COMPARABLE", ls.map((l) => l.consejo).join(" || ")].map(esc).join(",");
    }
    return cs.map((c) => {
      const ex = exactas.some((e) => e.canon === f.e && norm(e.consejo) === norm(c.consejo));
      const par = pares.find((p) => p.canon === f.e && norm(p.consejo) === norm(c.consejo));
      const leg = ex ? deLegacy.find((l) => l.canon === f.e && norm(l.consejo) === norm(c.consejo)).consejo
        : par ? par.legacy.consejo : "";
      const sug = ex ? "REEMPLAZA_LEGACY" : par ? "REVISAR_CASI_DUPLICADO" : "NUEVO";
      return [f.e, c.consejo, c.n, c.fuente, ex ? "SI" : "no", par ? "SI" : "no", par ? par.j.toFixed(2) : "", sug, leg].map(esc).join(",");
    }).join("\n");
  }),
  "",
];
writeFileSync("data/consejos_comparacion.csv", lineas.join("\n"), "utf8");
console.log("\ndata/consejos_comparacion.csv: una fila por consejo de la base");
console.log("   decision_sugerida: REEMPLAZA_LEGACY | REVISAR_CASI_DUPLICADO | NUEVO");