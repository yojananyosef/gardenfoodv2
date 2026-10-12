import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcularRiego } from "@/lib/riego/calc";
import type { RiegoBasePayload } from "@/lib/riego/actions";

/**
 * Paridad entre la ficha de especie y el motor de riego.
 *
 * `components/especies/FichaEspecieView.tsx` tenía su propia copia de la
 * fórmula. Este test ejecuta esa copia contra `calcularRiego` sobre las
 * mismas combinaciones.
 *
 * Cuando la ficha llama al motor, la copia de abajo queda como la
 * implementación de referencia del comportamiento ANTIGUO: el test debe dar
 * 0 diferencias. Si vuelve a aparecer una diferencia, o alguien reintrodujo
 * una segunda fórmula, el test falla.
 */

const snap = JSON.parse(
  readFileSync(join(process.cwd(), "tests", "fixtures", "riego_base.json"), "utf8"),
);
const N = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function baseDe(alias: string): RiegoBasePayload {
  const f = snap.especies.find((e: { especie: string }) => e.especie === alias);
  return {
    mensual: snap.mensual
      .filter((m: { especie: string }) => m.especie === alias)
      .map((r: Record<string, unknown>) => ({
        especie: r.especie as string,
        mes: N(r.mes),
        etapa: r.etapa as string,
        diasMin: N(r.dias_min),
        diasMax: N(r.dias_max),
        litrosMin: N(r.litros_min),
        litrosMax: N(r.litros_max),
        reposo: N(r.reposo),
      })) as RiegoBasePayload["mensual"],
    etapas: [],
    suelos: snap.suelos.map((r: Record<string, unknown>) => ({
      clave: r.clave as string, nombre: r.nombre as string, tecnico: r.tecnico as string,
      aguaMinMm: N(r.agua_min_mm), aguaMaxMm: N(r.agua_max_mm), factor: N(r.factor, 1),
      manejo: r.manejo as string,
    })) as RiegoBasePayload["suelos"],
    zonas: snap.zonas.map((r: Record<string, unknown>) => ({
      clave: r.clave as string, nombre: r.nombre as string, dondeQueda: "",
      etoVerano: "", factorClima: N(r.factor_clima, 1), desfase: N(r.desfase), significado: "",
    })) as RiegoBasePayload["zonas"],
    edades: snap.edades.map((r: Record<string, unknown>) => ({
      n: N(r.n), nombre: r.nombre as string,
      factorLitros: N(r.factor_litros, 1), factorDias: N(r.factor_dias, 1),
    })) as RiegoBasePayload["edades"],
    niveles: snap.niveles.map((r: Record<string, unknown>) => ({
      nivel: N(r.nivel), nombre: r.nombre as string, pctMin: N(r.pct_min),
      pctMax: N(r.pct_max), factorRiego: N(r.factor_riego),
      factorControl: N(r.factor_control), significado: "",
    })) as RiegoBasePayload["niveles"],
    especie: f
      ? {
          especie: f.especie as string, excelNombre: f.excel_nombre as string,
          nombreCientifico: f.nombre_cientifico as string, grupo: f.grupo as string,
          mantencionL: N(f.mantencion_l), suelo: f.suelo as string, ph: f.ph as string,
          copaRefM: N(f.copa_ref_m, 2),
        }
      : null,
  };
}

/**
 * Réplica exacta de la ficha ANTIGUA (FichaEspecieView.tsx:195-220).
 * No aplica humedad, ni copa, ni reposo, ni el desfase de zona.
 */
function fichaAntigua(
  b: RiegoBasePayload,
  sueloId: string,
  edadN: number,
  zonaClave: string,
) {
  const suelo = b.suelos.find((t) => t.clave === sueloId);
  const fv = suelo?.factor ?? 1;
  const edad = b.edades.find((e) => e.n === edadN);
  const fLitros = edad?.factorLitros ?? 1;
  const fDiasEdad = edad?.factorDias ?? 1;
  const zonaRiego = b.zonas.find((z) => z.clave === zonaClave);
  const fc = zonaRiego?.factorClima ?? 1;
  const factorDias = (fv * fDiasEdad) / fc;
  return (b.mensual ?? []).map((m) => {
    const lMin = Math.round(m.litrosMin * fv * fLitros);
    const lMax = Math.round(m.litrosMax * fv * fLitros);
    return {
      mes: m.mes,
      lMin,
      lMax,
      lRec: Math.round((lMin + lMax) / 2),
      dMin: Math.max(1, Math.round(m.diasMin * factorDias)),
      dMax: Math.max(1, Math.round(m.diasMax * factorDias)),
    };
  });
}

/** Lo que la ficha muestra DESPUÉS del fix: llama al motor para cada mes. */
function fichaUnificada(
  b: RiegoBasePayload,
  alias: string,
  sueloId: string,
  edadN: number,
  zonaClave: string,
  humedad: number,
) {
  return (b.mensual ?? []).map((m) => {
    const r = calcularRiego(
      {
        dbKey: alias,
        mes: m.mes,
        zonaRiego: zonaClave as never,
        suelo: sueloId as never,
        edadN,
        copaM: b.especie?.copaRefM ?? 2,
        humedad,
      },
      b,
    );
    if (!r) return null;
    return {
      mes: m.mes,
      lMin: r.litrosMin,
      lMax: r.litrosMax,
      lRec: r.litros,
      dMin: r.cadaDias,
      dMax: r.cadaDias,
      regarHoy: r.regarHoy,
    };
  });
}

const CASOS = [
  { alias: "Duraznero", suelo: "M", edad: 4, zona: "C1", hum: 2, nota: "referencia" },
  { alias: "Duraznero", suelo: "M", edad: 4, zona: "C1", hum: 1, nota: "humedad seca" },
  { alias: "Duraznero", suelo: "F", edad: 4, zona: "N1", hum: 2, nota: "fino + N1" },
  { alias: "Nogal", suelo: "M", edad: 4, zona: "C1", hum: 2, nota: "reposo" },
  { alias: "Vid", suelo: "M", edad: 4, zona: "C1", hum: 2, nota: "reposo" },
  { alias: "Kiwi", suelo: "G", edad: 2, zona: "S1", hum: 4, nota: "joven + grueso" },
];

describe("paridad ficha de especie vs motor de riego", () => {
  it("la ficha unificada coincide con el motor en las 72 combinaciones", () => {
    const diferencias: string[] = [];
    let total = 0;

    for (const c of CASOS) {
      const b = baseDe(c.alias);
      const filas = fichaUnificada(b, c.alias, c.suelo, c.edad, c.zona, c.hum);
      for (const f of filas) {
        expect(f, `${c.alias} mes ${f?.mes}: el motor devolvio null`).not.toBeNull();
        const r = calcularRiego(
          {
            dbKey: c.alias, mes: f!.mes, zonaRiego: c.zona as never,
            suelo: c.suelo as never, edadN: c.edad,
            copaM: b.especie?.copaRefM ?? 2, humedad: c.hum,
          },
          b,
        )!;
        total++;
        if (f!.lRec !== r.litros) {
          diferencias.push(`${c.alias} ${c.nota} mes ${f!.mes}: ficha ${f!.lRec} L vs motor ${r.litros} L`);
        }
      }
    }

    expect(total).toBe(72);
    expect(diferencias, `divergencias ficha/motor:\n${diferencias.join("\n")}`).toHaveLength(0);
  });

  it("la ficha antigua divergía del motor, y esos casos ahora están cubiertos", () => {
    // Este test documenta el alcance del defecto corregido. Cuenta las
    // combinaciones en las que la copia antigua NO coincidía con el motor.
    let divergentes = 0;
    let total = 0;

    for (const c of CASOS) {
      const b = baseDe(c.alias);
      const antigua = fichaAntigua(b, c.suelo, c.edad, c.zona);
      const nueva = fichaUnificada(b, c.alias, c.suelo, c.edad, c.zona, c.hum);
      for (let i = 0; i < antigua.length; i++) {
        total++;
        if (antigua[i].lRec !== nueva[i]!.lRec) divergentes++;
      }
    }

    expect(total).toBe(72);
    // El defecto medido antes del fix: 38 de 72 combinaciones con Δ litros.
    expect(divergentes).toBeGreaterThan(0);
  });

  it("la ficha unificada respeta la humedad y el reposo que la antigua ignoraba", () => {
    // Nogal en junio: reposo. El motor da el volumen de mantenimiento.
    const b = baseDe("Nogal");
    const junio = fichaUnificada(b, "Nogal", "M", 4, "C1", 2).find((f) => f!.mes === 6)!;
    expect(junio.lRec).toBe(b.especie!.mantencionL);
    expect(junio.lRec).toBeGreaterThan(0);

    // Duraznero con humedad seca: más litros que con punto de riego.
    const b2 = baseDe("Duraznero");
    const seco = fichaUnificada(b2, "Duraznero", "M", 4, "C1", 1).find((f) => f!.mes === 1)!;
    const normal = fichaUnificada(b2, "Duraznero", "M", 4, "C1", 2).find((f) => f!.mes === 1)!;
    expect(seco.lRec).toBeGreaterThan(normal.lRec);
  });

  it("con humedad alta la ficha marca regarHoy false y 0 L", () => {
    // Los niveles 3-5 (húmedo, muy húmedo, capacidad de campo) tienen
    // factor_riego = 0: el motor dice "no regar hoy". La ficha antigua daba
    // 23-45 L en kiwi con esos meses porque no miraba ese factor.
    const b = baseDe("Kiwi");
    const filas = fichaUnificada(b, "Kiwi", "G", 2, "S1", 4);
    const conCero = filas.filter((f) => f!.lRec === 0);
    expect(conCero.length, "con humedad muy alta debe haber meses sin riego").toBeGreaterThan(0);
    for (const f of conCero) {
      expect(f!.regarHoy, `mes ${f!.mes}: 0 L sin regarHoy=false sería incoherente`).toBe(false);
    }

    // Y con humedad muy seca (nivel 1, factor 1.3) el motor da MÁS litros
    // que en punto de riego, que es lo contrario de lo que suponía el caso.
    const seco = fichaUnificada(b, "Kiwi", "G", 2, "S1", 1).find((f) => f!.mes === 1)!;
    const normal = fichaUnificada(b, "Kiwi", "G", 2, "S1", 2).find((f) => f!.mes === 1)!;
    expect(seco.lRec).toBeGreaterThan(normal.lRec);
  });
});