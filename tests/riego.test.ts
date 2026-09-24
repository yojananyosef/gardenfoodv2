import { describe, expect, it } from "vitest";
import { calcularRiego } from "@/lib/riego/calc";
import { zonaRiegoDeZonaId } from "@/lib/riego/datos";
import type { RiegoBasePayload } from "@/lib/riego/actions";

/**
 * Valores literales de la Base de Datos Técnica GARDENFOOD (migración 0032,
 * seed del Excel). No son inventados: se verificaron contra producción.
 */
function payloadBase(): RiegoBasePayload {
  return {
    mensual: [
      { especie: "Duraznero", mes: 1, etapa: "Maduración", diasMin: 3, diasMax: 4, litrosMin: 60, litrosMax: 80, reposo: 0 },
      { especie: "Duraznero", mes: 12, etapa: "Crecimiento de fruto → Maduración", diasMin: 3, diasMax: 4, litrosMin: 55, litrosMax: 75, reposo: 0 },
      { especie: "Manzano", mes: 1, etapa: "Crecimiento", diasMin: 5, diasMax: 7, litrosMin: 50, litrosMax: 70, reposo: 0 },
      { especie: "Olivo", mes: 1, etapa: "Crecimiento", diasMin: 7, diasMax: 10, litrosMin: 50, litrosMax: 50, reposo: 0 },
      { especie: "Cerezo", mes: 11, etapa: "Crecimiento → Pinta y maduración", diasMin: 4, diasMax: 5, litrosMin: 45, litrosMax: 45, reposo: 0 },
    ],
    etapas: [
      { especie: "Duraznero", codigo: "BRO", etapaPrograma: "Brotación (Sep-Oct)", mesesOriginales: "Septiembre - Octubre", coincideExacta: true, diasMin: 7, diasMax: 10, litrosMin: 20, litrosMax: 30 },
      { especie: "Duraznero", codigo: "MAD", etapaPrograma: "Maduración (Dic-Feb)", mesesOriginales: "Diciembre - Febrero", coincideExacta: true, diasMin: 3, diasMax: 4, litrosMin: 60, litrosMax: 80 },
    ],
    suelos: [
      { clave: "G", nombre: "Gruesa (arenosa)", tecnico: "Arena", aguaMinMm: 50, aguaMaxMm: 100, factor: 0.7, manejo: "" },
      { clave: "MG", nombre: "Moderadamente gruesa", tecnico: "Franco arenoso", aguaMinMm: 108, aguaMaxMm: 142, factor: 0.85, manejo: "" },
      { clave: "M", nombre: "Media (franca)", tecnico: "Franco", aguaMinMm: 125, aguaMaxMm: 175, factor: 1.0, manejo: "" },
      { clave: "F", nombre: "Fina (arcillosa)", tecnico: "Arcilla", aguaMinMm: 133, aguaMaxMm: 200, factor: 1.15, manejo: "" },
    ],
    zonas: [
      { clave: "N1", nombre: "Norte y valles transversales", dondeQueda: "", etoVerano: "6 a 7", factorClima: 1.3, desfase: -1, significado: "" },
      { clave: "C1", nombre: "Valle central interior (referencia)", dondeQueda: "", etoVerano: "6 a 6,5", factorClima: 1.0, desfase: 0, significado: "" },
      { clave: "S1", nombre: "Centro sur", dondeQueda: "", etoVerano: "5 a 5,5", factorClima: 0.88, desfase: 0, significado: "" },
      { clave: "S2", nombre: "Sur", dondeQueda: "", etoVerano: "4 a 4,8", factorClima: 0.72, desfase: 1, significado: "" },
    ],
    edades: [
      { n: 1, nombre: "Recién plantado (0-1 año)", factorLitros: 0.3, factorDias: 0.55 },
      { n: 2, nombre: "Joven (2-3 años)", factorLitros: 0.55, factorDias: 0.75 },
      { n: 3, nombre: "En producción inicial (4-5 años)", factorLitros: 0.8, factorDias: 0.9 },
      { n: 4, nombre: "Adulto (6 años o más)", factorLitros: 1.0, factorDias: 1.0 },
    ],
    niveles: [
      { nivel: 1, nombre: "0-25 % — muy seco", pctMin: 0, pctMax: 25, factorRiego: 1.3, factorControl: 0, significado: "" },
      { nivel: 2, nombre: "25-50 % — seco (punto de riego)", pctMin: 25, pctMax: 50, factorRiego: 1.0, factorControl: 0, significado: "" },
      { nivel: 3, nombre: "50-75 % — húmedo", pctMin: 50, pctMax: 75, factorRiego: 0, factorControl: 0.35, significado: "" },
      { nivel: 4, nombre: "75-100 % — muy húmedo", pctMin: 75, pctMax: 100, factorRiego: 0, factorControl: 0.6, significado: "" },
      { nivel: 5, nombre: "100 % — capacidad de campo", pctMin: 100, pctMax: 100, factorRiego: 0, factorControl: 0.75, significado: "" },
    ],
    especie: { especie: "Duraznero", excelNombre: "Duraznero", nombreCientifico: "Prunus persica", grupo: "Carozo", mantencionL: 11, suelo: "Suelto", ph: "6.0 a 7.0", copaRefM: 2.0 },
  };
}

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

describe("calcularRiego (base Excel)", () => {
  it("caso dorado: duraznero enero, C1, franco, adulto 2m, punto de riego", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 2 },
      payloadBase(),
    );
    expect(r).not.toBeNull();
    expect(r!.litrosMin).toBe(60);
    expect(r!.litrosMax).toBe(80);
    expect(r!.litros).toBe(70);
    expect(r!.cadaDias).toBe(4); // prom 3.5 redondea a 4
    expect(r!.regarHoy).toBe(true);
    expect(r!.baldes).toBeCloseTo(7, 1);
    expect(r!.etapa).toBe("Maduración");
    expect(r!.fuente).toBe("calendario");
  });

  it("suelo arenoso pide menos litros que arcilloso", () => {
    const base = payloadBase();
    const g = calcularRiego({ dbKey: "Manzano", mes: 1, zonaRiego: "C1", suelo: "G", edadN: 4, copaM: 2, humedad: 2 }, base);
    const f = calcularRiego({ dbKey: "Manzano", mes: 1, zonaRiego: "C1", suelo: "F", edadN: 4, copaM: 2, humedad: 2 }, base);
    expect(g!.litrosMin).toBe(35); // 50 × 0.7
    expect(f!.litrosMin).toBe(57); // 50 × 1.15 = 57.49… en flotante → 57
  });

  it("árbol recién plantado usa ~30 % del agua del adulto", () => {
    const base = payloadBase();
    const bb = calcularRiego({ dbKey: "Cerezo", mes: 11, zonaRiego: "C1", suelo: "M", edadN: 1, copaM: 2, humedad: 2 }, base);
    const ad = calcularRiego({ dbKey: "Cerezo", mes: 11, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 2 }, base);
    expect(bb!.litros / ad!.litros).toBeCloseTo(0.3, 1);
  });

  it("copa doble cuadruplica (al cuadrado, ref olivo 3 m)", () => {
    const base = { ...payloadBase(), especie: { ...payloadBase().especie!, copaRefM: 3.0 } };
    const chico = calcularRiego({ dbKey: "Olivo", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 3, humedad: 2 }, base);
    const grande = calcularRiego({ dbKey: "Olivo", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 6, humedad: 2 }, base);
    expect(grande!.litros / chico!.litros).toBeCloseTo(4, 0);
  });

  it("tierra húmeda dice no regar hoy", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 4 },
      payloadBase(),
    );
    expect(r!.regarHoy).toBe(false);
    expect(r!.litros).toBe(0);
  });

  it("goteo calcula horas según caudal", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 2, caudalLH: 16 },
      payloadBase(),
    );
    expect(r!.horasGoteo).toBeCloseTo(r!.litros / 16, 1);
  });

  it("etapa observada manda sobre el calendario", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 1, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 2, etapaCodigo: "BRO" },
      payloadBase(),
    );
    expect(r!.fuente).toBe("observacion");
    expect(r!.etapa).toBe("Brotación (Sep-Oct)");
    expect(r!.litrosMin).toBe(20);
    expect(r!.litrosMax).toBe(30);
  });

  it("zona sur corre el mes (desfase +1: enero usa diciembre)", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 1, zonaRiego: "S2", suelo: "M", edadN: 4, copaM: 2, humedad: 2 },
      payloadBase(),
    );
    expect(r!.etapa).toBe("Crecimiento de fruto → Maduración");
    expect(r!.litrosMin).toBe(55);
  });

  it("sin fila mensual devuelve null (no inventa)", () => {
    const r = calcularRiego(
      { dbKey: "Duraznero", mes: 5, zonaRiego: "C1", suelo: "M", edadN: 4, copaM: 2, humedad: 2 },
      payloadBase(),
    );
    expect(r).toBeNull();
  });
});
