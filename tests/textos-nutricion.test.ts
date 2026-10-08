import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { nombreMesEnCalendario } from "@/components/especies/NutricionGuia";
import { guiaRegional } from "@/lib/agronomy/fertilizacion";

const MOMENTOS = guiaRegional("Duraznero", "Santiago-RM", "suelo")!.momentos;

/**
 * El calendario se armaba el `aria-label` de cada mes con los títulos de
 * momento («Agosto: cuando despierta»). Al quitar los títulos esa frase se
 * cae entera, así que se reescribió con meses. Estos tests fijan las cuatro
 * formas que puede tomar, incluida la de lista vacía, que es la que deja un
 * `join()` con el mes mudo.
 */
describe("el calendario se anuncia por meses", () => {
  it("un mes con un solo momento nombra los meses en que se abona", () => {
    const texto = nombreMesEnCalendario(8, MOMENTOS);
    expect(texto).toMatch(/^Agosto: /);
    expect(texto).toContain("se abona en");
    expect(texto).not.toMatch(/cuando despierta|cuando engorda|cuando se recupera/i);
  });

  it("un mes sin abono lo dice explícitamente", () => {
    const sinAbono = Array.from({ length: 12 }, (_, i) => i + 1).find(
      (m) => !MOMENTOS.some((mo) => mo.meses.includes(m)),
    );
    expect(sinAbono).toBeDefined();
    const texto = nombreMesEnCalendario(sinAbono!, MOMENTOS);
    expect(texto).toMatch(/no se abona$/);
    // Lo importante: no queda un «Mes: » mudo ni un separador colgando.
    expect(texto).not.toContain(",");
    expect(texto).not.toContain("y ");
  });

  it("un mes de traspaso anuncia que el momento cambia", () => {
    const traspaso = Array.from({ length: 12 }, (_, i) => i + 1).find(
      (m) => MOMENTOS.filter((mo) => mo.meses.includes(m)).length > 1,
    );
    expect(traspaso).toBeDefined();
    const texto = nombreMesEnCalendario(traspaso!, MOMENTOS);
    expect(texto).toContain("cambia de momento");
    expect(texto).toContain(" y ");
  });

  it("usa el nombre largo del mes en los doce", () => {
    const largos = Array.from({ length: 12 }, (_, i) => i + 1).map(
      (m) => nombreMesEnCalendario(m, MOMENTOS).split(":")[0],
    );
    expect(largos).toEqual([
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]);
  });

  it("no lanza con una lista de momentos vacía", () => {
    // Es el borde que un `.join()` sobre `[]` rompe en silencio.
    for (let m = 1; m <= 12; m++) {
      expect(() => nombreMesEnCalendario(m, [])).not.toThrow();
    }
    expect(nombreMesEnCalendario(3, [])).toBe("Marzo: no se abona");
  });
});

/**
 * Regresión de la jerga fenológica en el render. Los tests de datos de arriba
 * comprueban el tipo; este comprueba que no quede rastro en el JSX, que es
 * donde volvería a colarse.
 */
describe("no queda jerga fenológica en el render", () => {
  const fuente = readFileSync(
    new URL("../components/especies/NutricionGuia.tsx", import.meta.url),
    "utf8",
  );

  it("ninguna etiqueta visible del calendario usa los títulos del XLSX", () => {
    expect(fuente).not.toMatch(/momento\.titulo/);
    expect(fuente).not.toMatch(/m\.titulo/);
    expect(fuente).not.toMatch(/momento\.proposito/);
    expect(fuente).not.toMatch(/PROPOSITOS_MOMENTO/);
  });
});

/**
 * La ficha espejo del módulo de huerto tiene su propio render del programa.
 * Si solo se arregla la tab visual, la jerga sigue visible en esa ruta, que es
 * la que abre `/huerto`. Es un invariante de estructura, igual que el de
 * `TabFenologia`: lo que importa es que la segunda copia no vuelva atrás.
 */
describe("la ficha espejo usa el mismo criterio", () => {
  const espejo = readFileSync(
    new URL(
      "../app/(dashboard)/especie/especies/[especie]/page.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  it("titula los bloques por sus meses, no por el estado fenológico", () => {
    expect(espejo).not.toMatch(/CalendarDays[^>]*\/>\s*\{p\.momento\}/);
    expect(espejo).toMatch(/CalendarDays[^>]*\/>\s*\{p\.meses\}/);
  });

  it("no imprime las filas de estado fenológico de la guía", () => {
    for (const campo of ["m_despierta", "m_engorda", "m_recupera"]) {
      expect(espejo).not.toMatch(campo);
    }
  });

  it("conserva la fenología observable", () => {
    // Estas tres sí son fechas que el jardinero reconoce, no nombres de estado.
    expect(espejo).toMatch(/feno\.brota/);
    expect(espejo).toMatch(/feno\.florece/);
    expect(espejo).toMatch(/feno\.cosecha/);
  });

  it("sigue pasando el momento del seed como id persistido de la aplicación", () => {
    // `momento` se guarda en la tabla de aplicaciones y arma el texto del
    // calendario agendado: cambiarlo acá rompería el historial.
    expect(espejo).toMatch(/momento=\{p\.momento\}/);
  });
});