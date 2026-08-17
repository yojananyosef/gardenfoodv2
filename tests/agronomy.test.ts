import { describe, expect, it } from "vitest";
import {
  ESPECIES,
  COMUNAS,
  ZONAS,
  COMUNAS_ZONA,
  VIABILIDAD,
  FICHAS,
  getZonaDeComuna,
  getEspeciesPorZona,
  getCalendarioPorMes,
  getTareasDelMes,
  getAlertasDelMes,
  getViabilidad,
  getMacrozona,
} from "@/lib/agronomy";

describe("agronomy data layer", () => {
  it("tiene 20 zonas agroclimáticas", () => {
    expect(Object.keys(ZONAS)).toHaveLength(20);
  });

  it("tiene 245 comunas mapeadas (cobertura real del legacy)", () => {
    expect(COMUNAS).toHaveLength(245);
    expect(Object.keys(COMUNAS_ZONA)).toHaveLength(245);
  });

  it("tiene un catálogo de 30 especies", () => {
    expect(ESPECIES).toHaveLength(30);
    expect(ESPECIES.every((e) => e.slug && e.dbKey)).toBe(true);
  });

  it("cada especie tiene calendario de 12 meses", () => {
    for (const especie of ESPECIES) {
      expect(FICHAS[especie.dbKey], especie.dbKey).toBeTruthy();
      expect(FICHAS[especie.dbKey].cal).toHaveLength(12);
    }
  });

  it("todas las especies tienen los 12 meses en su calendario", () => {
    const MESES = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    for (const especie of ESPECIES) {
      const meses = FICHAS[especie.dbKey].cal.map((m) => m.mes);
      expect([...meses].sort()).toEqual([...MESES].sort());
    }
  });

  it("resuelve la zona desde una comuna conocida", () => {
    expect(getZonaDeComuna("Pirque")?.nombre).toBe("Santiago Sur - Buin");
    expect(getZonaDeComuna("Rancagua")?.id).toBe(10);
  });

  it("cae a zona neutra por defecto con comuna desconocida", () => {
    expect(getZonaDeComuna("Comuna Inventada")).not.toBeNull();
    expect(getZonaDeComuna(undefined)).not.toBeNull();
  });

  it("muestra la muestra de la matriz de viabilidad", () => {
    expect(getViabilidad("Duraznero", 7)).toBe("si");
    expect(getViabilidad("Duraznero", 1)).toBe("no");
    expect(getViabilidad("Arandano", 18)).toBe("si");
    expect(getViabilidad("Palto", 1)).toBe("riesgo");
  });

  it("la matriz cubre las 30 especies para toda zona", () => {
    const zonas = Object.keys(ZONAS).map(Number);
    for (const especie of ESPECIES) {
      for (const zona of zonas) {
        expect(VIABILIDAD[especie.dbKey], `${especie.dbKey} z${zona}`).toHaveProperty(
          String(zona),
        );
      }
    }
  });

  it("getEspeciesPorZona clasifica si/riesgo/no", () => {
    const result = getEspeciesPorZona(7);
    expect(result.si.length + result.riesgo.length + result.no.length).toBe(30);
    expect(result.si.length).toBeGreaterThan(0);
  });

  it("getTareasDelMes excluye tareas marcadas como ninguna", () => {
    const enero = getTareasDelMes("Duraznero", "Enero");
    expect(enero.some((t) => t.tipo === "riego")).toBe(true);
    const julio = getTareasDelMes("Duraznero", "Julio");
    expect(julio.some((t) => t.tipo === "nutricion")).toBe(false);
  });

  it("getCalendarioPorMes devuelve entrada para un mes específico", () => {
    const julio = getCalendarioPorMes("Duraznero", "Julio");
    expect(julio?.etapa).toBe("Reposo / Poda");
    expect(julio?.alerta).toBe("Realizar poda de producción");
  });

  it("getAlertasDelMes devuelve la alerta estacional", () => {
    const alerta = getAlertasDelMes("Duraznero", "Julio");
    expect(alerta?.alerta).toContain("poda");
  });

  it("mapea zonas a macrozonas fenológicas", () => {
    expect(getMacrozona(7)).toBe("Santiago-RM");
    expect(getMacrozona(20)).toBe("Sur");
  });
});