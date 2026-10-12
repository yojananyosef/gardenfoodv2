/**
 * Genera el diagrama de la base de datos en Mermaid, leyendo el esquema real.
 *
 * La base tiene 48 tablas. Un solo diagrama con todas es ilegible, asi que se
 * hacen cuatro: el mapa por dominios, el nucleo agronomico, lo del usuario, y las
 * vistas.
 *
 * Mermaid se elige porque GitHub lo dibuja solo dentro de un .md, sin instalar
 * nada ni tener una cuenta.
 *
 * Uso: node scripts/generar_diagrama_base.mjs
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: tablas } = await db.query(`
  select table_name, (xpath('/row/c/text()',
    query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name),
                 false, true, '')))[1]::text::int as filas
    from information_schema.tables
   where table_schema='public' and table_type='BASE TABLE'
   order by table_name`);

const { rows: vistas } = await db.query(`
  select table_name from information_schema.views where table_schema='public' order by table_name`);

const { rows: fks } = await db.query(`
  select c.conrelid::regclass::text as tabla,
         c.confrelid::regclass::text as ref,
         (select string_agg(a.attname, ', ')
            from pg_attribute a
           where a.attrelid = c.conrelid and a.attnum = any(c.conkey)) as columnas
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
   where c.contype='f' and n.nspname='public'
   order by tabla`);

const { rows: enums } = await db.query(`
  select t.typname, e.enumlabel from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
   where n.nspname='public' order by t.typname, e.enumsortorder`);

const { rows: pksRaw } = await db.query(`
  select t.relname::text as tabla,
         (select string_agg(a.attname, ', ' order by k.ord)
            from pg_constraint c
            cross join lateral unnest(c.conkey) with ordinality as k(attnum, ord)
            join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
           where c.conrelid = t.oid and c.contype = 'p') as columnas
    from pg_class t
    join pg_namespace n on n.oid = t.relnamespace
   where n.nspname = 'public' and t.relkind = 'r'
   order by t.relname`);

await db.end();

const nombre = new Map(tablas.map((t) => [t.table_name, t]));
const esAgronomico = (t) => t.startsWith("dim_") || t.startsWith("fact_");
const esUsuario = (t) => t.startsWith("gf_") || t === "perfiles";

/** Columnas que la tabla declara como clave foranea. */
function colsFk(tabla) {
  const s = new Set();
  for (const f of fks) {
    if (f.tabla !== tabla) continue;
    for (const c of f.columnas.split(", ")) s.add(c);
  }
  return s;
}

/** Clave primaria de cada tabla, por nombre de columna. */
const pks = new Map(
  pksRaw.map((p) => [p.tabla, p.columnas.split(", ").map((c) => c.trim())]),
);

/**
 * Columnas que identifican a la tabla: su clave primaria mas las que son clave
 * foranea.
 *
 * Antes se mostraban solo las FK, y por eso `dim_especies` aparecia con una
 * columna de nombre `clave` cuando lo que la identifica es `especie_id`, que es
 * su PK. Un diagrama que esconde la clave primaria no sirve para leer el modelo.
 */
function colsClave(tabla) {
  const s = new Set(colsFk(tabla));
  for (const p of pks.get(tabla) ?? []) s.add(p);
  return s;
}

function bloque(entidades, titulo) {
  const defs = entidades.map((t) => {
    const pk = new Set(pks.get(t) ?? []);
    const cols = colsClave(t);
    // Sintaxis de atributo en Mermaid ER: `tipo nombre`, y `PK` marca la clave
    // primaria. Con `**` delante el diagrama no renderiza.
    const cuerpo = cols.size
      ? [...cols]
          .sort((a, b) => (pk.has(b) ? 1 : 0) - (pk.has(a) ? 1 : 0))
          .map((c) => `  text ${c}${pk.has(c) ? " PK" : ""}`)
          .join("\n")
      : "  text clave";
    return `${t} {\n${cuerpo}\n}`;
  });
  // Misma cardinalidad que en el HTML: `A }o--|| B : "columna"`.
  const rel = fks
    .filter((f) => entidades.includes(f.tabla) && entidades.includes(f.ref))
    .map((f) => `  ${f.tabla} }o--|| ${f.ref} : "${f.columnas}"`);
  return `${titulo}\n\n\`\`\`mermaid\nerDiagram\n${defs.join("\n")}\n${rel.join("\n")}\n\`\`\`\n`;
}

// --- 1. mapa por dominios ---
const DOMINIOS = [
  ["dim", "dim_* — las dimensiones: el 'qué' y el 'dónde'", (t) => t.startsWith("dim_")],
  ["fact", "fact_* — los hechos: el 'cuándo' y el 'cuánto'", (t) => t.startsWith("fact_")],
  ["gf", "gf_* y perfiles — lo que es de cada usuario", esUsuario],
  ["cat", "cat_* — catálogos de productos", (t) => t.startsWith("cat_")],
  ["especies", "especies_* — ficha amplia por especie", (t) => t.startsWith("especies_")],
];
const losQueFaltan = tablas.filter((t) => !DOMINIOS.some(([, , f]) => f(t.table_name)));

/**
 * Resumen por familia: tarjetas con la cantidad de tablas y filas.
 *
 * Antes esto era un `graph TD` con las tablas sueltas y SIN aristas. Mermaid,
 * sin relaciones que dibujar, las coloca en una fila: salia una tira de cajas
 * de 40 px de alto que no mostraba ninguna estructura. Un grafo sin aristas no
 * informa nada, asi que ahora es una tabla con los numeros, que si dice algo.
 */
const resumenFamilias = DOMINIOS.map(([, titulo, pred]) => {
  const ts = tablas.filter((t) => pred(t.table_name));
  if (!ts.length) return null;
  const filas = ts.reduce((a, t) => a + t.filas, 0);
  const nombres = ts.map((t) => t.table_name).sort();
  return `<tr><td><b>${titulo}</b></td><td align="right">${ts.length}</td><td align="right">${filas.toLocaleString("es-CL")}</td><td>${nombres.map((n) => `<code>${n}</code>`).join(" ")}</td></tr>`;
}).filter(Boolean).join("\n");

/** El mismo diagrama en Mermaid envuelto en el panel del HTML. */
function panel(mermaid) {
  return `\n<div class="panel"><div class="mermaid">\n${mermaid}\n</div></div>\n`;
}

function erHtml(entidades) {
  const defs = entidades.map((t) => {
    const pk = new Set(pks.get(t) ?? []);
    const cols = colsClave(t);
    // En Mermaid ER cada atributo es `tipo nombre`, dos palabras. Agregar una
    // tercera (como `int filas 6826`) rompe el parseo.
    //
    // El alias con comillas (`t["nombre · 30 filas"]`) TAMBIEN lo rompe: el
    // diagrama entero sale como un SVG de error de 512 px. Mermaid ER no
    // acepta etiquetas con espacios en la entidad. El conteo de filas queda en
    // la tabla de arriba, que es donde se lee mejor igual.
    const cuerpo = cols.size
      ? [...cols]
          .sort((a, b) => (pk.has(b) ? 1 : 0) - (pk.has(a) ? 1 : 0))
          .map((c) => `  text ${c}${pk.has(c) ? " PK" : ""}`)
          .join("\n")
      : "  text clave";
    return `${t} {\n${cuerpo}\n}`;
  });
  // Una relacion en Mermaid ER es `A cardinalidad--cardinalidad B : etiqueta`.
  // Escribir `A columna --> B` (que era lo que habia) no es sintaxis valida y
  // Mermaid devuelve "Syntax error in text" dibujado como SVG de 512 px, sin
  // decir cual de las 30 relaciones esta mal.
  const rel = fks
    .filter((f) => entidades.includes(f.tabla) && entidades.includes(f.ref))
    .map((f) => `  ${f.tabla} }o--|| ${f.ref} : "${f.columnas}"`);
  // `direction TB` no cambia nada en un diagrama ER: Mermaid siempre los
  // acomoda de izquierda a derecha. Con las 30 tablas del nucleo eso da un
  // dibujo de 8.400 px de ancho con el texto en 4 px, que "sale" pero no se lee.
  // Por eso el nucleo va partido en dos diagramas mas chicos.
  return panel(`erDiagram\n${defs.join("\n")}\n${rel.join("\n")}`);
}

const seccionDominios = DOMINIOS.map(([clave, titulo, pred]) => {
  const ts = tablas.filter((t) => pred(t.table_name)).map((t) => t.table_name);
  if (!ts.length) return "";
  const nodos = ts.map(
    (t) =>
      `  ${t}["${t}<br/><small>${nombre.get(t).filas} filas · ${colsFk(t).size} FK</small>"]`,
  );
  return `### ${titulo}\n\n\`\`\`mermaid\ngraph TD\n${nodos.join("\n")}\n\`\`\`\n`;
}).join("\n");

const nucleo = tablas.filter((t) => esAgronomico(t.table_name)).map((t) => t.table_name);
// El nucleo va partido: 12 dimensiones y 18 hechos. Juntos no se leen.
const soloDim = tablas.filter((t) => t.table_name.startsWith("dim_")).map((t) => t.table_name);
const soloFact = tablas.filter((t) => t.table_name.startsWith("fact_")).map((t) => t.table_name);
const usuario = tablas.filter((t) => esUsuario(t.table_name)).map((t) => t.table_name);
const nucleoHtml = erHtml(soloDim);
const factHtml = erHtml(soloFact);
const usuarioHtml = erHtml(usuario);

// --- enums agrupados ---
const porEnum = new Map();
for (const e of enums) {
  if (!porEnum.has(e.typname)) porEnum.set(e.typname, []);
  porEnum.get(e.typname).push(e.enumlabel);
}
const seccionEnums = [...porEnum.entries()]
  .map(([n, vs]) => `**\`${n}\`** — ${vs.map((v) => `\`${v}\``).join(" · ")}`)
  .join("\n\n");

const totalFilas = tablas.reduce((a, t) => a + t.filas, 0);

const md = `# Base de datos — mapa y relaciones

> Generado con \`scripts/generar_diagrama_base.mjs\` leyendo el esquema real.
>
> **${tablas.length} tablas · ${vistas.length} vistas · ${totalFilas.toLocaleString("es-CL")} filas · ${fks.length} claves foráneas · ${porEnum.size} enums**

## Cómo leer esto

La normalización dejó la base separada en familias, con una regla:

- **\`dim_*\`** — las cosas que *son*: el frutal, la comuna, la zona, el mes. Se escriben
  **una sola vez**.
- **\`fact_*\`** — las cosas que *pasan*: cuánto riego, qué tarea, en qué mes. Se apuntan
  a las dimensiones, no las repiten.
- **\`gf_*\` y \`perfiles\`** — lo que es de cada usuario. Nada de esto viene del Excel.

Lo que se ganó: el nombre de un frutal está escrito **una vez**, en \`dim_especies\`.
Antes estaba repetido en 34 archivos.

---

## 1. La base por familias

${seccionDominios}
${
  losQueFaltan.length
    ? `### Otros\n\n\`\`\`mermaid\ngraph TD\n${losQueFaltan
        .map((t) => `  ${t.table_name}["${t.table_name}<br/><small>${t.filas} filas</small>"]`)
        .join("\n")}\n\`\`\`\n`
    : ""
}
## 2. El núcleo agronómico, con sus relaciones

${bloque(nucleo, "")}
## 3. Lo del usuario y la telemetría

${bloque(usuario, "")}
## 4. Las ${vistas.length} vistas

No son tablas ni guardan datos: son ventanas que **muestran información ya calculada**
a partir de las tablas de arriba. Existen justamente para no duplicar nada.

\`\`\`mermaid
graph LR
${vistas.map((v) => `  ${v.table_name}["${v.table_name}"]`).join("\n")}
\`\`\`

## 5. Las listas de valores válidos (enums)

Antes se podía escribir cualquier texto donde estos campos. Ahora hay una lista
cerrada, y la base **rechaza** lo que no esté en ella.

${seccionEnums}

---

*Generado el ${new Date().toISOString().slice(0, 10)} · se regenera con \`node scripts/generar_diagrama_base.mjs\`*
`;

writeFileSync("ESQUEMA.md", md, "utf8");

// --- salida HTML: lo mismo, pero dibujado, para mirar o imprimir ---
//
// El .md lo dibuja GitHub, pero para verlo de verdad o imprimirlo hace falta una
// pagina. Esta se abre con doble clic y trae un boton que sale en PDF.
//
// Mermaid se carga desde el CDN, o sea que la pagina necesita internet la
// primera vez. Inline pesaria unos 2 MB en el repo por un archivo que se
// regenera con un comando.
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GardenFood — Base de datos</title>
<style>
  :root {
    --fondo: #fbfbfa; --tinta: #1a1a1a; --suave: #6b6b6b; --linea: #e3e2df;
    --destacado: #4a7c59; --codigo: #f2f1ee; --panel: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    :root { --fondo:#16181a; --tinta:#ececec; --suave:#9a9a9a; --linea:#2c2f33; --codigo:#1e2124; --destacado:#7fbf92; --panel:#1b1e21; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:40px 32px 80px; background:var(--fondo); color:var(--tinta);
         font:16px/1.65 -apple-system, "Segoe UI", Roboto, system-ui, sans-serif; }
  .ancho { max-width: 1400px; margin: 0 auto; }
  h1 { font-size:30px; margin:0 0 6px; letter-spacing:-.02em; }
  .fecha { color:var(--suave); font-size:14px; margin:0 0 26px; }
  h2 { font-size:21px; margin:48px 0 6px; padding-top:20px; border-top:1px solid var(--linea); letter-spacing:-.01em; }
  h3 { font-size:16px; margin:26px 0 2px; color:var(--destacado); font-weight:600; }
  p { margin:0 0 14px; color:var(--suave); max-width:74ch; }
  code { background:var(--codigo); padding:1px 5px; border-radius:4px; font-size:13px; }
  .cifras { display:flex; flex-wrap:wrap; gap:10px; margin:22px 0 6px; }
  .cifra { background:var(--codigo); border:1px solid var(--linea); border-radius:10px; padding:10px 16px; }
  .cifra b { display:block; font-size:22px; letter-spacing:-.02em; }
  .cifra span { font-size:12px; color:var(--suave); }
  .panel { background:var(--panel); border:1px solid var(--linea); border-radius:14px; padding:22px; margin:10px 0 26px; overflow-x:auto; }
  .panel::-webkit-scrollbar { height: 10px; }
  .panel::-webkit-scrollbar-thumb { background:var(--linea); border-radius:6px; }
  .mermaid { display:flex; justify-content:center; }
  .mermaid svg { max-width:100% !important; height:auto; }
  table.resumen { border-collapse:collapse; width:100%; margin:12px 0 26px; font-size:14px; }
  table.resumen th { text-align:left; padding:8px 10px; border-bottom:2px solid var(--linea); color:var(--tinta); font-size:13px; }
  table.resumen td { padding:9px 10px; border-bottom:1px solid var(--linea); color:var(--suave); vertical-align:top; }
  table.resumen td b { color:var(--tinta); font-weight:600; }
  table.resumen code { margin:1px 2px; font-size:12px; }
  .barra { position:fixed; top:14px; right:18px; }
  button { font:inherit; font-size:13px; padding:7px 14px; border-radius:8px; cursor:pointer;
           border:1px solid var(--linea); background:var(--codigo); color:var(--tinta); }
  button:hover { border-color:var(--destacado); }
  @media print {
    body { padding:0; font-size:11px; }
    .barra { display:none; }
    h2 { page-break-after:avoid; margin-top:18px; }
    .panel { page-break-inside:avoid; border:0; padding:0; }
  }
</style>
</head>
<body>
<div class="barra"><button onclick="window.print()">Imprimir / PDF</button></div>
<div class="ancho">
<h1>Base de datos</h1>
<p class="fecha">GardenFood · generado el ${new Date().toISOString().slice(0, 10)} desde el esquema real</p>

<div class="cifras">
  <div class="cifra"><b>${tablas.length}</b><span>tablas</span></div>
  <div class="cifra"><b>${vistas.length}</b><span>vistas</span></div>
  <div class="cifra"><b>${fks.length}</b><span>claves foráneas</span></div>
  <div class="cifra"><b>${totalFilas.toLocaleString("es-CL")}</b><span>filas</span></div>
  <div class="cifra"><b>${porEnum.size}</b><span>enums</span></div>
</div>

<h2>Cómo está organizada</h2>
<p>Tres familias con una regla: <b>dim_*</b> son las cosas que <i>son</i> (el frutal, la comuna,
la zona) y se escriben una sola vez. <b>fact_*</b> son las cosas que <i>pasan</i> (cuánto riego,
qué tarea, en qué mes) y apuntan a las dimensiones sin repetirlas. <b>gf_*</b> y <b>perfiles</b>
son lo que es de cada usuario, y nada de eso viene del Excel.</p>

<table class="resumen">
<thead><tr><th>Familia</th><th align="right">Tablas</th><th align="right">Filas</th><th>Qué contiene</th></tr></thead>
<tbody>
${resumenFamilias}
</tbody>
</table>

<h2>Las dimensiones — el «qué» y el «dónde»</h2>
<p>Estas ${soloDim.length} tablas dicen <i>qué</i> existe: el frutal, la comuna, la zona, el
suelo, el mes. Cada dato está escrito <b>una sola vez</b>.</p>
${nucleoHtml}

<h2>Los hechos — el «cuándo» y el «cuánto»</h2>
<p>Estas ${soloFact.length} tablas dicen <i>qué pasa</i>: cuánto riego, qué tarea, en qué mes,
para qué frutal y en qué zona. Apuntan a las dimensiones de arriba y no repiten sus
datos.</p>
${factHtml}

<h2>Lo del usuario y la telemetría</h2>
${usuarioHtml}

<h2>Las ${vistas.length} vistas</h2>
<p>No guardan datos: muestran información ya calculada a partir de las tablas de arriba.
Existen para no duplicar nada.</p>
${panel(`graph LR\n${vistas.map((v) => `  ${v.table_name}["${v.table_name}"]`).join("\n")}`)}

<h2>Listas de valores válidos</h2>
<p>Antes se podía escribir cualquier texto. Ahora hay una lista cerrada y la base rechaza
lo que no esté en ella.</p>
<p>${[...porEnum.entries()].map(([n, vs]) => `<b>${n}</b> — ${vs.map((v) => `<code>${v}</code>`).join(" · ")}`).join("<br>")}</p>
</div>
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({
    startOnLoad: true,
    theme: "neutral",
    maxTextSize: 1000000,
    // Sin esto Mermaid escala el dibujo para que entre en el ancho disponible.
    // Con 30 tablas eso deja el texto en 4 px: el diagrama "sale" pero no se
    // lee. Con useMaxWidth false mantiene el tamaño natural y el panel hace
    // scroll, que es lo unico util con este volumen de tablas.
    useMaxWidth: false,
  });
</script>
</body>
</html>`;

writeFileSync("ESQUEMA.html", html, "utf8");
console.log("ESQUEMA.md y ESQUEMA.html generados");
console.log(`   ${tablas.length} tablas · ${vistas.length} vistas · ${fks.length} FKs · ${totalFilas} filas`);
console.log(`   nucleo agronomico: ${nucleo.length} tablas`);
console.log(`   usuario/telemetria: ${usuario.length} tablas`);
console.log(`   sin familia asignada: ${losQueFaltan.length ? losQueFaltan.map((t) => t.table_name).join(", ") : "ninguna"}`);