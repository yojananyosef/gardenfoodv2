/**
 * Compara el ESPECIES de ahora contra el array de antes, campo por campo.
 *
 * La idea de este refactor es que no se note. Esta es la prueba: se lee el
 * `especies.ts` del commit anterior con `git show`, se parsean los dos y se
 * listan las diferencias. Si no hay diferencias, la migracion no cambio nada
 * de lo que ve el usuario.
 *
 * No compara el archivo generado contra la base (eso es otra cosa); compara el
 * resultado final contra lo que habia antes de tocar nada.
 *
 * Uso: node scripts/verificar_especies_migradas.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const CAMPOS = ["id", "slug", "dbKey", "nombre", "imagen", "descripcion", "clima", "dificultad", "grupo"];

const parsear = (texto) => {
  const norm = texto.replace(/\r\n/g, "\n");
  const bloques = [...norm.matchAll(/\n  \{\n    id: (\d+),([\s\S]*?)\n  \},?(?=\n|$)/g)];
  return bloques.map(([, id, cuerpo]) => {
    const o = { id: Number(id) };
    for (const campo of CAMPOS.slice(1)) {
      const m = new RegExp(`\\n    ${campo}: "((?:[^"\\\\]|\\\\.)*)"`).exec(cuerpo);
      o[campo] = m ? JSON.parse(`"${m[1]}"`) : null;
    }
    return o;
  });
};

// El archivo de antes, tal como estaba en git.
const antes = parsear(
  execSync("git show HEAD:lib/agronomy/especies.ts", { encoding: "utf8", maxBuffer: 10e6 }),
);

// El de ahora. Se parsean los dos modulos generados como texto en vez de
// importarlos: `import` de un `.ts` desde Node sin el loader de Next exige
// extensiones explicitas, que el proyecto no usa. Ademas asi se compara DATO
// contra DATO, sin que la resolucion de modulos se meta en el medio.
// Los dos archivos generados se normalizan a LF: si tienen CRLF, el `\r` queda
// entre la coma y el fin de linea y ningun regex `$` con flag m los encuentra.
const generadoTxt = readFileSync("lib/agronomy/especies.generado.ts", "utf8").replace(/\r\n/g, "\n");
const editorialTxt = readFileSync("lib/agronomy/especies.editorial.ts", "utf8").replace(/\r\n/g, "\n");

const editar = (v) => (v === "null" ? null : JSON.parse(v));

// Coma opcional en el cierre: el ULTIMO bloque del array cierra con `};` y sin
// ella se perdia justo esa especie.
// El cuerpo capturado arranca SIN el \n inicial (el regex exterior ya se lo
// comio), asi que el primer campo de cada bloque solo matchea si se acepta
// `^` ademas de `\n`. Con `(?:\n|^)` el primer campo entra.
const generadas = [...generadoTxt.matchAll(/\n  \{\n    especie_id: (.*?),\n([\s\S]*?)\n  \},?(?=\n)/g)].map(
  ([, id, cuerpo]) => {
    const o = { especie_id: editar(id) };
    for (const m of cuerpo.matchAll(/(?:\n|^)\s{4}(\w+): (.*?),$/gm)) o[m[1]] = editar(m[2]);
    return o;
  },
);

const editorial = {};
for (const m of editorialTxt.matchAll(/\n  "(.+?)": \{\n([\s\S]*?)\n  \},/g)) {
  editorial[m[1]] = {};
  for (const c of m[2].matchAll(
    /(?:\n|^)\s{4}(orden|dbKey|nombre|dificultad|grupo|imagen|descripcion|clima): (.*?),$/gm,
  )) {
    editorial[m[1]][c[1]] = editar(c[2]);
  }
}

// El mismo merge que hace lib/agronomy/especies.ts, incluido el orden curado.
const txt = (v) => (v == null ? "" : String(v).trim());
const ahora = generadas
  .map((e) => {
    const slug = txt(e.especie_id);
    const ed = editorial[slug];
    return {
      id: ed?.orden ?? 0,
      slug,
      dbKey: txt(ed?.dbKey ?? e.especie),
      nombre: txt(ed?.nombre ?? e.especie),
      imagen: txt(ed?.imagen),
      descripcion: txt(ed?.descripcion),
      clima: ed?.clima ?? txt(e.clima_ideal),
      dificultad: txt(ed?.dificultad ?? e.dificultad),
      grupo: txt(ed?.grupo ?? e.grupo ?? e.categoria),
    };
  })
  .sort((a, b) => a.id - b.id);

console.log(`== antes: ${antes.length} especies   ahora: ${ahora.length} ==`);
console.log(`   generadas ${generadas.length}, editorial ${Object.keys(editorial).length}\n`);

const antesPor = new Map(antes.map((e) => [e.slug, e]));
const ahoraPor = new Map(ahora.map((e) => [e.slug, e]));

const soloAntes = [...antesPor.keys()].filter((s) => !ahoraPor.has(s));
const soloAhora = [...ahoraPor.keys()].filter((s) => !antesPor.has(s));
if (soloAntes.length) console.log(`SOLO ANTES: ${soloAntes.join(", ")}`);
if (soloAhora.length) console.log(`SOLO AHORA: ${soloAhora.join(", ")}`);
if (!soloAntes.length && !soloAhora.length) console.log("los mismos slugs en los dos\n");

let diferencias = 0;
for (const [slug, viejo] of antesPor) {
  const nuevo = ahoraPor.get(slug);
  if (!nuevo) continue;
  for (const campo of CAMPOS) {
    const a = String(viejo[campo] ?? "");
    const b = String(nuevo[campo] ?? "");
    if (a !== b) {
      diferencias += 1;
      console.log(`DIFERENCIA  ${slug}.${campo}`);
      console.log(`   antes: ${JSON.stringify(a.slice(0, 90))}`);
      console.log(`   ahora: ${JSON.stringify(b.slice(0, 90))}`);
    }
  }
}

console.log(`\n== ${diferencias} diferencias en ${antes.length} especies x ${CAMPOS.length} campos ==`);
if (diferencias === 0) console.log("IDENTICO. La migracion no cambio nada de lo que se ve.");
else console.log("Cada diferencia hay que entenderla antes de mergear.");