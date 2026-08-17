import { describe, expect, it } from "vitest";
import { diasEnMes, grillaDelMes, fechaISO, hoyISO } from "@/lib/fechas";
import { diagnosticar, SINTOMAS } from "@/lib/agronomy/diagnostico";

describe("lib/fechas", () => {
  it("calcula días por mes (incluye bisiesto)", () => {
    expect(diasEnMes(2026, 0)).toBe(31);
    expect(diasEnMes(2026, 1)).toBe(28);
    expect(diasEnMes(2024, 1)).toBe(29);
    expect(diasEnMes(2026, 11)).toBe(31);
  });

  it("genera grilla de mes que inicia en lunes", () => {
    const marzo2026 = grillaDelMes(2026, 2);
    expect(marzo2026.filter((c) => c !== null).length).toBe(31);
    expect(marzo2026[0]).toBeNull(); // 1 mar 2026 es domingo => offset 6
    expect(marzo2026[6]).toBe(1);
    expect(marzo2026.length % 7).toBe(0);
  });

  it("formatea fechas ISO locales", () => {
    expect(fechaISO(2026, 2, 5)).toBe("2026-03-05");
    expect(fechaISO(2026, 11, 1)).toBe("2026-12-01");
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("diagnóstico fitosanitario", () => {
  it("define los 8 síntomas esperados", () => {
    expect(SINTOMAS.map((s) => s.id)).toEqual([
      "amarillas",
      "manchas",
      "marchitez",
      "frutos_pequenos",
      "insectos",
      "polvo",
      "caida",
      "raiz",
    ]);
  });

  it("devuelve vacío sin síntomas", () => {
    expect(diagnosticar([])).toEqual([]);
  });

  it("encuentra coincidencias y ordena por fuerza de match", () => {
    const resultados = diagnosticar(["insectos", "polvo"]);
    expect(resultados.length).toBeGreaterThan(0);
    for (let i = 1; i < resultados.length; i++) {
      expect(resultados[i - 1].matchCount).toBeGreaterThanOrEqual(
        resultados[i].matchCount,
      );
    }
    expect(resultados.every((r) => r.accionOrganica.length > 0)).toBe(true);
  });

  it("limita a 8 resultados y clasifica gravedad", () => {
    const resultados = diagnosticar(["amarillas", "manchas", "insectos", "marchitez"]);
    expect(resultados.length).toBeLessThanOrEqual(8);
    for (const r of resultados) {
      expect(["Leve-Media", "Media-Alta"]).toContain(r.gravedad);
    }
  });
});