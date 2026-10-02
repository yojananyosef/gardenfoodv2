/**
 * Verifica que toda la familia de marca esta centrada.
 *
 *   node scripts/check-marca.mjs
 *
 * Sale con codigo 1 si algo se descentra, para poder correrlo en CI.
 *
 * Que se chequea y por que
 * -----------------------
 * 1. Simetria de margenes en el logo base. Es el invariante que se rompio: el
 *    canvas quedaba con 87 px a la izquierda y 42 a la derecha porque el padding
 *    se midio sobre un bbox de alfa que inclui un artefacto de 2x5 px.
 * 2. Centro del extent en el centro de cada tile. El extent es lo que el ojo
 *    compara contra el borde; el centro de masa se reporta como informacion
 *    porque depende de la forma y no es un invariante exigible.
 * 3. Ausencia de componentes sueltos. Regresa el modo de falla original: un
 *    pixel de ruido aislado infla el bbox y descuadra todo lo demas.
 */

import { readFileSync } from "node:fs";
import sharp from "sharp";

import {
  mascaraMarca,
  centroMasa,
  etiquetar,
  leerIco,
  tinta,
  AREA_MINIMA,
} from "./marca.mjs";

/** Tolerancia en px para el centro del extent. 1 px ya es invisible. */
const TOLERANCIA_PX = 1;

const TILES = [
  "app/icon.png",
  "app/apple-icon.png",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/icon-512-maskable.png",
  "public/icons/apple-touch-icon.png",
];

/** Espacio horizontal que la marca ocupa en la tarjeta OG: del lockup al texto. */
const CAJA_OG = { x0: 116, x1: 504, textoEmpieza: 504 };

const pct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const problemas = [];
const avisar = (mensaje) => {
  problemas.push(mensaje);
  console.log(`  FALLA  ${mensaje}`);
};

/** Un componente suelto es uno chico cuya caja cae fuera de la marca. */
function componenteSuelto(mascara, bbox, w, h) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = mascara[i] > 0 ? 1 : 0;
  const { areas } = etiquetar(mask, w, h);
  const holgura = 10;
  return areas.find(
    (c) =>
      c.area < AREA_MINIMA &&
      (c.bbox.maxX < bbox.minX - holgura ||
        c.bbox.minX > bbox.maxX + holgura ||
        c.bbox.maxY < bbox.minY - holgura ||
        c.bbox.minY > bbox.maxY + holgura),
  );
}

function reportear(nombre, alfa, w, h) {
  const { mascara, bbox, descartados } = mascaraMarca(alfa, w, h);
  const masa = centroMasa(mascara, w, h);
  const desvio = (bbox.minX + bbox.maxX) / 2 - w / 2;
  console.log(
    `  ${nombre.padEnd(34)} ${String(w).padStart(4)}x${String(h).padEnd(4)}` +
      `  extent ${pct((desvio / w) * 100).padStart(7)}` +
      `  masa ${pct(((masa.x - w / 2) / w) * 100).padStart(7)}` +
      `  marg L/R ${String(bbox.minX).padStart(3)}/${String(w - 1 - bbox.maxX).padStart(3)}` +
      `  sueltos ${descartados}`,
  );
  if (Math.abs(desvio) > TOLERANCIA_PX) {
    avisar(`${nombre}: extent descentrado ${desvio.toFixed(1)} px (tolerancia ${TOLERANCIA_PX})`);
  }
  const suelto = componenteSuelto(mascara, bbox, w, h);
  if (suelto) {
    avisar(
      `${nombre}: componente suelto de ${suelto.area} px en ` +
        `(${suelto.bbox.minX}, ${suelto.bbox.minY})-(${suelto.bbox.maxX}, ${suelto.bbox.maxY})`,
    );
  }
  return { bbox, desvio };
}

async function main() {
  console.log("logo base");
  const base = await tinta("public/logo-mark.png");
  const r = reportear("public/logo-mark.png", base.alfa, base.w, base.h);
  const der = base.w - 1 - r.bbox.maxX;
  if (Math.abs(r.bbox.minX - der) > 1) {
    avisar(`public/logo-mark.png: margenes L/R asimetricos (${r.bbox.minX} vs ${der})`);
  }

  console.log("\ntiles");
  for (const ruta of TILES) {
    const t = await tinta(ruta);
    reportear(ruta, t.alfa, t.w, t.h);
  }

  console.log("\nfavicon.ico");
  const frames = leerIco(readFileSync("app/favicon.ico"));
  for (const { lado, png } of frames) {
    const { data, info } = await sharp(png).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    reportear(`frame ${lado}px`, new Uint8Array(data.buffer, data.byteOffset, data.length), info.width, info.height);
  }

  console.log("\ntarjeta OG");
  const og = await sharp("public/og.png").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgb = new Uint8Array(og.data.buffer, og.data.byteOffset, og.data.length);
  const ancho = og.info.width;
  // la marca vive a la izquierda del texto: se recorta la mitad izquierda
  const recorte = Math.floor(ancho * 0.42);
  const alfa = new Uint8Array(og.info.height * recorte);
  for (let y = 0; y < og.info.height; y++) {
    for (let x = 0; x < recorte; x++) {
      const i = y * ancho + x;
      const d =
        Math.abs(rgb[i * 3] - 238) + Math.abs(rgb[i * 3 + 1] - 232) + Math.abs(rgb[i * 3 + 2] - 211);
      alfa[y * recorte + x] = d > 12 ? 255 : 0;
    }
  }
  const { bbox } = mascaraMarca(alfa, recorte, og.info.height);
  const esperado = (CAJA_OG.x0 + CAJA_OG.x1) / 2;
  const centro = (bbox.minX + bbox.maxX) / 2;
  console.log(
    `  marca en x ${bbox.minX}..${bbox.maxX}  (${bbox.maxX - bbox.minX + 1} px de ancho)` +
      `  centro ${centro} vs esperado ${esperado}`,
  );
  if (Math.abs(centro - esperado) > TOLERANCIA_PX) {
    avisar(`og.png: marca descentrada en su caja (${(centro - esperado).toFixed(1)} px)`);
  }
  if (bbox.maxX > CAJA_OG.textoEmpieza) {
    avisar(`og.png: la marca invade el texto (maxX ${bbox.maxX} > ${CAJA_OG.textoEmpieza})`);
  }

  console.log("");
  if (problemas.length > 0) {
    console.log(`${problemas.length} problema(s).`);
    process.exit(1);
  }
  console.log("marca centrada en todos los archivos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
