/**
 * Utilidades compartidas por los scripts de marca.
 *
 * CONTEXTO — por que existe todo esto
 * ----------------------------------
 * `scripts/marca-source.png` es el raster original tal cual lo entrego el
 * diseñador (512x441). Trae un problema de encuadre:
 *
 *   - La marca visible real ocupa x = 87..469.
 *   - Pero hay un artefacto de 2x5 px con alpha <= 34 (~13% de opacidad) en
 *     (41..45, 291..292), separado del resto por 41 px de vacio.
 *   - El commit a4f78d3 ("aire interno en el logo") paddeo el canvas a 41/41
 *     de margenes porque midio el bbox de ALFA, que incluye ese fantasma.
 *
 * Resultado: el bbox se ve centrado, pero la marca visible no. Su centro esta
 * en x=278 contra un centro de canvas en 256, o sea 22 px (4.3%) a la derecha.
 * Ademas el centro de masa de la tinta esta 22.8 px a la derecha y 31 px arriba
 * (arriba pesa pala + sombrero + horcon; abajo converge en dos hojas finitas).
 *
 * Este modulo mide el bbox de la marca REAL (ignorando componentes pequenos),
 * y de ahi sale el corrimiento. No hay numeros magicos de margen.
 */

import sharp from "sharp";

/** Umbral de alpha para considerar que un pixel es tinta y no ruido. */
export const ALPHA_TINTA = 24;

/**
 * Area minima para que un componente conexo se considere parte de la marca.
 * El artefacto son ~6 px; la marca real son miles. 200 px separa sin ambiguedad.
 */
export const AREA_MINIMA = 200;

/** Fondo de los tiles y de la tarjeta OG. */
export const CREMA = { r: 238, g: 232, b: 211 };

/**
 * Correccion vertical de gusto, en fraccion de la altura del canvas.
 *
 * El extent vertical ya esta centrado (36 arriba / 38 abajo), asi que NO sale
 * de una medicion: sale de que el ojo percibe la marca alta. Corregir el centro
 * de masa completo (+7%) deja la punta del"V" pegada al borde de la tarjeta;
 * +2.7% es el punto medio que se ve balanceado. Ver docs/marca.md.
 */
export const NUDGE_Y = 0.027;

/**
 * En X se empareja el bbox de la marca real con el centro del canvas.
 *
 * Se usa el extent, no el centro de masa: el extent es lo que el ojo compara
 * contra el borde de la tarjeta, y deja el centro de masa a ~1.3 px (0.25%) del
 * centro, por debajo del umbral de percepcion.
 */

/** Etiqueta por componentes conexos 4-vecinos. Devuelve ids y area+bbox de cada uno. */
export const etiquetar = (mask, w, h) => {
  const etiquetas = new Int32Array(w * h).fill(-1);
  const pila = new Int32Array(w * h);
  const areas = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || etiquetas[i] !== -1) continue;
    const id = areas.length;
    let sp = 0;
    pila[sp++] = i;
    etiquetas[i] = id;
    let area = 0;
    let minX = w;
    let maxX = -1;
    let minY = h;
    let maxY = -1;
    while (sp > 0) {
      const p = pila[--sp];
      const x = p % w;
      const y = (p - x) / w;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0) {
        const q = p - 1;
        if (mask[q] && etiquetas[q] === -1) {
          etiquetas[q] = id;
          pila[sp++] = q;
        }
      }
      if (x < w - 1) {
        const q = p + 1;
        if (mask[q] && etiquetas[q] === -1) {
          etiquetas[q] = id;
          pila[sp++] = q;
        }
      }
      if (y > 0) {
        const q = p - w;
        if (mask[q] && etiquetas[q] === -1) {
          etiquetas[q] = id;
          pila[sp++] = q;
        }
      }
      if (y < h - 1) {
        const q = p + w;
        if (mask[q] && etiquetas[q] === -1) {
          etiquetas[q] = id;
          pila[sp++] = q;
        }
      }
    }
    areas.push({ id, area, bbox: { minX, minY, maxX, maxY } });
  }
  return { etiquetas, areas };
};

/** Lee el canal alfa del PNG y lo devuelve como Uint8Array de w*h. */
export async function leerAlfa(ruta) {
  const { data, info } = await sharp(ruta)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { alfa: new Uint8Array(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height };
}

/**
 * Separa la marca real del ruido.
 *
 * Arma una mascara con los pixeles sobre ALPHA_TINTA, la etiqueta por
 * componentes conexos y se queda con los que tienen area >= AREA_MINIMA. El
 * artefacto de 2x5 px del raster original (~6 px, alpha 34) queda fuera; la
 * marca real son miles de pixeles. Devuelve la mascara filtrada — que ademas
 * sirve para ERASAR el ruido, no solo para medir — mas el bbox y el conteo.
 */
export function mascaraMarca(alfa, w, h) {
  const cruda = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) cruda[i] = alfa[i] > ALPHA_TINTA ? 1 : 0;
  const { areas } = etiquetar(cruda, w, h);
  const grandes = areas.filter((c) => c.area >= AREA_MINIMA);
  if (grandes.length === 0) throw new Error("marca: no se encontro ninguna tinta suficiente");

  const mascara = new Uint8Array(w * h);
  const bbox = { minX: w, minY: h, maxX: -1, maxY: -1 };
  for (const c of grandes) {
    for (let y = c.bbox.minY; y <= c.bbox.maxY; y++) {
      for (let x = c.bbox.minX; x <= c.bbox.maxX; x++) {
        const i = y * w + x;
        if (cruda[i]) mascara[i] = 1;
      }
    }
    bbox.minX = Math.min(bbox.minX, c.bbox.minX);
    bbox.minY = Math.min(bbox.minY, c.bbox.minY);
    bbox.maxX = Math.max(bbox.maxX, c.bbox.maxX);
    bbox.maxY = Math.max(bbox.maxY, c.bbox.maxY);
  }
  return { mascara, bbox, componentes: areas.length, descartados: areas.length - grandes.length };
}

/** Centro de masa de la tinta, ponderado por su opacidad. */
export function centroMasa(alfa, w, h) {
  let suma = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const peso = alfa[y * w + x];
      if (peso === 0) continue;
      suma += peso;
      cx += peso * x;
      cy += peso * y;
    }
  }
  return { x: cx / suma, y: cy / suma };
}

/**
 * Desplazamiento que lleva el centro de la marca real al centro del canvas.
 *
 * En X se usa el extent, no el centro de masa: el extent es lo que el ojo
 * compara contra el borde de la tarjeta, y aun asi deja el centro de masa a
 * ~0.15% del centro.
 *
 * dy mezcla la correccion de extent (0 en la practica) con el nudge optico
 * vertical, que es de gusto y por eso va aparte, con su constante documentada.
 */
export function corrimiento(bbox, w, h) {
  const centroX = (bbox.minX + bbox.maxX) / 2;
  const centroY = (bbox.minY + bbox.maxY) / 2;
  return {
    dx: Math.round(w / 2 - centroX),
    dy: Math.round(h / 2 - centroY) + Math.round(NUDGE_Y * h),
  };
}

/**
 * Limpia el ruido y desplaza la marca. Devuelve { buffer, w, h, bbox }.
 *
 * Trabaja sobre los pixeles crudos en vez de componer con sharp por dos motivos:
 * hay que BORRAR el artefacto (no basta con medirlo) y asi el recorte se
 * valida antes de escribir nada.
 *
 * Falla si el desplazamiento recorta la marca: si `marca-source.png` cambia,
 * esto truena en vez de escribir en silencio un PNG al que le falta una hoja.
 */
export async function limpiarYDesplazar(ruta, dx, dy) {
  const { alfa, w, h } = await leerAlfa(ruta);
  const { mascara, bbox } = mascaraMarca(alfa, w, h);
  const recorta =
    bbox.minX + dx < 0 || bbox.minY + dy < 0 || bbox.maxX + dx > w - 1 || bbox.maxY + dy > h - 1;
  if (recorta) {
    throw new Error(
      `marca: el desplazamiento (${dx}, ${dy}) recorta la marca; ` +
        `bbox ${JSON.stringify(bbox)} en ${w}x${h}`,
    );
  }

  const { data: crudos } = await sharp(ruta)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const src = new Uint8Array(crudos.buffer, crudos.byteOffset, crudos.length);
  const dst = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // fuera de la mascara se descarta el pixel, artefacto incluido
      if (!mascara[i]) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx > w - 1 || ny > h - 1) continue;
      const o = i * 4;
      const d = (ny * w + nx) * 4;
      dst[d] = src[o];
      dst[d + 1] = src[o + 1];
      dst[d + 2] = src[o + 2];
      dst[d + 3] = src[o + 3];
    }
  }

  const buffer = await sharp(dst, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  return {
    buffer,
    w,
    h,
    bbox: { minX: bbox.minX + dx, minY: bbox.minY + dy, maxX: bbox.maxX + dx, maxY: bbox.maxY + dy },
  };
}

/**
 * Mascara de tinta de cualquier asset de marca, sea PNG transparente (el logo
 * base) o tile opaco sobre crema (iconos, favicon, tarjeta OG).
 *
 * La distincion se hace sola: si el archivo tiene canal alfa con algo
 * transparente, se usa el alfa; si es opaco, se usa la distancia al crema.
 */
export async function tinta(ruta) {
  const { alfa, w, h } = await leerAlfa(ruta);
  if (alfa.some((v) => v < 250)) return { alfa, w, h, modo: "alfa" };
  const { data } = await sharp(ruta).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgb = new Uint8Array(data.buffer, data.byteOffset, data.length);
  const sobre = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d =
      Math.abs(rgb[i * 3] - CREMA.r) +
      Math.abs(rgb[i * 3 + 1] - CREMA.g) +
      Math.abs(rgb[i * 3 + 2] - CREMA.b);
    sobre[i] = d > 12 ? 255 : 0;
  }
  return { alfa: sobre, w, h, modo: "crema" };
}

/**
 * Empaqueta PNGs en un .ico (contenedor ICO con entradas PNG, Windows Vista+).
 * sharp no escribe ni lee .ico, asi que el contenedor va a mano.
 */
export function escribirIco(entradas) {
  const CABECERA = 6;
  const ENTRADA = 16;
  const dir = Buffer.alloc(CABECERA + ENTRADA * entradas.length);
  dir.writeUInt16LE(0, 0); // reservado
  dir.writeUInt16LE(1, 2); // tipo 1 = icono
  dir.writeUInt16LE(entradas.length, 4);
  let offset = dir.length;
  entradas.forEach(({ lado, png }, i) => {
    const base = CABECERA + ENTRADA * i;
    dir.writeUInt8(lado >= 256 ? 0 : lado, base + 0);
    dir.writeUInt8(lado >= 256 ? 0 : lado, base + 1);
    dir.writeUInt8(0, base + 2); // paleta
    dir.writeUInt8(0, base + 3); // reservado
    dir.writeUInt16LE(1, base + 4); // planos
    dir.writeUInt16LE(32, base + 6); // bpp
    dir.writeUInt32LE(png.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += png.length;
  });
  return Buffer.concat([dir, ...entradas.map((e) => e.png)]);
}

/** Lee un .ico con entradas PNG y devuelve [{ lado, png }]. */
export function leerIco(buffer) {
  if (buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    throw new Error("marca: no es un contenedor ICO valido");
  }
  const total = buffer.readUInt16LE(4);
  const CABECERA = 6;
  const ENTRADA = 16;
  const frames = [];
  for (let i = 0; i < total; i++) {
    const base = CABECERA + ENTRADA * i;
    const lado = buffer.readUInt8(base) || 256;
    const bytes = buffer.readUInt32LE(base + 8);
    const offset = buffer.readUInt32LE(base + 12);
    frames.push({ lado, png: buffer.subarray(offset, offset + bytes) });
  }
  return frames;
}
