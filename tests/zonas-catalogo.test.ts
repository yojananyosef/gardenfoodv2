/**
 * Las 20 zonas de `dim_zonas_agro`, y lo que se sabe de ellas.
 *
 * Este archivo reemplaza a las zonas que estaban escritas a mano en
 * `lib/agronomy/zonas.ts`. No es un test de comparación contra el código
 * viejo: el código viejo ya no existe. Es el lugar donde queda anotado qué
 * cambió de verdad al pasar a la base, porque casi todo lo demás es formato.
 *
 * Y el lugar donde queda anotado lo que NO se migró y por qué: el mapa
 * comuna→zona sigue viniendo de `lib/agronomy/comunas.ts`, porque
 * `dim_comunas.zona_agro_id` está vacío en 217 de las 346 comunas. La tarea
 * 3.2 del change `catalagos-factores-desde-db` está bloqueada por eso.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { numeroDeCelda, rangoLegible, ZONA_NEUTRA_ID } from "@/lib/agronomy/catalogo";
import { ZONAS } from "./helpers/zonas-desde-csv";

describe("dim_zonas_agro: las 20 zonas", () => {
  it("tiene las 20 zonas con los ids 1..20 sin huecos", () => {
    expect(Object.keys(ZONAS)).toHaveLength(20);
    for (let id = 1; id <= 20; id++) {
      expect(ZONAS[id], `falta la zona ${id}`).toBeTruthy();
      expect(ZONAS[id].id).toBe(id);
    }
  });

  it("la zona neutra que usan las dos capas es la misma", () => {
    // El fallback salía de un `ZONA_FALLBACK_ID = 7` privado en index.ts y
    // de un `?? 7` suelto en otros call-sites. Ahora es una constante sola.
    expect(ZONA_NEUTRA_ID).toBe(7);
    expect(ZONAS[ZONA_NEUTRA_ID].region).toBe("Metropolitana");
  });

  it("temperaturas y precipitación llegan como número, no como texto con unidad", () => {
    for (const z of Object.values(ZONAS)) {
      expect(Number.isFinite(z.txMax), `${z.nombre}: txMax`).toBe(true);
      expect(Number.isFinite(z.tnMin), `${z.nombre}: tnMin`).toBe(true);
      expect(Number.isFinite(z.pp), `${z.nombre}: pp`).toBe(true);
      expect(z.txMax).toBeGreaterThan(0);
      // El rango de la hoja viene "500-800"; sale con guion largo para que la
      // ficha muestre lo mismo que antes.
      expect(z.hf, `${z.nombre}: horas de frío`).toMatch(/^\d+–\d+$/);
    }
  });

  it("el rango de heladas queda con guion largo y la palabra días", () => {
    // Zonas 2 y 7: la 2 tiene "5-15 días", que fue justo el substring que le
    // daba severidad alta a Copiapó antes del fix de `diasDeHelada`.
    expect(ZONAS[7].heladas).toBe("15–30 días");
    expect(ZONAS[2].heladas).toBe("5–15 días");
    // Y una zona que no tiene heladas, que no viene en forma de rango.
    expect(ZONAS[1].heladas).toBe("Sin heladas");
  });

  it("los dos usuarios reales están en zonas que la base conoce", () => {
    // Maipú (zona 8) y Coihueco (zona 15): los dos perfiles que no son de
    // prueba. Si una de estas dos falla, se rompió algo que afecta a gente
    // real, así que va explícita y no implícita en el bucle de arriba.
    expect(ZONAS[8].nombre).toBe("Santiago Sur-Buin");
    expect(ZONAS[15].region).toBe("Ñuble");
  });
});

describe("los parsers que leen la hoja de cálculo", () => {
  it("numeroDeCelda saca el número de un texto con unidad", () => {
    expect(numeroDeCelda("27°C")).toBe(27);
    expect(numeroDeCelda("-3°C")).toBe(-3);
    expect(numeroDeCelda("1")).toBe(1);
    expect(numeroDeCelda(21)).toBe(21);
  });

  it("numeroDeCelda se queda con el primer número cuando la celda cita la fuente", () => {
    // La mínima absoluta de Ñuble y Biobío traen la referencia del dato
    // pegada: "-8°C (INIA jul 2025: -7.6°C Sta Rosa)". El número que cuenta
    // es el primero; el otro está dentro de la cita.
    expect(numeroDeCelda("-8°C (INIA jul 2025: -7.6°C Sta Rosa)")).toBe(-8);
    expect(numeroDeCelda("-8°C (INIA: -5.5°C Humán)")).toBe(-8);
  });

  it("numeroDeCelda devuelve el valor por defecto en vez de NaN", () => {
    // Un NaN en txMax se pinta como temperatura en la ficha.
    expect(numeroDeCelda(null)).toBe(0);
    expect(numeroDeCelda(undefined)).toBe(0);
    expect(numeroDeCelda("sin dato")).toBe(0);
    expect(numeroDeCelda(null, 1)).toBe(1);
    expect(numeroDeCelda(Number.NaN)).toBe(0);
  });

  it("rangoLegible pasa el guion corto de la hoja a guion largo", () => {
    expect(rangoLegible("0-50")).toBe("0–50");
    expect(rangoLegible("5-15 días")).toBe("5–15 días");
    expect(rangoLegible("1100-1600")).toBe("1100–1600");
    // No toca lo que no es un rango.
    expect(rangoLegible("Sin heladas")).toBe("Sin heladas");
    expect(rangoLegible(null)).toBe("");
  });
});

/**
 * Los tres nombres de zona que la base escribe distinto al TS.
 *
 * El Excel es la fuente maestra, así que en la app gana el Excel y estos tres
 * textos cambian en pantalla. Se anotan acá para que el cambio sea un hecho
 * registrado y no una sorpresa, y para que alguien que los lea sepa que
 * dos de ellos se perdieron algo y el día que se reparen en la hoja aparece
 * como un fallo de este test.
 */
describe("los tres nombres que cambian en pantalla", () => {
  it("zona 9: el guion se volvió espacio", () => {
    expect(ZONAS[9].nombre).toBe("Melipilla Costa RM");
  });

  it("zona 12: el tipo de clima perdió «interior»", () => {
    expect(ZONAS[12].clima).toBe("Mediterráneo lac.");
  });

  it("zona 16: el nombre perdió «Interior»", () => {
    expect(ZONAS[16].nombre).toBe("Los Ángeles");
  });
});

describe("por qué el mapa comuna→zona NO se migró", () => {
  const csv = readFileSync(join(process.cwd(), "data", "dim_comunas.csv"), "utf8");
  const lineas = csv.split("\n").filter((l) => !l.startsWith("#") && l.trim());
  const cab = lineas[0].split(",");
  const iZona = cab.indexOf("zona_agro_id");
  const iComuna = cab.indexOf("comuna");
  const iRegion = cab.indexOf("region");
  const filas = lineas.slice(1).map((l) => {
    const c = l.split(",");
    return { comuna: c[iComuna], zona: c[iZona], region: c[iRegion] };
  });

  it("las 346 comunas tienen zona de riego, pero 217 no tienen zona agroclimática", () => {
    const sinZona = filas.filter((f) => !f.zona);
    const conZona = filas.filter((f) => f.zona);
    expect(filas).toHaveLength(346);
    expect(conZona).toHaveLength(129);
    // Si este número baja, el Excel se llenó y la tarea 3.2 se puede hacer:
    // hay que actualizar el número de arriba y sacar este archivo del medio.
    expect(sinZona).toHaveLength(217);
  });

  it("las tres regiones del sur están enteras sin zona", () => {
    const completas = ["Aysén", "Magallanes", "Tarapacá"];
    for (const region of completas) {
      const deLaRegion = filas.filter((f) => f.region === region);
      expect(deLaRegion.length, region).toBeGreaterThan(0);
      expect(deLaRegion.filter((f) => f.zona).length, `${region}: tiene zonas`).toBe(0);
    }
  });
});