/**
 * Escribe `data/consejos_nuevos.json` para que lo consuma la ruta `/consejos`.
 *
 * Va como JSON y no como HTML estatico a proposito: la CSP de produccion es
 * `script-src 'self' 'nonce-...' 'strict-dynamic'`, y con strict-dynamic no
 * corre ni un script inline sin ese nonce ni un archivo externo: el 'self' se
 * ignora. O sea que una pagina estatica con JavaScript propio no puede
 * ejecutarse ahi. Como ruta de Next, el nonce ya viene resuelto.
 *
 * Uso: node scripts/generar_consejos_json.mjs
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
const { rows: mapeo } = await db.query(`
  select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel
    from dim_especies`);
await db.end();

const cTxt = readFileSync("lib/agronomy/consejos.ts", "utf8").replace(/\r\n/g, "\n");
const inicios = [...cTxt.matchAll(/\n  "([^"]+)": \[\n([\s\S]*?)\n  \],/g)];
const deLegacy = [];
for (const [, especie, cuerpo] of inicios) {
  for (const c of cuerpo.matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)) {
    deLegacy.push({ especie, consejo: JSON.parse(`"${c[1]}"`) });
  }
}

const norm = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
const palabras = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 3));
function jaccard(a, b) {
  const A = palabras(a), B = palabras(b);
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const w of A) if (B.has(w)) i += 1;
  return i / (A.size + B.size - i);
}
const normNombre = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const porNombre = new Map();
for (const e of mapeo) for (const c of [e.especie, e.alias, e.excel, e.especie_id]) if (c) porNombre.set(normNombre(c), e.especie);
const canon = (n) => porNombre.get(normNombre(n)) ?? n;
for (const c of deDb) c.canon = canon(c.especie);
for (const c of deLegacy) c.canon = canon(c.especie);

const legacyPor = new Map();
for (const l of deLegacy) {
  if (!legacyPor.has(l.canon)) legacyPor.set(l.canon, []);
  legacyPor.get(l.canon).push(l);
}

const consejos = [];
for (const c of deDb) {
  const ls = legacyPor.get(c.canon) ?? [];
  let exacto = false, mejor = 0, masParecido = null;
  for (const l of ls) {
    if (norm(l.consejo) === norm(c.consejo)) { exacto = true; break; }
    const j = jaccard(c.consejo, l.consejo);
    if (j > mejor) { mejor = j; masParecido = l; }
  }
  if (exacto || mejor >= 0.45) continue;
  consejos.push({
    i: consejos.length + 1,
    especie: c.canon,
    consejo: c.consejo,
    fuente: c.fuente,
    pct: Math.round(mejor * 100),
    // Solo si supera el 25%: por debajo, el "mas proximo" no se parece en nada
    // y mostrarlo confunde mas que no mostrar nada.
    legacy: mejor >= 0.25 ? masParecido.consejo : null,
  });
}

writeFileSync("data/consejos_nuevos.json", JSON.stringify(consejos), "utf8");
console.log(`data/consejos_nuevos.json: ${consejos.length} consejos`);
console.log(`   con pariente en el legacy: ${consejos.filter((c) => c.legacy).length}`);
console.log(`   sin nada parecido: ${consejos.filter((c) => !c.legacy).length}`);