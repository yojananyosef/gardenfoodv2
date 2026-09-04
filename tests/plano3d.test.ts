import { describe, expect, it } from "vitest";
import {
  modeloDeArbol,
  normalizarEspecie,
} from "@/lib/huerto/arbolModelo";
import {
  bboxDe,
  bboxEnMetros,
  poligonoAMetros,
  posAMetrosNormalizados,
} from "@/lib/huerto/plano";

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

describe("modeloDeArbol", () => {
  it("da un olivo grisáceo distinto de un duraznero", () => {
    const olivo = modeloDeArbol("Olivo");
    const duraznero = modeloDeArbol("Duraznero");
    expect(olivo.forma).toBe("olivo");
    expect(duraznero.forma).toBe("esferico");
    expect(olivo.colorCopa).not.toBe(duraznero.colorCopa);
  });

  it("normaliza tildes, mayúsculas y slugs con guion", () => {
    expect(modeloDeArbol("níspero japonés").forma).toBe("esferico");
    expect(modeloDeArbol("avellano-europeo").forma).toBe("multitronco");
    expect(modeloDeArbol("  PALTO ").forma).toBe("grande");
  });

  it("resuelve alias de nombre de fruto", () => {
    expect(modeloDeArbol("Cereza").forma).toBe("esferico");
    expect(modeloDeArbol("Cereza").frutos?.color).toBe("#dc2626");
    expect(modeloDeArbol("uva").forma).toBe("parron");
  });

  it("los cítricos llevan frutos y los grandes son de mayor escala", () => {
    expect(modeloDeArbol("Naranjo").frutos?.color).toBe("#f59e0b");
    expect(modeloDeArbol("Nogal").escala).toBeGreaterThan(
      modeloDeArbol("Frutilla").escala,
    );
  });

  it("especie desconocida cae a esférico genérico estable", () => {
    const a = modeloDeArbol("Kumquat Misterioso");
    const b = modeloDeArbol("Kumquat Misterioso");
    expect(a.forma).toBe("esferico");
    expect(a).toEqual(b);
  });

  it("normalizarEspecie quita tildes y guiones", () => {
    expect(normalizarEspecie("Níspero Japonés")).toBe("nispero japones");
    expect(normalizarEspecie("avellano-europeo")).toBe("avellano europeo");
  });
});
