import { colorDeEspecie } from "@/lib/huerto/plano";

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
