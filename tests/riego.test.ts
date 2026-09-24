import { describe, expect, it } from "vitest";
import { calcularRiego } from "@/lib/riego/calc";
import { zonaRiegoDeZonaId } from "@/lib/riego/datos";

describe("zonaRiegoDeZonaId", () => {
  it("mapea norte, valle, sur y austral", () => {
    expect(zonaRiegoDeZonaId(2)).toBe("N1");
    expect(zonaRiegoDeZonaId(3)).toBe("N2");
    expect(zonaRiegoDeZonaId(7)).toBe("C1");
    expect(zonaRiegoDeZonaId(12)).toBe("C1"); // Rapel
    expect(zonaRiegoDeZonaId(14)).toBe("S1");
    expect(zonaRiegoDeZonaId(20)).toBe("S2"); // Osorno-Aysén-Magallanes
    expect(zonaRiegoDeZonaId(null)).toBe("C1");
  });
});

describe("calcularRiego", () => {
  it("caso dorado: duraznero diciembre, centro sur, franco, punto de riego, adulto 2m", () => {
    const r = calcularRiego({
      dbKey: "Duraznero",
      mes: 12,
      zonaId: 14,
      suelo: "M",
      edad: "adulto",
      copaM: 2,
      humedad: 2,
    });
    expect(r).not.toBeNull();
    // Base FICHAS maduración/cosecha con factores neutros: rango válido y días > 0.
    expect(r!.litrosMin).toBeGreaterThan(0);
    expect(r!.litrosMax).toBeGreaterThanOrEqual(r!.litrosMin);
    expect(r!.cadaDias).toBeGreaterThanOrEqual(1);
    expect(r!.regarHoy).toBe(true);
    expect(r!.baldes).toBeCloseTo(r!.litros / 10, 1);
  });

  it("suelo arenoso pide menos litros y más seguido que arcilloso", () => {
    const g = calcularRiego({ dbKey: "Manzano", mes: 1, zonaId: 7, suelo: "G", edad: "adulto", copaM: 2, humedad: 2 });
    const f = calcularRiego({ dbKey: "Manzano", mes: 1, zonaId: 7, suelo: "F", edad: "adulto", copaM: 2, humedad: 2 });
    expect(g!.litros).toBeLessThan(f!.litros);
    expect(g!.cadaDias).toBeLessThanOrEqual(f!.cadaDias);
  });

  it("árbol recién plantado usa ~30 % del agua del adulto", () => {
    const bb = calcularRiego({ dbKey: "Cerezo", mes: 11, zonaId: 7, suelo: "M", edad: "recien", copaM: 2, humedad: 2 });
    const ad = calcularRiego({ dbKey: "Cerezo", mes: 11, zonaId: 7, suelo: "M", edad: "adulto", copaM: 2, humedad: 2 });
    expect(bb!.litros / ad!.litros).toBeCloseTo(0.3, 1);
  });

  it("copa doble cuadruplica (al cuadrado)", () => {
    const chico = calcularRiego({ dbKey: "Olivo", mes: 1, zonaId: 7, suelo: "M", edad: "adulto", copaM: 3, humedad: 2 });
    const grande = calcularRiego({ dbKey: "Olivo", mes: 1, zonaId: 7, suelo: "M", edad: "adulto", copaM: 6, humedad: 2 });
    expect(grande!.litros / chico!.litros).toBeCloseTo(4, 0);
  });

  it("tierra húmeda dice no regar hoy", () => {
    const r = calcularRiego({ dbKey: "Duraznero", mes: 1, zonaId: 7, suelo: "M", edad: "adulto", copaM: 2, humedad: 4 });
    expect(r!.regarHoy).toBe(false);
    expect(r!.litros).toBe(0);
  });

  it("goteo calcula horas según caudal", () => {
    const r = calcularRiego({ dbKey: "Duraznero", mes: 1, zonaId: 7, suelo: "M", edad: "adulto", copaM: 2, humedad: 2, caudalLH: 16 });
    expect(r!.horasGoteo).toBeCloseTo(r!.litros / 16, 1);
  });
});
