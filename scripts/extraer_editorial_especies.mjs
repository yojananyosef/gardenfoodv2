/**
 * Saca el contenido editorial de lib/agronomy/especies.ts antes de que el
 * archivo se reescriba.
 *
 * `imagen`, `descripcion` y `clima` no estan en ninguna de las 47 hojas del
 * Excel (se verifico celda por celda), asi que hay que preservarlos tal cual.
 *
 * De paso vuelca a CSV el bloque `ficha` (riego, suelo, cosecha, plagas,
 * cuidados). Nadie en el codigo lo lee: `.ficha` no aparece en ningun archivo
 * fuera de este. Pero es informacion que el Excel no tiene con esa forma, asi
 * que queda en `data/especies_ficha_legacy.csv` por si alguien la quiere.
 *
 * El texto se extrae del archivo, no se reescribe a mano: 30 especies por
 * teclear esExactly donde aparecen los errores de tipeo.
 *
 * Uso: node scripts/extraer_editorial_especies.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const RUTA = "lib/agronomy/especies.ts";
// Se lee de git, no del archivo: este script reemplaza `especies.ts`, asi que
// correrlo dos veces leeria su propia salida y perderia el contenido editorial.
// El original esta en el commit anterior mientras no se haya mergeado.
const desdeGit = process.argv.includes("--de-git");
const texto = desdeGit
  ? execSync(`git show HEAD:${RUTA}`, { encoding: "utf8", maxBuffer: 10e6 })
  : readFileSync(RUTA, "utf8");

if (desdeGit) console.log("(leyendo el archivo del ultimo commit)\n");

// El archivo esta en CRLF en Windows y las expresiones regulares de abajo
// buscan \n suelto, asi que se normaliza antes de parsear.
const fuente = texto.replace(/\r\n/g, "\n");

// Cada especie es un bloque que empieza con `    id: N,` y termina en `  },`.
// El ULTIMO del array cierra con `  }` sin coma, asi que se acepta la coma
// opcional: sin eso salian 29 de 30.
const bloques = [...fuente.matchAll(/\n  \{\n    id: (\d+),([\s\S]*?)\n  \},?(?=\n|$)/g)];
console.log(`== ${bloques.length} especies en el archivo ==\n`);

const editorial = [];
const fichasLegacy = [];

for (const [, id, cuerpo] of bloques) {
  const campo = (nombre) => {
    const m = new RegExp(`\\n    ${nombre}: "((?:[^"\\\\]|\\\\.)*)"`).exec(cuerpo);
    if (!m) return null;
    return JSON.parse(`"${m[1]}"`);
  };
  const slug = campo("slug");
  editorial.push({
    id: Number(id),
    slug,
    // Estos cuatro tambien se quedan en el codigo, aunque la base los tenga.
    // Ver el bloque de comentario de EDITORIAL: la escala de dificultad del
    // Excel no entra en el tipo, y dbKey son URLs.
    dbKey: campo("dbKey"),
    nombre: campo("nombre"),
    dificultad: campo("dificultad"),
    grupo: campo("grupo"),
    imagen: campo("imagen"),
    descripcion: campo("descripcion"),
    clima: campo("clima"),
  });

  // Las claves del bloque ficha van entrecomilladas ("riego": "...").
  const ficha = {};
  const fm = /\n    ficha: \{\n([\s\S]*?)\n    \}/.exec(cuerpo);
  if (fm) {
    for (const linea of fm[1].split("\n")) {
      const kv = /^\s*"?(\w+)"?:\s*"((?:[^"\\]|\\.)*)",?\s*$/.exec(linea);
      if (kv) ficha[kv[1]] = JSON.parse(`"${kv[2]}"`);
    }
  }
  fichasLegacy.push({ slug, ...ficha });
}

const sinEditorial = editorial.filter((e) => !e.imagen || !e.descripcion);
console.log(`especies sin imagen o descripcion: ${sinEditorial.length}`);
const sinClima = editorial.filter((e) => !e.clima);
console.log(`especies sin clima en el codigo  : ${sinClima.length}`);

// --- red de seguridad: el bloque ficha que nadie lee ---
const esc = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync(
  "data/especies_ficha_legacy.csv",
  [
    "# Bloque `ficha` de lib/agronomy/especies.ts. Nadie lo lee: `.ficha` no",
    "# aparece fuera de ese archivo. Se guarda porque el Excel no tiene estos",
    "# textos con esta forma (si los tiene, en fact_ficha_riego, fact_sanidad",
    "# y fact_labores_mes, que es donde deberian vivir).",
    "slug,riego,suelo,cosecha,plagas,cuidados",
    ...fichasLegacy.map((f) =>
      ["slug", "riego", "suelo", "cosecha", "plagas", "cuidados"].map((k) => esc(f[k])).join(","),
    ),
    "",
  ].join("\n"),
  "utf8",
);
console.log(`\ndata/especies_ficha_legacy.csv: ${fichasLegacy.length} filas de red de seguridad`);
console.log(`   ejemplo: ${fichasLegacy[0].slug} riego="${String(fichasLegacy[0].riego).slice(0, 60)}"`);

// --- el editorial, como modulo ---
const cuerpo = editorial
  .map(
    (e) => `  ${JSON.stringify(e.slug)}: {
    orden: ${e.id},
    dbKey: ${JSON.stringify(e.dbKey)},
    nombre: ${JSON.stringify(e.nombre)},
    dificultad: ${JSON.stringify(e.dificultad)},
    grupo: ${JSON.stringify(e.grupo)},
    imagen: ${JSON.stringify(e.imagen)},
    descripcion: ${JSON.stringify(e.descripcion)},
    clima: ${JSON.stringify(e.clima)},
  },`,
  )
  .join("\n");

writeFileSync(
  "lib/agronomy/especies.editorial.ts",
  `/**
 * Lo del catalogo de especies que NO esta en la base: el orden en que se
 * muestran, la imagen, la descripcion y el clima.
 *
 * EL ORDEN
 * --------
 *
 * \`especies.ts\` antes era un array con \`id: 1..30\` en un orden curado a mano:
 * duraznero primero, luego el resto de los carozos, luego las pomaceas, luego
 * los citricos. La base devuelve por \`especie_id\`, que es alfabetico, asi que
 * sin este orden el catalogo empieza en Almendro.
 *
 * Y eso no es cosmético: \`CalculadorasView\` hace \`useState(ESPECIES[0].dbKey)\`
 * y \`WorkbenchModular\` hace \`setEspecie(ESPECIES[0]?.dbKey)\`. Con el orden
 * alfabetico, la calculadora abriria en almendro en vez de duraznero, sin error
 * de por medio: solo un valor distinto.
 *
 * LO QUE NO ESTA EN EL EXCEL
 * --------------------------
 *
 * \`imagen\` y \`descripcion\` se buscaron celda por celda en las 47 hojas y no
 * existen. Son texto de presentacion y una ruta a un archivo del repo.
 *
 * \`dbKey\`, \`nombre\`, \`dificultad\` y \`grupo\` SI estan en la base, y aun asi
 * se leen de aca. \`scripts/verificar_especies_migradas.mjs\` comparo las 30
 * especies campo por campo y salio con 29 diferencias:
 *
 *   dificultad  el codigo usa una escala de 5 (Facil, Moderado, Avanzado,
 *               Dificil, Alto) y el Excel texto libre: "Media", "Muy facil",
 *               "Facil-Media", "Media-Dificil". Los ultimos estan FUERA del
 *               tipo, o sea que leerlo de la base obligaria a ampliar
 *               \`Dificultad\` o a castear en silencio.
 *   grupo       el codigo tiene 7 grupos, el Excel 8 y distintos: Berries en
 *               vez de Baya, Vid y Oleaceo en vez de Otros.
 *   dbKey       es la URL de /especies/<dbKey> y la llave con que se busca la
 *               especie. Pasarlo a "Arandano" con tilde rompe los enlaces que
 *               ya existen.
 *
 * Los valores del Excel no se pierden: quedan en
 * \`especies.generado.ts\` y \`getEspecieCompleta()\` los devuelve. Lo que se
 * decide aca es cual de los dos vocabularios ve el usuario, y por ahora gana el
 * de siempre porque cambiarlo no es gratis.
 *
 * \`clima\` es la excepcion: \`ESPECIES_FICHA_BD20.clima_ideal\` tiene el dato
 * para 20 de las 30. Estas 10 no lo tienen, asi que el clima de aca es el unico
 * que existe. Cuando se llene la hoja, se pone \`clima: null\` en la entrada y
 * empieza a mandar la base.
 *
 * \`scripts/extraer_editorial_especies.mjs\` genero este archivo desde el
 * \`especies.ts\` anterior. Ni el texto ni el orden se transcribieron a mano.
 *
 * ${new Date().toISOString().slice(0, 10)} · ${editorial.length} especies
 */

export interface EditorialEspecie {
  /** Posicion en el catalogo, la del array original. */
  orden: number;
  dbKey: string | null;
  nombre: string | null;
  dificultad: string | null;
  grupo: string | null;
  imagen: string | null;
  descripcion: string | null;
  clima: string | null;
}

export const EDITORIAL: Record<string, EditorialEspecie> = {
${cuerpo}
};
`,
  "utf8",
);

console.log(`lib/agronomy/especies.editorial.ts: ${editorial.length} especies`);
const claves = Object.keys(editorial.reduce((a, e) => ((a[e.slug] = 1), a), {}));
console.log(`   slugs: ${claves.slice(0, 5).join(", ")}, ...`);