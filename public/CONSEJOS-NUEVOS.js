// Logica de la pagina de marcado de consejos.
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
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
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
    // El \n va escapado: sin doble barra, el template literal de Node lo
    // convierte en un salto de linea real y el regex queda partido en dos,
    // que es un SyntaxError y deja la pagina en blanco.
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const out = [
    "# Decisiones sobre los " + DATOS.length + " consejos que solo estan en la base.",
    "# GUARDAR: pasan a la app. DESCARTAR: no pasan. PENDIENTE: sin decidir.",
    "decision,especie,consejo,fuente,parecido_pct,consejo_legacy_mas_proximo",
    ...si.map(x => ["GUARDAR", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ...no.map(x => ["DESCARTAR", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ...sin.map(x => ["PENDIENTE", x.especie, x.consejo, x.fuente, (x.pct / 100).toFixed(2), x.legacy || ""].map(q).join(",")),
    ""
  ].join("\n");
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
