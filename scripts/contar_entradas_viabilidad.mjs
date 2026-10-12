/**
 * Las 600 entradas de lib/agronomy/viabilidad.ts: cuantas por especie y cuales
 * faltan.
 *
 * Esto corrigio un error: el conteo anterior daba 551 y se流派 que faltaban 87.
 * El regex que lo hacia exigia que cada bloque cerrara con `  },` (coma
 * incluida), y el ultimo de la lista cierra con `  }` sin coma: se comia
 * bloques. El numero real se cuenta por separado.
 *
 * Uso: node scripts/contar_entradas_viabilidad.mjs
 */
import { readFileSync } from "node:fs";

const c = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");

// Cada especie abre con `  "Nombre": {` y cierra con `  }` o `  },` en su
// propia linea. Se corta por el nombre, no por la coma.
const inicios = [...c.matchAll(/\n  "([^"]+)": \{/g)];
console.log(`especies en el archivo: ${inicios.length}\n`);

let total = 0;
const incompletas = [];
for (let i = 0; i < inicios.length; i++) {
  const desde = inicios[i].index;
  const hasta = i + 1 < inicios.length ? inicios[i + 1].index : c.length;
  const bloque = c.slice(desde, hasta);
  const zonas = new Set([...bloque.matchAll(/\n    (\d+): \{ v: "([^"]*)"/g)].map((m) => Number(m[1])));
  total += zonas.size;
  const faltan = [];
  for (let z = 1; z <= 20; z++) if (!zonas.has(z)) faltan.push(z);
  if (faltan.length) incompletas.push(`${inicios[i][1]}: faltan ${faltan.join(",")}`);
}

console.log(`entradas totales: ${total}  (30 especies x 20 zonas = 600)`);
console.log(`especies con menos de 20 zonas: ${incompletas.length}`);
for (const i of incompletas) console.log(`   ${i}`);

const esperadas = inicios.length * 20;
console.log(`\n${total === esperadas ? "COMPLETO: todas las combinaciones estan" : `FALTAN ${esperadas - total}`}`);