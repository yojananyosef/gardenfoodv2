import { describe, expect, it } from "vitest";
import {
  bboxDe,
  bboxEnMetros,
  poligonoAMetros,
  posAMetrosNormalizados,
} from "@/lib/huerto/plano";
import {
  lngLatATile,
  mosaicoDeTiles,
  tilesParaBbox,
  urlTileEsri,
  uvDeLngLat,
} from "@/lib/huerto/satelite";

describe("bboxEnMetros", () => {
  it("respeta el aspecto real con cos(lat)", () => {
    const bbox = bboxDe([
      [
        [-70.66, -33.45],
        [-70.65, -33.45],
        [-70.65, -33.44],
        [-70.66, -33.44],
        [-70.66, -33.45],
      ],
    ])!;
    const m = bboxEnMetros(bbox);
    // A lat -33.45, 0.01° lng < 0.01° lat en metros
    expect(m.anchoM).toBeLessThan(m.altoM);
    expect(m.aspecto).toBeCloseTo(Math.cos((-33.445 * Math.PI) / 180), 1);
  });
});

describe("poligonoAMetros", () => {
  it("normaliza a -0.5..0.5 preservando la forma", () => {
    const r = poligonoAMetros([
      [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
        [0, 0],
      ],
    ])!;
    expect(r.aspecto).toBeCloseTo(2, 0);
    const xs = r.anillos[0].map((p) => p.x);
    const ys = r.anillos[0].map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(-0.5, 9);
    expect(Math.max(...xs)).toBeCloseTo(0.5, 9);
    expect(Math.min(...ys)).toBeCloseTo(-0.5, 9);
    expect(Math.max(...ys)).toBeCloseTo(0.5, 9);
  });

  it("retorna null sin coordenadas", () => {
    expect(poligonoAMetros([])).toBeNull();
  });
});

describe("posAMetrosNormalizados", () => {
  it("centra el origen e invierte Y (norte arriba)", () => {
    expect(posAMetrosNormalizados({ x: 0.5, y: 0.5 })).toEqual({ x: 0, y: -0 });
    expect(posAMetrosNormalizados({ x: 0, y: 0 }).x).toBeCloseTo(-0.5, 9);
    // y=0 es sur en el plano normalizado → norte arriba en escena es +y
    expect(posAMetrosNormalizados({ x: 0.5, y: 0 }).y).toBeCloseTo(0.5, 9);
  });
});

describe("satelite tiles", () => {
  it("convierte Maipú a tile z18 y genera URL Esri", () => {
    const t = lngLatATile(-70.74, -33.51, 18);
    expect(t.z).toBe(18);
    expect(urlTileEsri(t)).toMatch(/^https:\/\/server\.arcgisonline\.com.*\/18\//);
  });

  it("limita el mosaico a 4x4 para no descargar media comuna", () => {
    const { tiles, cols, rows } = tilesParaBbox(
      { minX: -71, maxX: -70, minY: -34, maxY: -33 },
      18,
    );
    expect(cols).toBeLessThanOrEqual(4);
    expect(rows).toBeLessThanOrEqual(4);
    expect(tiles.length).toBe(cols * rows);
  });

  it("mapea UV dentro de 0..1 y acota fuera del mosaico", () => {
    const mosaico = mosaicoDeTiles([
      { x: 10, y: 10, z: 18 },
      { x: 11, y: 11, z: 18 },
    ]);
    const dentro = uvDeLngLat(
      (mosaico.oeste + mosaico.este) / 2,
      (mosaico.norte + mosaico.sur) / 2,
      { minX: 0, maxX: 1, minY: 0, maxY: 1 },
      mosaico,
    );
    expect(dentro.u).toBeGreaterThan(0.2);
    expect(dentro.u).toBeLessThan(0.8);
    const fuera = uvDeLngLat(999, 999, { minX: 0, maxX: 1, minY: 0, maxY: 1 }, mosaico);
    expect(fuera.u).toBeLessThanOrEqual(1);
    expect(fuera.v).toBeLessThanOrEqual(1);
  });
});
