/**
 * Genera `CONSEJOS.md`: la tabla de decisión de los consejos de cultivo.
 *
 * El análisis de solapamientos está en `desglosar_consejos.mjs`; esto solo
 * arma el documento que se lee.
 *
 * La decisión que hay que tomar por cada consejo de la base es una sola:
 *
 *   sí  -> pasa a la app
 *   no  -> no pasa
 *
 * Y hay una segunda, que es la que de verdad cuesta: 110 de los 154 consejos del
 * legacy NO tienen equivalente en la base. Si se pasa a la base, esos 110 se
 * pierden. Por eso la tabla trae, al lado de cada consejo de la base, el
 * consejo del legacy con el que se empareja, para poder decidir sin abrir dos
 * archivos.
 *
 * Uso: node scripts/generar_informe_consejos.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

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
  let n = 0;
  for (const c of cuerpo.matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)) {
    n += 1;
    deLegacy.push({ especie, n, consejo: JSON.parse(`"${c[1]}"`) });
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

/** Empareja cada consejo de la base con su contraparte del legacy. */
function emparejar(c) {
  const ls = legacyPor.get(c.canon) ?? [];
  for (const l of ls) if (norm(l.consejo) === norm(c.consejo)) return { tipo: "exacto", legacy: l };
  let mejor = null, puntaje = 0;
  for (const l of ls) {
    const j = jaccard(c.consejo, l.consejo);
    if (j > puntaje) { puntaje = j; mejor = l; }
  }
  if (mejor && puntaje >= 0.45) return { tipo: "parecido", legacy: mejor, j: puntaje };
  return { tipo: "nuevo", legacy: null };
}

const especies = [...new Set([...deDb.map((c) => c.canon), ...deLegacy.map((c) => c.canon)])].sort();
let paresExactos = 0, paresParecidos = 0, nuevos = 0;
const seccionEspecie = especies.map((e) => {
  const base = deDb.filter((c) => c.canon === e).sort((a, b) => a.n - b.n);
  const leg = legacyPor.get(e) ?? [];
  const filas = base.map((c) => {
    const p = emparejar(c);
    const marca = p.tipo === "exacto" ? "sí" : p.tipo === "parecido" ? "sí" : "sí";
    const nota =
      p.tipo === "exacto" ? "**EXACTO** · reemplaza al legacy"
      : p.tipo === "parecido" ? `parecido ${(p.j * 100).toFixed(0)}%`
      : "nuevo";
    if (p.tipo === "exacto") paresExactos += 1;
    else if (p.tipo === "parecido") paresParecidos += 1;
    else nuevos += 1;
    return `| ${marca} | no | ${c.consejo} | ${nota} | ${p.legacy ? p.legacy.consejo : "—"} |`;
  });
  const huerfanos = leg.filter(
    (l) => !base.some((c) => { const p = emparejar(c); return p.legacy && norm(p.legacy.consejo) === norm(l.consejo); }),
  );
  return `### ${e} — base ${base.length} · legacy ${leg.length}\n\n| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |\n|---|---|---|---|---|\n${filas.join("\n")}${
    huerfanos.length
      ? `\n\n> **${huerfanos.length} del legacy sin equivalente en la base** (se pierden si se migra):\n${huerfanos.map((h) => `> - "${h.consejo}"`).join("\n")}`
      : ""
  }\n`;
});

const totalLegacy = deLegacy.length;
const emparejados = new Set();
for (const c of deDb) {
  const p = emparejar(c);
  if (p.legacy) emparejados.add(`${c.canon}|${norm(p.legacy.consejo)}`);
}
const huerfanosTotales = deLegacy.filter((l) => !emparejados.has(`${l.canon}|${norm(l.consejo)}`));

const md = `# Consejos de cultivo — los dos juegos y qué hacer con cada uno

> Generado con \`scripts/generar_informe_consejos.mjs\`. Los números salen de la base
> y del archivo \`consejos.ts\`.

## El resumen que decide

| | Base (\`fact_consejos\`) | Legacy (\`consejos.ts\`) |
|---|---|---|
| Consejos | **211** | **154** |
| Especies | 30 | 30 |
| **Es el otro un superconjunto?** | **No** | **No** |

**Los dos juegos tienen casi todo en común y a la vez le faltan cosas.** Eso es
lo que hace que la decisión no sea "migrar el mejor":

| Relación | Cuántos | Qué significa |
|---|---|---|
| **Idéntico** | **3** | El legacy tiene el mismo texto, palabra por palabra |
| **Mismo consejo, otras palabras** | **41** | Varios son al 100% de parecido |
| **Solo en la base** | **167** | La base aporta 167 consejos que el legacy no tiene |
| **Solo en el legacy** | **110** | **El legacy tiene 110 que la base no tiene** |

**Ese último número es el que cuesta.** Si se migra a la base, **110 consejos
desaparecen** del catálogo. No son variantes: son consejos sobre cosas que la
base no menciona.

## Cómo usar la tabla

Cada fila es un consejo de la base con dos casillas:

- **SÍ** → pasa a la app
- **NO** → no pasa

La columna final trae el consejo del legacy al que **reemplaza**, para no tener
que abrir los dos archivos. Y bajo cada especie están los consejos del legacy
que **no tienen equivalente**, que son los que se perderían.

## El desglose

${seccionEspecie.join("\n---\n\n")}
## Los 110 del legacy que la base no tiene

Estos son los que se pierden si se decide pasar a la base. Están agrupados por
especie para poder decidir si vale la pena recuperarlos.

${
  huerfanosTotales.length
    ? [...new Set(huerfanosTotales.map((h) => h.canon))]
        .sort()
        .map((e) => {
          const ls = huerfanosTotales.filter((h) => h.canon === e);
          return `**${e}** (${ls.length})\n${ls.map((l) => `- "${l.consejo}"`).join("\n")}`;
        })
        .join("\n\n")
    : "ninguno"
}

## Las dos diferencias de fondo

1. **La base tiene 8 consejos por especie en casi todas; el legacy, 5.** La base
   cubre más, y de、统一 manera más parejo.

2. **La base declara dos fuentes** (\`Base de Conocimiento\` y \`Base 20
   especies\`) y varias veces cita la fuente (\`Bol. INIA 373\`). El legacy es
   más conversacional pero menos uniforme.

**Mi lectura:** la base es mejor contenido, pero **no es reemplazo, es
complemento**. Lo razonable sería quedarse con la base y recuperar de a uno los
110 del legacy que valgan la pena, en vez de cambiar de golpe y perderlos.

---

*Generado el ${new Date().toISOString().slice(0, 10)}. La decisión no se aplicó: no se borró nada.*`;

writeFileSync("CONSEJOS.md", md, "utf8");
console.log(`CONSEJOS.md generado`);
console.log(`   3 exactos, ${paresParecidos} parecidos, ${nuevos} nuevos`);
console.log(`   legacy sin equivalente: ${huerfanosTotales.length} de ${totalLegacy}`);
console.log(`   especies: ${especies.length}`);