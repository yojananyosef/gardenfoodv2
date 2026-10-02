/**
 * Genera TODA la familia de marca a partir de `scripts/marca-source.png`.
 *
 *   node scripts/generate-marca.mjs
 *
 * Reemplaza a `generate-icons.mjs` + `icon-source.svg`, que describen otro logo
 * (un brote de dos hojas sobre gradiente verde) y no generan ninguno de los
 * archivos que hoy estan en el repo. Esos dos quedan obsoletos; ver
 * docs/marca.md.
 *
 * Composicion: fondo crema #eee8d3, marca centrada opticamente. El tamano se
 * fija como "ancho de la marca REAL como fraccion del tile", medido sobre los
 * archivos actuales, para que el peso visual del icono no cambie al recentrar:
 * solo se mueve su posicion dentro del tile.
 */

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

import {
  leerAlfa,
  mascaraMarca,
  centroMasa,
  corrimiento,
  limpiarYDesplazar,
  escribirIco,
  CREMA,
} from "./marca.mjs";

const SOURCE = "scripts/marca-source.png";
const MARCA = "public/logo-mark.png";

/**
 * Ancho de la marca real como fraccion del tile. Medido sobre los derivados
 * actuales (el artwork ocupa 383 px de un canvas de 512, o sea 74.8%):
 *   - hoy la marca visible mide 301/512 = 58.8% en los tiles normales
 *   - 248/512 = 48.4% en el maskable, que respeta la safe zone circular
 */
const MARCA_EN_TILE = 0.588;
const MARCA_EN_TILE_MASKABLE = 0.484;

const TILES = [
  { lado: 512, salida: "app/icon.png" },
  { lado: 512, salida: "public/icons/icon-512.png" },
  { lado: 192, salida: "public/icons/icon-192.png" },
  { lado: 180, salida: "public/icons/apple-touch-icon.png" },
  { lado: 180, salida: "app/apple-icon.png" },
  { lado: 512, salida: "public/icons/icon-512-maskable.png", maskable: true },
];

const FAVICON_LADOS = [16, 32, 48];

const pct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

/**
 * Compone la marca centrada sobre un tile crema de `lado` px.
 *
 * Como el logo base ya viene con la marca centrada en su canvas, basta con
 * escalar el canvas y centeringarlo: el contenido queda centrado con el.
 */
async function componerTile(marcaPng, w, h, anchoMarca, lado, fraccion) {
  const escala = (lado * fraccion) / anchoMarca;
  const ancho = Math.max(1, Math.round(w * escala));
  const alto = Math.max(1, Math.round(h * escala));
  const marca = await sharp(marcaPng).resize(ancho, alto).png().toBuffer();
  return sharp({
    create: { width: lado, height: lado, channels: 4, background: CREMA },
  })
    .composite([{ input: marca, left: Math.round((lado - ancho) / 2), top: Math.round((lado - alto) / 2) }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync("public/icons", { recursive: true });

  // --- 1. limpiar y centrar el logo base --------------------------------
  const fuente = await leerAlfa(SOURCE);
  const { bbox, componentes, descartados } = mascaraMarca(fuente.alfa, fuente.w, fuente.h);
  const masaAntes = centroMasa(fuente.alfa, fuente.w, fuente.h);
  const { dx, dy } = corrimiento(bbox, fuente.w, fuente.h);
  const { buffer, bbox: bboxMovido } = await limpiarYDesplazar(SOURCE, dx, dy);
  await sharp(buffer).toFile(MARCA);

  const signo = (n) => `${n >= 0 ? "+" : ""}${n}`;
  console.log(`marca  ${SOURCE} -> ${MARCA}  (${fuente.w}x${fuente.h})`);
  console.log(`  ${componentes} componente(s) conexo(s), ${descartados} descartado(s) por area minima (el artefacto 2x5px)`);
  console.log(
    `  bbox real       x ${bbox.minX}..${bbox.maxX}  y ${bbox.minY}..${bbox.maxY}` +
      `   margenes L/R ${bbox.minX}/${fuente.w - 1 - bbox.maxX}  T/B ${bbox.minY}/${fuente.h - 1 - bbox.maxY}`,
  );
  console.log(`  desplazamiento  dx ${signo(dx)}  dy ${signo(dy)}`);
  console.log(
    `  centro de masa  antes: desvio ${pct(((masaAntes.x - fuente.w / 2) / fuente.w) * 100)} en X` +
      ` / ${pct(((masaAntes.y - fuente.h / 2) / fuente.h) * 100)} en Y`,
  );

  const salida = await leerAlfa(MARCA);
  const bboxFinal = bboxMovido;
  const masaDespues = centroMasa(salida.alfa, salida.w, salida.h);
  console.log(
    `  bbox final      x ${bboxFinal.minX}..${bboxFinal.maxX}  y ${bboxFinal.minY}..${bboxFinal.maxY}` +
      `   margenes L/R ${bboxFinal.minX}/${salida.w - 1 - bboxFinal.maxX}  T/B ${bboxFinal.minY}/${salida.h - 1 - bboxFinal.maxY}`,
  );
  console.log(
    `  centro de masa  despues: desvio ${pct(((masaDespues.x - salida.w / 2) / salida.w) * 100)} en X` +
      ` / ${pct(((masaDespues.y - salida.h / 2) / salida.h) * 100)} en Y`,
  );

  const anchoMarca = bboxFinal.maxX - bboxFinal.minX + 1;

  // --- 2. tiles cuadrados ----------------------------------------------
  for (const { lado, salida: destino, maskable } of TILES) {
    const fraccion = maskable ? MARCA_EN_TILE_MASKABLE : MARCA_EN_TILE;
    const png = await componerTile(MARCA, salida.w, salida.h, anchoMarca, lado, fraccion);
    await sharp(png).toFile(destino);
    console.log(
      `tile   ${destino}  ${lado}x${lado}  marca ${Math.round(lado * fraccion)}px (${(fraccion * 100).toFixed(1)}%)`,
    );
  }

  // --- 3. favicon.ico ---------------------------------------------------
  const frames = [];
  for (const lado of FAVICON_LADOS) {
    frames.push({
      lado,
      png: await componerTile(MARCA, salida.w, salida.h, anchoMarca, lado, MARCA_EN_TILE),
    });
  }
  writeFileSync("app/favicon.ico", escribirIco(frames));
  console.log(`tile   app/favicon.ico  ${FAVICON_LADOS.map((l) => `${l}px`).join(" / ")}`);

  console.log("\nfalta la tarjeta OG:  node scripts/patch-og-marca.mjs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
