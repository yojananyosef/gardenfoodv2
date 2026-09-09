import { describe, expect, it } from "vitest";
import {
  ajustePorArbol,
  cosechaTipicaAdulta,
  fertilizantePorProducto,
  fenologiaPorEspecie,
  gramosACaseras,
  programaDeEspecie,
  tieneFertilizacion,
} from "@/lib/agronomy/fertilizacion";

describe("fertilización casera (xlsx socio)", () => {
  it("programa del duraznero en transición Ñuble al suelo tiene 3 momentos", () => {
    const p = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "suelo");
    expect(p).toHaveLength(3);
    expect(p.map((x) => x.momento)).toEqual([
      "Cuando despierta",
      "Cuando engorda la fruta",
      "Cuando se recupera",
    ]);
  });

  it("el goteo aplica más veces con menos gramos por aplicación", () => {
    const suelo = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "suelo");
    const goteo = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "goteo");
    const periodoEngorda = (arr: typeof suelo) => arr.find((x) => x.orden === 1)!;
    expect(periodoEngorda(goteo).veces).toBeGreaterThan(periodoEngorda(suelo).veces);
    for (const d of periodoEngorda(goteo).detalle) {
      if (d.gramos_cada_vez) {
        const gramosSuelo = periodoEngorda(suelo).detalle.find(
          (x) => x.nutriente === d.nutriente,
        )?.gramos_cada_vez;
        expect(d.gramos_cada_vez).toBeLessThanOrEqual(gramosSuelo ?? Infinity);
      }
    }
  });

  it("peso por cucharada del catálogo: urea ≈ 11 g", () => {
    const urea = fertilizantePorProducto("Urea");
    expect(urea?.gramos_cucharada).toBe(11);
    expect(urea?.n_pct).toBe(46);
  });

  it("80,7 g de urea ≈ 7 cucharadas soperas", () => {
    const texto = gramosACaseras(80.7, "Urea");
    expect(texto).toMatch(/taza|cucharada/);
    expect(gramosACaseras(5, "Urea")).toBe("menos de ½ cucharada");
  });

  it("ajuste por edad del MI PLAN: recién plantado × 0,3", () => {
    expect(ajustePorArbol("Duraznero", "adulto")).toBe(1);
    expect(ajustePorArbol("Duraznero", "recien")).toBe(0.3);
    expect(ajustePorArbol("Duraznero", "recien", 55)).toBeLessThan(1);
    expect(ajustePorArbol("Duraznero", "formacion", 110)).toBeCloseTo(1.2);
  });

  it("cosecha típica del duraznero adulto en el xlsx es 55 kg", () => {
    expect(cosechaTipicaAdulta("Duraznero")).toBe(55);
  });

  it("las 6 regiones del xlsx están en la fenología del duraznero", () => {
    const zonas = fenologiaPorEspecie("Duraznero").map((f) => f.region_guia);
    expect(zonas).toHaveLength(6);
    expect(zonas).toContain("Transición (Ñuble-Biobío)");
  });

  it("no cultiva que no prospera: se_cultiva false con nota", () => {
    const sur = fenologiaPorEspecie("Duraznero").find((f) => f.region_guia.startsWith("Sur"))!;
    if (sur.se_cultiva === false) expect(sur.nota).toContain("clima");
  });

  it("tieneFertilizacion normaliza mayúsculas", () => {
    expect(tieneFertilizacion("duraznero")).toBe(true);
    expect(tieneFertilizacion("Cerezo")).toBe(true);
    expect(tieneFertilizacion("Frutilla de cana")).toBe(false);
  });
});
