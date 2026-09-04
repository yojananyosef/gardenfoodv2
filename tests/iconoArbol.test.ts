import { describe, expect, it } from "vitest";
import {
  medidasIconoArbol,
  svgArbolHtml,
  svgArbolPorEspecie,
} from "@/components/huerto/IconoArbol";

describe("svgArbolHtml (plano 2D, sin cambios)", () => {
  it("mantiene el formato original", () => {
    const svg = svgArbolHtml("Duraznero");
    expect(svg).toContain('viewBox="0 0 24 30"');
    expect(svg).toContain('width="26"');
  });
});

describe("svgArbolPorEspecie (marcadores del mapa)", () => {
  it("olivo grisáceo y distinto del duraznero", () => {
    const olivo = svgArbolPorEspecie("Olivo");
    const duraznero = svgArbolPorEspecie("Duraznero");
    expect(olivo).toContain("#8a9a5b");
    expect(olivo).toContain("<ellipse");
    expect(duraznero).toContain("#3f8f3a");
    expect(duraznero).not.toContain("#8a9a5b");
  });

  it("cítricos y cerezo llevan puntitos de fruto de su color", () => {
    expect(svgArbolPorEspecie("Naranjo")).toContain("#f59e0b");
    expect(svgArbolPorEspecie("Cereza")).toContain("#dc2626");
    // Olivo sin frutos: sin círculos de fruto naranjas/rojos
    expect(svgArbolPorEspecie("Olivo")).not.toContain("#f59e0b");
  });

  it("formas con silueta propia: parrón ancho, arbusto bajo, penacho alto", () => {
    const parron = svgArbolPorEspecie("Vid");
    expect(parron).toContain('rx="13"');
    const arbusto = svgArbolPorEspecie("Frutilla");
    expect(arbusto).toContain("M16 36 L10.5 25");
    const penacho = svgArbolPorEspecie("Papayo Chileno");
    expect(penacho).toContain('cy="8.5"');
    const multi = svgArbolPorEspecie("Avellano Europeo");
    expect(multi).toContain("M16 36 L11.5 20");
  });

  it("especie desconocida cae al genérico sin romper el SVG", () => {
    const svg = svgArbolPorEspecie("Kumquat Misterioso");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('width="26"');
  });

  it("es determinista", () => {
    expect(svgArbolPorEspecie("Olivo")).toBe(svgArbolPorEspecie("Olivo"));
  });
});

describe("medidasIconoArbol", () => {
  it("arbusto más chico que un nogal, ancla en la base del tronco", () => {
    const arbusto = medidasIconoArbol("Frutilla");
    const nogal = medidasIconoArbol("Nogal");
    expect(arbusto.ancho * arbusto.alto).toBeLessThan(nogal.ancho * nogal.alto);
    // Ancla cerca de la base (margen de 2px por el aire del dibujo)
    expect(arbusto.alto - arbusto.anchorY).toBeLessThanOrEqual(2);
    expect(nogal.anchorX).toBeCloseTo(nogal.ancho / 2, 0);
  });
});
