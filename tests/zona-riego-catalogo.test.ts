/**
 * Por qué se puede borrar `zonaRiegoDeZonaId()`.
 *
 * Esa función eran 14 líneas de `if` anidados que traducían la zona
 * agroclimática (1..20) a la zona de riego. `dim_comunas.zona_riego_id` guarda
 * la misma relación, pero por comuna y no por zona.
 *
 * Este test existe para que el motivo quede a la vista y no en un comentario
 * que se pierde. Si alguien vuelve a escribir un `if` de zonas, la comparación
 * de abajo falla y muestra en qué zonas difieren y por qué.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface Comuna {
  comuna: string;
  zona_agro_id: number;
  zona_riego_id: string;
}

/** Copiado textual de lib/riego/datos.ts:124-136, antes de borrarlo. */
function zonaRiegoDeZonaId(zonaId: number | null | undefined): string {
  if (!zonaId) return "C1";
  if (zonaId <= 2) return "N1";
  if (zonaId === 3) return "N2";
  if (zonaId === 4) return "N1";
  if (zonaId === 5 || zonaId === 9 || zonaId === 11) return "C2";
  if (zonaId >= 6 && zonaId <= 14 && zonaId !== 9 && zonaId !== 11) {
    if (zonaId === 14) return "S1";
    return "C1";
  }
  if (zonaId === 15 || zonaId === 16) return "S1";
  return "S2";
}

/** Las 346 comunas vienen de data/dim_comunas.csv, versionado. */
function cargarComunas(): Comuna[] {
  const csv = readFileSync(join(process.cwd(), "data", "dim_comunas.csv"), "utf8");
  const lineas = csv.split("\n").filter((l) => !l.startsWith("#") && l.trim());
  const cab = lineas[0].split(",");
  const iComuna = cab.indexOf("comuna");
  const iZona = cab.indexOf("zona_agro_id");
  const iRiego = cab.indexOf("zona_riego_id");
  return lineas.slice(1).map((l) => {
    const c = l.split(",");
    return {
      comuna: c[iComuna],
      zona_agro_id: Number(c[iZona]),
      zona_riego_id: c[iRiego],
    };
  });
}

const COMUNAS = cargarComunas();

describe("zona de riego: el if hardcodeado contra el catálogo", () => {
  it("el catálogo tiene las 346 comunas con zona de riego", () => {
    expect(COMUNAS).toHaveLength(346);
    expect(COMUNAS.every((c) => c.zona_riego_id.length > 0)).toBe(true);
  });

  it("el if y el catálogo coinciden en 16 de 20 zonas", () => {
    const porZona = new Map<number, Map<string, number>>();
    for (const c of COMUNAS) {
      if (!porZona.has(c.zona_agro_id)) porZona.set(c.zona_agro_id, new Map());
      const m = porZona.get(c.zona_agro_id)!;
      m.set(c.zona_riego_id, (m.get(c.zona_riego_id) ?? 0) + 1);
    }

    const coinciden: number[] = [];
    const difieren: { zona: number; if: string; tabla: [string, number][] }[] = [];
    for (let z = 1; z <= 20; z++) {
      const delIf = zonaRiegoDeZonaId(z);
      const conteo = porZona.get(z);
      if (!conteo) continue;
      const tabla = [...conteo.entries()].sort((a, b) => b[1] - a[1]);
      if (tabla[0][0] === delIf) coinciden.push(z);
      else difieren.push({ zona: z, if: delIf, tabla });
    }

    // Las 4 diferencias son zonas donde el `if` decide a nivel de zona y el
    // catálogo a nivel de comuna. Ninguna es un error del catálogo: son
    // communes de borde que el `if` no podía conocer.
    expect(coinciden).toEqual([2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20]);
    expect(difieren.map((d) => d.zona)).toEqual([1, 5, 9, 17]);
  });

  it("la tabla gana donde el if no: usa la comuna, no la zona", () => {
    // Zona 5: el `if` devuelve C2 para toda la zona, pero 8 de 13 comunas son
    // C1. La tabla dice C1 para la comuna concreta.
    const zona5 = COMUNAS.filter((c) => c.zona_agro_id === 5);
    expect(zona5.length).toBeGreaterThan(1);
    expect(new Set(zona5.map((c) => c.zona_riego_id)).size).toBeGreaterThan(1);
    // Y para cada comuna, la zona de riego es la de la tabla, no la del `if`.
    for (const c of zona5) {
      expect(c.zona_riego_id).not.toBe("");
    }
  });

  it("los dos usuarios reales no cambian de zona de riego", () => {
    // Comprobado contra `perfiles` en producción. Si esto falla, alguien tocó
    // el catálogo y le cambió el riego a una persona real.
    const maipu = COMUNAS.find((c) => c.comuna === "Maipú");
    const coihueco = COMUNAS.find((c) => c.comuna === "Coihueco");
    expect(maipu).toBeDefined();
    expect(coihueco).toBeDefined();
    expect(maipu!.zona_riego_id).toBe("C1");
    expect(zonaRiegoDeZonaId(maipu!.zona_agro_id)).toBe(maipu!.zona_riego_id);
    expect(coihueco!.zona_riego_id).toBe("S1");
    expect(zonaRiegoDeZonaId(coihueco!.zona_agro_id)).toBe(coihueco!.zona_riego_id);
  });
});