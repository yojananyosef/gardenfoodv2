import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcularRiego } from "@/lib/riego/calc";
import type { RiegoBasePayload } from "@/lib/riego/actions";

/**
 * El motor de riego contra la calculadora de referencia del Excel maestro.
 *
 * API_RESPUESTAS son 6480 resultados ya calculados por la hoja del Excel (30
 * especies x 11 zonas de riego x 6 macrozonas x 12 meses, cobertura parcial),
 * para las condiciones de referencia: arbol adulto, copa de referencia, suelo
 * Media y humedad en punto de riego.
 *
 * Aqui NO se reimplementa la formula: se llama a `calcularRiego` de verdad, con
 * la base real (snapshot de las tablas gf_riego_*). Un test que reimplementa
 * la formula solo verifica que el test esta de acuerdo consigo mismo.
 *
 * El fixture se autoverifica al generarse: scripts/generar_base_maestra.py
 * recalcula cada fila desde FACT_RIEGO_MES + dim_especies + DIM_ZONAS_RIEGO y
 * falla si no coincide, asi que no se esta comparando contra una cache vieja.
 */

const RAIZ = join(__dirname, "..");
const N = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

type Fila = {
  clave: string;
  especie_id: string;
  especie_alias: string;
  zona_riego_id: string;
  macrozona_id: string;
  mes_n: string;
  mes_programa_n: string;
  reposo: string;
  litros_media: string;
  dias_media: string;
  litros_base: string;
  dias_base: string;
  factor_clima: string;
};

function leerFixture(): Fila[] {
  const crudo = readFileSync(join(RAIZ, "data", "riego_api_respuestas.csv"), "utf8");
  const lineas = crudo.split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
  const cab = lineas[0].split(",");
  return lineas.slice(1).map((l) => {
    const vals = l.split(",");
    return Object.fromEntries(cab.map((c, i) => [c, vals[i]])) as Fila;
  });
}

function baseDeEspecie(especieAlias: string): RiegoBasePayload {
  const snap = JSON.parse(
    readFileSync(join(__dirname, "fixtures", "riego_base.json"), "utf8"),
  );

  const unica = <T,>(arr: T[], pred: (x: T) => boolean): T[] => arr.filter(pred);
  const ficha = unica(snap.especies, (e: Record<string, unknown>) => e.especie === especieAlias)[0];

  return {
    // El motor busca por dbKey (alias), no por especie_id del Excel.
    mensual: unica(snap.mensual, (m: Record<string, unknown>) => m.especie === especieAlias).map(
      (r: Record<string, unknown>) => ({
        especie: r.especie as string,
        mes: N(r.mes),
        etapa: r.etapa as string,
        diasMin: N(r.dias_min),
        diasMax: N(r.dias_max),
        litrosMin: N(r.litros_min),
        litrosMax: N(r.litros_max),
        reposo: N(r.reposo),
      }),
    ),
    etapas: unica(snap.etapas, (e: Record<string, unknown>) => e.especie === especieAlias).map(
      (r: Record<string, unknown>) => ({
        especie: r.especie as string,
        codigo: r.codigo as string,
        etapaPrograma: r.etapa_programa as string,
        mesesOriginales: r.meses_originales as string,
        coincideExacta: Boolean(r.coincide_exacta),
        diasMin: N(r.dias_min),
        diasMax: N(r.dias_max),
        litrosMin: N(r.litros_min),
        litrosMax: N(r.litros_max),
      }),
    ),
    suelos: snap.suelos.map((r: Record<string, unknown>) => ({
      clave: r.clave as string,
      nombre: r.nombre as string,
      tecnico: r.tecnico as string,
      aguaMinMm: N(r.agua_min_mm),
      aguaMaxMm: N(r.agua_max_mm),
      factor: N(r.factor, 1),
      manejo: r.manejo as string,
    })),
    zonas: snap.zonas.map((r: Record<string, unknown>) => ({
      clave: r.clave as string,
      nombre: r.nombre as string,
      dondeQueda: r.donde_queda as string,
      etoVerano: r.eto_verano as string,
      factorClima: N(r.factor_clima, 1),
      desfase: N(r.desfase),
      significado: r.significado as string,
    })),
    edades: snap.edades.map((r: Record<string, unknown>) => ({
      n: N(r.n),
      nombre: r.nombre as string,
      factorLitros: N(r.factor_litros, 1),
      factorDias: N(r.factor_dias, 1),
    })),
    niveles: snap.niveles.map((r: Record<string, unknown>) => ({
      nivel: N(r.nivel),
      nombre: r.nombre as string,
      pctMin: N(r.pct_min),
      pctMax: N(r.pct_max),
      factorRiego: N(r.factor_riego),
      factorControl: N(r.factor_control),
      significado: r.significado as string,
    })),
    especie: ficha
      ? {
          especie: ficha.especie as string,
          excelNombre: ficha.excel_nombre as string,
          nombreCientifico: ficha.nombre_cientifico as string,
          grupo: ficha.grupo as string,
          mantencionL: N(ficha.mantencion_l),
          suelo: ficha.suelo as string,
          ph: ficha.ph as string,
          copaRefM: N(ficha.copa_ref_m, 2),
        }
      : null,
  };
}

const filas = leerFixture();
const porEspecie = new Map<string, Fila[]>();
for (const f of filas) {
  const lista = porEspecie.get(f.especie_alias) ?? [];
  lista.push(f);
  porEspecie.set(f.especie_alias, lista);
}

describe("regla de reposo (REGLAS_APP Paso 4)", () => {
  it("documenta la diferencia actual entre la app y la calculadora del Excel", () => {
    // Nogal en junio, suelo Media, árbol adulto, copa de referencia, punto de riego.
    const alias = "Nogal";
    const base = baseDeEspecie(alias);
    const mes = 6;

    const r = calcularRiego(
      { dbKey: alias, mes, zonaRiego: "C1" as never, suelo: "M", edadN: 4,
        copaM: base.especie?.copaRefM ?? 2, humedad: 2 },
      base,
    );

    const fila = filas.find(
      (f) => f.especie_alias === alias && f.mes_n === "6" && f.reposo === "1",
    );
    expect(fila, "debe existir una fila de nogal en junio con reposo=1").toBeDefined();

    const esperado = Number(fila!.litros_media);
    const mantenimiento = base.especie?.mantencionL ?? 0;

    // Lo que la calculadora del Excel define: en reposo el volumen es el de
    // mantenimiento, no el rango del calendario (que viene en 0).
    expect(esperado).toBe(mantenimiento);

    // Hoy la app devuelve 0 L. Este assert falla mientras el bug siga vivo, y
    // es el que marca el fix del reposo en `fix-reposo-riego`.
    expect(
      r!.litros,
      `nogal en junio (reposo): la app devuelve ${r!.litros} L, la calculadora del Excel ` +
        `devuelve ${esperado} L (volumen de mantenimiento). REGLAS_APP Paso 4.`,
    ).toBe(esperado);
  });
});

describe("motor de riego vs API_RESPUESTAS del Excel", () => {
  it("el fixture trae las 6480 combinaciones esperadas", () => {
    expect(filas.length).toBe(6480);
    expect(porEspecie.size).toBe(30);
  });

  it("cada especie tiene 12 meses de calendario en la base", () => {
    for (const [alias] of porEspecie) {
      const base = baseDeEspecie(alias);
      expect(base.mensual.length, `${alias} sin calendario`).toBe(12);
    }
  });

  // Un bloque por especie: 6.480 it() individuales tardan minutos y producen un
  // reporte ilegible. El fallo muestra especie, zona, mes y la base usada.
  for (const [alias, lista] of [...porEspecie.entries()].sort()) {
    describe(alias, () => {
      const base = baseDeEspecie(alias);

      it.each(lista)(
        "$zona_riego_id · mes $mes_n -> $litros_media L cada $dias_media dias",
        (f) => {
          const r = calcularRiego(
            {
              dbKey: alias,
              mes: Number(f.mes_n),
              zonaRiego: f.zona_riego_id as never,
              suelo: "M",
              edadN: 4,
              copaM: base.especie?.copaRefM ?? 2,
              humedad: 2,
            },
            base,
          );

          expect(r, `${f.clave}: el motor devolvio null`).not.toBeNull();

          const esperadoL = Number(f.litros_media);
          const esperadoD = Number(f.dias_media);
          const enReposo = f.reposo === "1";
          const suelo = enReposo ? "reposo" : "";

          if (r!.litros !== esperadoL || r!.cadaDias !== esperadoD) {
            const causa = enReposo
              ? ` | mes en REPOSO: la app devuelve ${r!.litros} L usando el rango del ` +
                `calendario (litros_min=${r!.litrosMin}), y REGLAS_APP Paso 4 pide el ` +
                `volumen de mantenimiento (${base.especie?.mantencionL} L). Es el bug de reposo.`
              : ` | base=${f.litros_base} L, dias_base=${f.dias_base}, clima=${f.factor_clima}`;
            throw new Error(
              `${f.clave}${suelo}: esperado ${esperadoL} L / ${esperadoD} dias, ` +
                `obtenido ${r!.litros} L / ${r!.cadaDias} dias${causa}`,
            );
          }

          expect(r!.litros).toBe(esperadoL);
          expect(r!.cadaDias).toBe(esperadoD);
        },
      );
    });
  }
});