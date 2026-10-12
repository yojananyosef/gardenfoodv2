/**
 * Los 167 consejos que SOLO estan en la base, en tabla de dos columnas para
 * decidir cual se guarda y cual se descarta.
 *
 * "Solo en la base" significa: no hay texto identico en el legacy, y tampoco
 * hay uno parecido (similitud de palabras menor a 45%). O sea que no es un
 * duplicado ni una variante: es contenido que el legacy no tiene.
 *
 * Se escribe el CSV con la cabecera vacia en las dos columnas de decision, para
 * que se abra en la planilla y se marque ahi. El markdown es la misma lista
 * para leerla sin abrir Excel.
 *
 * Uso: node scripts/generar_consejos_nuevos.mjs
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

const nuevos = [];
for (const c of deDb) {
  const ls = legacyPor.get(c.canon) ?? [];
  let tipo = "nuevo";
  let puntaje = 0;
  for (const l of ls) {
    if (norm(l.consejo) === norm(c.consejo)) { tipo = "exacto"; break; }
    const j = jaccard(c.consejo, l.consejo);
    if (j > puntaje) puntaje = j;
  }
  if (tipo === "exacto" || puntaje >= 0.45) continue;
  // El mas parecido del legacy. Solo se guarda si supera el 25%: por debajo, el
  // "mas proximo" no se parece en nada y mostrarlo confunde. Antes se mostraba
  // siempre, y para "Almendro no tolera suelos encharcados" salia como
  // referencia "La floracion del almendro (agosto) es espectacular", que no
  // tiene nada que ver.
  let masParecido = null, mejor = 0;
  for (const l of ls) {
    const j = jaccard(c.consejo, l.consejo);
    if (j > mejor) { mejor = j; masParecido = l; }
  }
  nuevos.push({
    ...c,
    parecido: mejor,
    legacy: mejor >= 0.25 ? masParecido : null,
  });
}

nuevos.sort((a, b) => a.canon.localeCompare(b.canon) || a.n - b.n);

// --- CSV: se abre en la planilla y se marca en las dos columnas ---
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync(
  "data/consejos_nuevos.csv",
  [
    "# Los 167 consejos que SOLO estan en la base. Marcar SI para guardar, NO para descartar.",
    "# 'parecido_legacy' es el consejo del legacy mas proximo, si hubo. No es el mismo:",
    "# estos son los que no tienen equivalente.",
    "# 'parecido' es el porcentaje de coincidencia de palabras.",
    "GUARDAR,DESCARTAR,especie,consejo_base,fuente,parecido,parecido_legacy",
    ...nuevos.map((c) =>
      ["", "", c.canon, c.consejo, c.fuente, c.parecido.toFixed(2), ""].map(esc).join(","),
    ),
    "",
  ].join("\n").replace(/%,\n/, "\n"),
  "utf8",
);

// Rehacer el CSV con los nombres correctos (la linea de arriba se arma aparte).
const lineas = [
  "GUARDAR,DESCARTAR,especie,consejo_base,fuente,parecido_pct,consejo_legacy_mas_proximo",
  ...nuevos.map((c) =>
    [
      "",
      "",
      c.canon,
      c.consejo,
      c.fuente,
      c.parecido.toFixed(2),
      c.legacy ? c.legacy.consejo : "",
    ].map(esc).join(","),
  ),
  "",
];
writeFileSync("data/consejos_nuevos.csv", lineas.join("\n"), "utf8");

// --- Markdown: misma lista, para leerla sin abrir Excel ---
const porEspecie = new Map();
for (const c of nuevos) {
  if (!porEspecie.has(c.canon)) porEspecie.set(c.canon, []);
  porEspecie.get(c.canon).push(c);
}

const md = `# Los ${nuevos.length} consejos que solo estan en la base

> Para marcar cual se guarda y cual se descarta. **GUARDAR** / **DESCARTAR**.
> El CSV es lo mismo en \`data/consejos_nuevos.csv\`, para abrirlo en la planilla.
>
> **No se borro nada.** Esto es la lista para que decidas.

Que significa "nuevo": no hay texto identico en el legacy, y tampoco hay uno
parecido (menos de 45% de coincidencia de palabras). O sea que no son duplicados
ni variantes.

Son las dos columnas que se llenan a mano; "parecido" y "consejo del legacy mas
proximo" estan para que decidas con el otro a la vista, pero **no es el mismo
consejo**.

|GUARDAR|DESCARTAR|Consejo|Parado en el legacy|
|---|---|---|---|

${[...porEspecie.entries()]
  .map(
    ([e, cs]) =>
      `### ${e} — ${cs.length} consejos\n\n| GUARDAR | DESCARTAR | Consejo | Parecido en el legacy |\n|---|---|---|---|\n` +
      cs
        .map(
          (c) =>
            `| ☐ | ☐ | ${c.consejo} | ${c.legacy ? `${(c.parecido * 100).toFixed(0)}% — "${c.legacy.consejo.slice(0, 90)}"` : "—"} |`,
        )
        .join("\n"),
  )
  .join("\n\n")}

---

*Generado el ${new Date().toISOString().slice(0, 10)} · ${nuevos.length} consejos · nada se borro*`;

writeFileSync("CONSEJOS-NUEVOS.md", md, "utf8");
console.log(`CONSEJOS-NUEVOS.md y data/consejos_nuevos.csv generados`);
console.log(`   ${nuevos.length} consejos nuevos en ${porEspecie.size} especies`);
const conAlgo = nuevos.filter((c) => c.legacy).length;
console.log(`   con un legacy parecido (>=30%, pero bajo el 45% del corte): ${conAlgo}`);