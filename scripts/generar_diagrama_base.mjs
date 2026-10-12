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
    return `${t} {\n${cuerpo}\n  int filas ${nombre.get(t)?.filas ?? 0}\n}`;
  });
  const rel = fks
    .filter((f) => entidades.includes(f.tabla) && entidades.includes(f.ref))
    .map((f) => `  ${f.tabla} ${f.columnas} --> ${f.ref}`);
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
const usuario = tablas.filter((t) => esUsuario(t.table_name)).map((t) => t.table_name);

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
console.log("ESQUEMA.md generado");
console.log(`   ${tablas.length} tablas · ${vistas.length} vistas · ${fks.length} FKs · ${totalFilas} filas`);
console.log(`   nucleo agronomico: ${nucleo.length} tablas`);
console.log(`   usuario/telemetria: ${usuario.length} tablas`);
console.log(`   sin familia asignada: ${losQueFaltan.length ? losQueFaltan.map((t) => t.table_name).join(", ") : "ninguna"}`);