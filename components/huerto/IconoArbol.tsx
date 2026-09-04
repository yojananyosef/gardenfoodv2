import { colorDeEspecie } from "@/lib/huerto/plano";
import { modeloDeArbol, type FormaArbol } from "@/lib/huerto/arbolModelo";

/**
 * Icono de árbol (copa + tronco + sombra) como SVG inline, usable tanto en
 * React (plano) como como HTML string en marcadores de Leaflet (divIcon).
 */
export function svgArbolHtml(especie: string, ancho = 26): string {
  const color = colorDeEspecie(especie);
  const alto = Math.round(ancho * 1.25);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="${ancho}" height="${alto}" aria-hidden="true">
  <ellipse cx="12" cy="28.4" rx="5.4" ry="1.5" fill="rgba(0,0,0,0.28)"/>
  <path d="M10.9 14.5h2.2l.5 13.3a1.1 1.1 0 0 1-2.2 0z" fill="#7a4a21"/>
  <circle cx="12" cy="9.8" r="7.7" fill="${color}" stroke="#ffffff" stroke-width="1.6"/>
  <circle cx="9.3" cy="7.4" r="2.2" fill="rgba(255,255,255,0.4)"/>
</svg>`;
}

/** Semilla estable por especie para ubicar frutos sin azar en cada render. */
function semillaDe(especie: string): number {
  let h = 0;
  for (const ch of especie) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

/** Puntitos de fruto en espiral dorada dentro de la elipse de copa. */
function puntosFruto(
  especie: string,
  cantidad: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  const semilla = semillaDe(especie);
  const pts: string[] = [];
  const n = Math.min(Math.max(cantidad, 0), 7);
  for (let i = 0; i < n; i++) {
    const ang = i * 2.4 + ((semilla % 628) / 100);
    const rad = 0.62;
    const x = cx + Math.cos(ang) * rx * rad;
    const y = cy + Math.sin(ang) * ry * rad;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function circulosFruto(puntos: string, color: string): string {
  if (!puntos) return "";
  return puntos
    .split(" ")
    .map((pt) => {
      const [x, y] = pt.split(",");
      return `<circle cx="${x}" cy="${y}" r="1.7" fill="${color}" stroke="#ffffff" stroke-width="0.5"/>`;
    })
    .join("");
}

export type MedidasIcono = { ancho: number; alto: number; anchorX: number; anchorY: number };

const MEDIDAS_POR_FORMA: Record<FormaArbol, MedidasIcono> = {
  esferico: { ancho: 26, alto: 32, anchorX: 13, anchorY: 30 },
  citrico: { ancho: 26, alto: 32, anchorX: 13, anchorY: 30 },
  grande: { ancho: 30, alto: 36, anchorX: 15, anchorY: 34 },
  olivo: { ancho: 28, alto: 30, anchorX: 14, anchorY: 28 },
  higuera: { ancho: 30, alto: 32, anchorX: 15, anchorY: 30 },
  parron: { ancho: 32, alto: 26, anchorX: 16, anchorY: 24 },
  arbusto: { ancho: 24, alto: 24, anchorX: 12, anchorY: 22 },
  multitronco: { ancho: 26, alto: 32, anchorX: 13, anchorY: 30 },
  penacho: { ancho: 24, alto: 36, anchorX: 12, anchorY: 34 },
};

export function medidasIconoArbol(especie: string): MedidasIcono {
  return MEDIDAS_POR_FORMA[modeloDeArbol(especie).forma];
}

/**
 * Icono por especie para los marcadores del mapa: silueta según la forma del
 * modelo 3D (olivo gris achatado, parrón ancho, arbusto bajo, penacho alto…),
 * color de copa y puntitos de fruto. viewBox común 32×40.
 */
export function svgArbolPorEspecie(especie: string): string {
  const modelo = modeloDeArbol(especie);
  const { forma, colorCopa, colorCopa2, frutos } = modelo;
  const m = MEDIDAS_POR_FORMA[forma];
  const sx = 32 / m.ancho;
  const stroke = `stroke="#ffffff" stroke-width="${(1.4 * sx).toFixed(2)}"`;

  const sombra = (cx: number, cy: number, rx: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="1.6" fill="rgba(0,0,0,0.28)"/>`;
  const highlight = (cx: number, cy: number, r: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.4)"/>`;
  const dots = (pts: string) =>
    frutos ? circulosFruto(pts, frutos.color) : "";

  let cuerpo = "";
  switch (forma) {
    case "arbusto": {
      cuerpo =
        sombra(16, 36.5, 7) +
        `<path d="M16 36 L10.5 25 M16 36 L16 23.5 M16 36 L21.5 25" stroke="#6e4520" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
        `<circle cx="10.5" cy="22" r="5.2" fill="${colorCopa}" ${stroke}/>` +
        `<circle cx="16" cy="19.5" r="5.6" fill="${colorCopa2}" ${stroke}/>` +
        `<circle cx="21.5" cy="22" r="5.2" fill="${colorCopa}" ${stroke}/>` +
        highlight(14, 17.5, 1.6) +
        dots(puntosFruto(especie, frutos?.cantidad ?? 0, 16, 21, 9, 6));
      break;
    }
    case "parron": {
      cuerpo =
        sombra(16, 36.5, 8) +
        `<path d="M15 24h2l.6 12.4a1.1 1.1 0 0 1-2.2 0z" fill="#6e4520"/>` +
        `<ellipse cx="16" cy="19" rx="13" ry="6" fill="${colorCopa}" ${stroke}/>` +
        `<ellipse cx="16" cy="17.5" rx="8" ry="3.6" fill="${colorCopa2}"/>` +
        highlight(10, 16.5, 1.6) +
        dots(puntosFruto(especie, frutos?.cantidad ?? 0, 16, 19, 10, 4.5));
      break;
    }
    case "penacho": {
      cuerpo =
        sombra(16, 36.5, 4.5) +
        `<path d="M15.1 12h1.8l.5 24.2a1.1 1.1 0 0 1-2.2 0z" fill="#6e4520"/>` +
        `<ellipse cx="16" cy="8.5" rx="7" ry="4.4" fill="${colorCopa}" ${stroke}/>` +
        `<circle cx="11" cy="10" r="2.6" fill="${colorCopa2}"/>` +
        `<circle cx="21" cy="10" r="2.6" fill="${colorCopa2}"/>` +
        highlight(14, 7, 1.4);
      break;
    }
    case "multitronco": {
      cuerpo =
        sombra(16, 36.5, 6) +
        `<path d="M16 36 L11.5 20 M16 36 L16 19 M16 36 L20.5 20" stroke="#6e4520" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
        `<circle cx="16" cy="13" r="9" fill="${colorCopa}" ${stroke}/>` +
        `<circle cx="19" cy="10" r="4.5" fill="${colorCopa2}"/>` +
        highlight(13, 10.5, 2) +
        dots(puntosFruto(especie, frutos?.cantidad ?? 0, 16, 13, 7, 7));
      break;
    }
    case "olivo":
    case "higuera": {
      const ancha = forma === "higuera";
      const rx = ancha ? 12 : 11.5;
      const ry = ancha ? 8.5 : 8;
      const cy = ancha ? 16 : 15;
      cuerpo =
        sombra(16, 36.5, 7) +
        `<path d="M14.4 ${cy + 5}h3.2l.7 ${36.5 - (cy + 5)}a1.3 1.3 0 0 1-2.6 0z" fill="#6e4520"/>` +
        `<ellipse cx="16" cy="${cy}" rx="${rx}" ry="${ry}" fill="${colorCopa}" ${stroke}/>` +
        `<ellipse cx="16" cy="${cy - 1.5}" rx="${rx * 0.55}" ry="${ry * 0.55}" fill="${colorCopa2}"/>` +
        highlight(16 - rx * 0.45, cy - ry * 0.4, 1.8) +
        dots(puntosFruto(especie, frutos?.cantidad ?? 0, 16, cy, rx * 0.8, ry * 0.8));
      break;
    }
    default: {
      // esferico / citrico / grande
      const grande = forma === "grande";
      const r = grande ? 11.5 : 10;
      const cy = grande ? 14 : 14.5;
      const tx = grande ? 14.5 : 14.9;
      const tw = grande ? 3 : 2.2;
      cuerpo =
        sombra(16, 36.5, grande ? 7 : 6) +
        `<path d="M${tx} ${cy + r - 3}h${tw}l.7 ${36.5 - (cy + r - 3)}a1.2 1.2 0 0 1-2.4 0z" fill="#6e4520"/>` +
        `<circle cx="16" cy="${cy}" r="${r}" fill="${colorCopa}" ${stroke}/>` +
        `<circle cx="${16 + r * 0.32}" cy="${cy - r * 0.3}" r="${(r * 0.55).toFixed(1)}" fill="${colorCopa2}"/>` +
        highlight(16 - r * 0.35, cy - r * 0.35, grande ? 2.4 : 2.1) +
        dots(puntosFruto(especie, frutos?.cantidad ?? 0, 16, cy, r * 0.8, r * 0.8));
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="${m.ancho}" height="${m.alto}" aria-hidden="true">${cuerpo}</svg>`;
}

export function IconoArbol({
  especie,
  className,
}: {
  especie: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: svgArbolHtml(especie, 24) }}
    />
  );
}
