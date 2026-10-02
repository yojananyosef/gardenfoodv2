/**
 * Recentra la marca dentro de la tarjeta OG (public/og.png, 1200x630).
 *
 *   node scripts/patch-og-marca.mjs     (despues de generate-marca.mjs)
 *
 * POR QUE UN PARCHE Y NO UNA REGENERACION
 * ---------------------------------------
 * La tarjeta se compone de la marca mas un lockup con wordmark y dos lineas de
 * texto. `scripts/og-source.svg` ya no describe lo que hay en el archivo (es el
 * otro logo, el brote), asi que no hay fuente de la que regenerarla, y
 * rerenderizar el texto con librsvg cambiaria las tipografias. El fondo es crema
 * plano, alcanza con borrar la caja de la marca y recomponerla.
 *
 * El texto no se toca: la caja de la marca se mantiene dentro del espacio que ya
 * tenian, asi que el lockup no se desplaza.
 */

import sharp from "sharp";

import { leerAlfa, mascaraMarca, CREMA } from "./marca.mjs";

const OG = "public/og.png";
const MARCA = "public/logo-mark.png";

/** Ancho del texto en la tarjeta, para no invadirlo al borrar. */
const TEXTO_EMPIEZA = 504;

/** Espacio horizontal que la marca ya ocupaba: del margen del lockup al texto. */
const CAJA = { x0: TEXTO_EMPIEZA - 388, x1: TEXTO_EMPIEZA };

/** Centro vertical actual del artwork, para no mover la marca en Y. */
const CENTRO_Y = 314;

/** Ancho visible de la marca hoy. Se preserva: el fix es posicion, no peso. */
const ANCHO_MARCA = 329;

async function main() {
  const { data: crudos, info } = await sharp(OG).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const px = new Uint8Array(crudos.buffer, crudos.byteOffset, crudos.length);

  // --- borrar la marca vieja -------------------------------------------
  // Se barre un rectangulo que cubre la marca actual (x 116..485, y 156..472)
  // con margen, parandose antes del texto.
  const BORRADO = { x0: CAJA.x0 - 16, y0: 140, x1: TEXTO_EMPIEZA - 4, y1: 490 };
  for (let y = BORRADO.y0; y < BORRADO.y1; y++) {
    for (let x = BORRADO.x0; x < BORRADO.x1; x++) {
      const o = (y * width + x) * 4;
      px[o] = CREMA.r;
      px[o + 1] = CREMA.g;
      px[o + 2] = CREMA.b;
      px[o + 3] = 255;
    }
  }

  // --- recomponer la marca ya centrada ----------------------------------
  const fuente = await leerAlfa(MARCA);
  const { bbox } = mascaraMarca(fuente.alfa, fuente.w, fuente.h);
  const anchoMarca = bbox.maxX - bbox.minX + 1;
  const escala = ANCHO_MARCA / anchoMarca;
  const ancho = Math.round(fuente.w * escala);
  const alto = Math.round(fuente.h * escala);

  // el contenido va centrado en CAJA, y con su centro vertical donde estaba
  const centroContenidoCanvas = (bbox.minX + bbox.maxX) / 2;
  const centroYContenidoCanvas = (bbox.minY + bbox.maxY) / 2;
  const left = Math.round((CAJA.x0 + CAJA.x1) / 2 - centroContenidoCanvas * escala);
  const top = Math.round(CENTRO_Y - centroYContenidoCanvas * escala);

  const marca = await sharp(MARCA).resize(ancho, alto).png().toBuffer();
  const salida = await sharp(px, { raw: { width, height, channels: 4 } })
    .composite([{ input: marca, left, top }])
    .png()
    .toBuffer();
  await sharp(salida).toFile(OG);

  console.log(`og     ${OG}  ${width}x${height}`);
  console.log(`  borrado   x ${BORRADO.x0}..${BORRADO.x1}  y ${BORRADO.y0}..${BORRADO.y1}  (texto intacto desde x ${TEXTO_EMPIEZA})`);
  console.log(`  marca     ${ANCHO_MARCA}px de ancho (escala ${escala.toFixed(4)}), canvas ${ancho}x${alto} en (${left}, ${top})`);
  console.log(`  contenido x ${left + Math.round(bbox.minX * escala)}..${left + Math.round(bbox.maxX * escala)}` +
    `  (antes 155..484)   centro en el medio de [${CAJA.x0}, ${CAJA.x1}]`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
