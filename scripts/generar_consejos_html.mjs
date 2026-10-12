/**
 * Genera `CONSEJOS-NUEVOS.html`: los 167 consejos con casillas para marcar
 * GUARDAR o DESCARTAR, y un boton para bajar las decisiones en CSV.
 *
 * Es standalone: los datos van embebidos, no hay CDN ni dependencias, asi que
 * se abre con doble clic sin internet. Las marcas se guardan en el
 * localStorage del navegador, asi que no se pierden al recargar.
 *
 * El boton de descarga es lo importante: sin el, las marcas quedan en mi
 * navegador y no llegan a ninguna parte.
 *
 * Uso: node scripts/generar_consejos_html.mjs
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

const items = [];
for (const c of deDb) {
  const ls = legacyPor.get(c.canon) ?? [];
  let exacto = false, mejor = 0, masParecido = null;
  for (const l of ls) {
    if (norm(l.consejo) === norm(c.consejo)) { exacto = true; break; }
    const j = jaccard(c.consejo, l.consejo);
    if (j > mejor) { mejor = j; masParecido = l; }
  }
  if (exacto || mejor >= 0.45) continue;
  items.push({
    i: items.length + 1,
    especie: c.canon,
    consejo: c.consejo,
    fuente: c.fuente,
    pct: Math.round(mejor * 100),
    legacy: mejor >= 0.25 ? masParecido.consejo : null,
  });
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Consejos nuevos — marcar</title>
<style>
  :root{
    --fondo:#fbfbfa; --tinta:#1a1a1a; --suave:#6b6b6b; --linea:#e3e2df;
    --si:#2f6f4f; --no:#9c3b3b; --codigo:#f2f1ee; --panel:#fff;
  }
  @media (prefers-color-scheme: dark){
    :root{ --fondo:#16181a; --tinta:#ececec; --suave:#9a9a9a; --linea:#2c2f33;
           --si:#7fbf92; --no:#e08b8b; --codigo:#1e2124; --panel:#1b1e21; }
  }
  *{box-sizing:border-box}
  body{margin:0;padding:0 0 120px;background:var(--fondo);color:var(--tinta);
       font:15px/1.6 -apple-system,"Segoe UI",Roboto,system-ui,sans-serif}
  header{position:sticky;top:0;z-index:20;background:var(--fondo);
         border-bottom:1px solid var(--linea);padding:16px 24px 12px}
  h1{margin:0 0 2px;font-size:19px;letter-spacing:-.01em}
  .sub{color:var(--suave);font-size:13px}
  .barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
  input[type=search],select{font:inherit;font-size:13px;padding:6px 10px;border-radius:8px;
        border:1px solid var(--linea);background:var(--panel);color:var(--tinta);min-width:150px}
  button{font:inherit;font-size:13px;font-weight:600;padding:7px 14px;border-radius:8px;
         border:1px solid var(--linea);background:var(--codigo);color:var(--tinta);cursor:pointer}
  button:hover{border-color:var(--suave)}
  button.pri{background:var(--si);border-color:var(--si);color:#fff}
  .contador{margin-left:auto;display:flex;gap:8px;font-size:13px;flex-wrap:wrap}
  .pastilla{padding:4px 11px;border-radius:999px;font-weight:650;font-size:12px;
           border:1px solid var(--linea)}
  .pastilla.si{background:var(--si);border-color:var(--si);color:#fff}
  .pastilla.no{background:var(--no);border-color:var(--no);color:#fff}
  main{max-width:1000px;margin:0 auto;padding:0 24px}
  .especie{margin:26px 0 10px;font-size:15px;font-weight:700;display:flex;align-items:baseline;gap:8px}
  .especie small{font-weight:400;color:var(--suave);font-size:12px}
  .fila{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
        padding:12px 14px;background:var(--panel);border:1px solid var(--linea);
        border-radius:10px;margin-bottom:7px}
  .fila.si{border-left:4px solid var(--si)}
  .fila.no{border-left:4px solid var(--no);opacity:.55}
  .caso{display:flex;gap:5px;padding-top:1px}
  .caso button{width:34px;height:30px;padding:0;font-size:13px;border-radius:7px}
  .caso button.on-si{background:var(--si);border-color:var(--si);color:#fff}
  .caso button.on-no{background:var(--no);border-color:var(--no);color:#fff}
  .texto{min-width:0}
  .txt{font-size:14.5px}
  .meta{font-size:12px;color:var(--suave);margin-top:3px}
  .parecido{margin-top:6px;font-size:12.5px;padding:7px 10px;background:var(--codigo);
           border-radius:7px;color:var(--suave);border-left:3px solid var(--linea)}
  .parecido b{color:var(--tinta)}
  .aviso{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:30;
         background:var(--tinta);color:var(--fondo);padding:9px 18px;border-radius:999px;
         font-size:13px;opacity:0;transition:opacity .18s;pointer-events:none}
  .vacío{display:none}
  @media print{header button,header input,header select,.caso{display:none}body{padding:0}}
</style>
</head>
<body>
<header>
  <h1>Consejos que solo están en la base — marcar</h1>
  <div class="sub">${items.length} consejos · 30 especies · <b>no se borra nada</b> hasta que descargues las decisiones</div>
  <div class="barra">
    <input type="search" id="q" placeholder="Buscar texto…">
    <select id="fEsp"><option value="">Todas las especies</option></select>
    <select id="fEstado">
      <option value="">Todos los estados</option>
      <option value="si">Solo GUARDAR</option>
      <option value="no">Solo DESCARTAR</option>
      <option value="pend">Solo pendientes</option>
    </select>
    <button id="bTodos">Marcar pendientes = GUARDAR</button>
    <button id="bLimpiar">Limpiar</button>
    <button class="pri" id="bCsv">Descargar decisiones (CSV)</button>
    <div class="contador">
      <span class="pastilla si" id="cSi">0 guardados</span>
      <span class="pastilla no" id="cNo">0 descartados</span>
      <span class="pastilla" id="cPen">${items.length} pendientes</span>
    </div>
  </div>
</header>
<main id="main"></main>
<div class="aviso" id="aviso"></div>

<!--
  Los datos van en un bloque JSON, no en un script ejecutable. Un script con
  type="application/json" NO se ejecuta, asi que la CSP no lo toca: la pagina
  tiene script-src 'self' 'nonce-...' 'strict-dynamic', y con strict-dynamic
  cualquier script inline sin ese nonce queda bloqueado. Por eso la logica va en
  CONSEJOS-NUEVOS.js, que si entra por 'self'.
-->
<script type="application/json" id="datos">${JSON.stringify(items).replace(/</g, "\\u003c")}</script>
<script src="/CONSEJOS-NUEVOS.js"></script>
</body>
</html>`;

const js = `// Logica de la pagina de marcado de consejos.
//
// Va en un archivo aparte, y no dentro del HTML, por la CSP: la aplicacion
// manda script-src 'self' 'nonce-...' 'strict-dynamic', y con strict-dynamic
// un script inline sin ese nonce queda bloqueado. En desarrollo la CSP es
// permisiva, asi que esto funcionaba en local y en dev, y se rompia solo en
// produccion. Un archivo externo entra por 'self'.
"use strict";

const DATOS = JSON.parse(document.getElementById("datos").textContent);
const CLAVE = "consejos-nuevos-v1";
let marcas = {};
try { marcas = JSON.parse(localStorage.getItem(CLAVE) || "{}"); } catch {}

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(marcas));
  pintar();
}

void guardar;

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

function pintar() {
  const q = norm(document.getElementById("q").value);
  const eSel = document.getElementById("fEsp").value;
  const eSta = document.getElementById("fEstado").value;
  const html = [];
  let ultima = null;

  for (const it of DATOS) {
    const est = marcas[it.i] || "";
    if (eSel && it.especie !== eSel) continue;
    if (eSta === "si" && est !== "si") continue;
    if (eSta === "no" && est !== "no") continue;
    if (eSta === "pend" && est) continue;
    if (q && !norm(it.consejo + " " + it.especie).includes(q)) continue;

    if (it.especie !== ultima) {
      html.push('<div class="especie">' + esc(it.especie) +
        ' <small>' + DATOS.filter(x => x.especie === it.especie).length + ' consejos</small></div>');
      ultima = it.especie;
    }
    html.push(
      '<div class="fila ' + est + '" data-i="' + it.i + '">' +
        '<div class="caso">' +
          '<button data-i="' + it.i + '" data-v="si" class="' + (est === "si" ? "on-si" : "") + '">Sí</button>' +
          '<button data-i="' + it.i + '" data-v="no" class="' + (est === "no" ? "on-no" : "") + '">No</button>' +
        '</div>' +
        '<div class="texto">' +
          '<div class="txt">' + esc(it.consejo) + '</div>' +
          '<div class="meta">#' + it.i + ' · fuente: ' + esc(it.fuente) + '</div>' +
          (it.legacy
            ? '<div class="parecido"><b>Parecido ' + it.pct + '% en el legacy:</b> ' + esc(it.legacy) + '</div>'
            : '<div class="parecido">Sin nada parecido en el legacy.</div>') +
        '</div>' +
      '</div>'
    );
  }
  document.getElementById("main").innerHTML = html.join("") ||
    '<p style="color:var(--suave);margin-top:30px">Ningún consejo coincide con el filtro.</p>';
  contadores();
  aplicarFiltros();
}

function norm(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function avisar(txt) {
  const a = document.getElementById("aviso");
  a.textContent = txt; a.style.opacity = 1;
  clearTimeout(a._t);
  a._t = setTimeout(() => (a.style.opacity = 0), 2200);
}

document.getElementById("main").addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-i]");
  if (!b) return;
  const i = Number(b.dataset.i);
  marcas[i] = marcas[i] === b.dataset.v ? "" : b.dataset.v;
  if (!marcas[i]) delete marcas[i];
  // Antes se re-pintaba la lista entera en cada clic. Con 167 filas eso salia
  // pesado y ademas saltaba el scroll, que es justo lo que pasa 167 veces
  // seguidas. Ahora solo se actualiza la fila tocada y los contadores.
  const fila = b.closest(".fila");
  const estado = marcas[i] || "";
  fila.className = "fila " + estado;
  for (const btn of fila.querySelectorAll(".caso button")) {
    btn.classList.toggle("on-si", btn.dataset.v === "si" && estado === "si");
    btn.classList.toggle("on-no", btn.dataset.v === "no" && estado === "no");
  }
  localStorage.setItem(CLAVE, JSON.stringify(marcas));
  contadores();
  aplicarFiltros();
});

function contadores() {
  let si = 0, no = 0;
  for (const it of DATOS) { const v = marcas[it.i]; if (v === "si") si++; else if (v === "no") no++; }
  document.getElementById("cSi").textContent = si + " guardados";
  document.getElementById("cNo").textContent = no + " descartados";
  document.getElementById("cPen").textContent = (DATOS.length - si - no) + " pendientes";
  document.getElementById("cPen").style.borderColor =
    si + no === DATOS.length ? "var(--si)" : "var(--linea)";
}

/** Esconde las filas que no pasan el filtro, sin volver a construir la lista. */
function aplicarFiltros() {
  const q = norm(document.getElementById("q").value);
  const eSel = document.getElementById("fEsp").value;
  const eSta = document.getElementById("fEstado").value;
  for (const fila of document.querySelectorAll(".fila")) {
    const i = Number(fila.dataset.i);
    const it = DATOS.find(x => x.i === i);
    const est = marcas[i] || "";
    let ver = true;
    if (eSel && it.especie !== eSel) ver = false;
    if (eSta === "si" && est !== "si") ver = false;
    if (eSta === "no" && est !== "no") ver = false;
    if (eSta === "pend" && est) ver = false;
    if (q && !norm(it.consejo + " " + it.especie).includes(q)) ver = false;
    fila.style.display = ver ? "" : "none";
  }
}

document.getElementById("bTodos").onclick = () => {
  let n = 0;
  for (const it of DATOS) if (!marcas[it.i]) { marcas[it.i] = "si"; n++; }
  guardar(); avisar(n + " marcados como GUARDAR");
};
document.getElementById("bLimpiar").onclick = () => {
  marcas = {}; guardar(); avisar("Todo limpiado");
};
document.getElementById("q").oninput = pintar;
document.getElementById("fEstado").onchange = pintar;
document.getElementById("fEsp").onchange = pintar;

document.getElementById("bCsv").onclick = () => {
  const si = DATOS.filter(x => marcas[x.i] === "si");
  const no = DATOS.filter(x => marcas[x.i] === "no");
  const sin = DATOS.filter(x => !marcas[x.i]);
  const q = (v) => {
    const s = String(v ?? "");
    // El \\n va escapado: sin doble barra, el template literal de Node lo
    // convierte en un salto de linea real y el regex queda partido en dos,
    // que es un SyntaxError y deja la pagina en blanco.
    return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const out = [
    "# Decisiones sobre los " + DATOS.length + " consejos que solo estan en la base.",
    "# GUARDAR: pasan a la app. DESCARTAR: no pasan. PENDIENTE: sin decidir.",
    "decision,especie,consejo,fuente,parecido_pct,consejo_legacy_mas_proximo",
    ...si.map(x => ["GUARDAR", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ...no.map(x => ["DESCARTAR", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ...sin.map(x => ["PENDIENTE", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ""
  ].join("\\n");
  const blob = new Blob([out], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "consejos_decisiones.csv";
  a.click();
  avisar("Descargado: " + si.length + " guardar, " + no.length + " descartar, " + sin.length + " pendientes");
};

const sel = document.getElementById("fEsp");
for (const e of [...new Set(DATOS.map(x => x.especie))].sort()) {
  const o = document.createElement("option");
  o.value = o.textContent = e;
  sel.appendChild(o);
}
pintar();
`;

writeFileSync("public/CONSEJOS-NUEVOS.html", html, "utf8");
writeFileSync("public/CONSEJOS-NUEVOS.js", js, "utf8");
console.log(`public/CONSEJOS-NUEVOS.html + .js generados  ->  /CONSEJOS-NUEVOS.html`);
console.log(`   ${items.length} consejos en ${new Set(items.map(i => i.especie)).size} especies`);
console.log(`   con pariente en el legacy: ${items.filter(i => i.legacy).length}`);
console.log(`   sin nada parecido: ${items.filter(i => !i.legacy).length}`);