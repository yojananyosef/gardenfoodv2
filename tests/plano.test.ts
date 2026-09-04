import { describe, expect, it } from "vitest";
import {
  colorDeEspecie,
  crearVistaPlano,
  disponerEnMatriz,
  expandirUnidades,
  latLngDesdePos,
  puntoEnPoligono,
  posAVista,
  posDesdeLatLng,
  proyectarADentro,
  type FilaArbol,
  type PosicionPlano,
  type VistaPlano,
} from "@/lib/huerto/plano";
import type { TerrenoPosition } from "@/lib/huerto/terreno";

function cuadrado(lado: number, offset = 0): TerrenoPosition[] {
  return [
    [offset, offset],
    [offset + lado, offset],
    [offset + lado, offset + lado],
    [offset, offset + lado],
    [offset, offset],
  ];
}

function poligonoL(): TerrenoPosition[] {
  return [
    [0, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [0, 2],
    [0, 0],
  ];
}

describe("puntoEnPoligono", () => {
  it("detecta puntos dentro y fuera", () => {
    const anillo = cuadrado(1);
    expect(puntoEnPoligono({ lng: 0.5, lat: 0.5 }, anillo)).toBe(true);
    expect(puntoEnPoligono({ lng: 1.5, lat: 0.5 }, anillo)).toBe(false);
    expect(puntoEnPoligono({ lng: -0.5, lat: 0.5 }, anillo)).toBe(false);
  });

  it("es independiente de la orientación del anillo", () => {
    const anillo = [...cuadrado(1)].reverse();
    expect(puntoEnPoligono({ lng: 0.5, lat: 0.5 }, anillo)).toBe(true);
  });
});

describe("proyectarADentro", () => {
  it("proyecta un punto externo al borde más cercano", () => {
    const anillo = cuadrado(1);
    const ajustado = proyectarADentro({ lng: 1.5, lat: 0.5 }, anillo);
    expect(puntoEnPoligono(ajustado, anillo)).toBe(true);
    expect(ajustado.lng).toBeCloseTo(1, 9);
    expect(ajustado.lat).toBeCloseTo(0.5, 9);
  });
});

describe("disponerEnMatriz", () => {
  it("un solo árbol queda en el centro del cuadrado", () => {
    const [pos] = disponerEnMatriz(1, [cuadrado(1)]);
    expect(pos.x).toBeCloseTo(0.5, 9);
    expect(pos.y).toBeCloseTo(0.5, 9);
  });

  it("genera una posición por árbol, todas dentro del polígono", () => {
    const anillo = cuadrado(0.01);
    const posiciones = disponerEnMatriz(10, [anillo]);
    expect(posiciones).toHaveLength(10);
    for (const pos of posiciones) {
      const punto = { lng: pos.x * 0.01, lat: pos.y * 0.01 };
      expect(puntoEnPoligono(punto, anillo)).toBe(true);
    }
  });

  it("reubica celdas fuera de un polígono en L hacia adentro", () => {
    const anillo = poligonoL();
    const posiciones = disponerEnMatriz(4, [anillo]);
    for (const pos of posiciones) {
      const punto = { lng: pos.x * 2, lat: pos.y * 2 };
      expect(puntoEnPoligono(punto, anillo)).toBe(true);
    }
  });

  it("es determinista", () => {
    const a = disponerEnMatriz(7, [cuadrado(0.01)]);
    const b = disponerEnMatriz(7, [cuadrado(0.01)]);
    expect(a).toEqual(b);
  });

  it("normaliza posiciones al rango 0..1", () => {
    for (const pos of disponerEnMatriz(25, [cuadrado(0.02, -1)])) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(1);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(1);
    }
  });

  it("usa el centro para polígonos degenerados", () => {
    const posiciones = disponerEnMatriz(3, [
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
    expect(posiciones).toHaveLength(3);
    for (const pos of posiciones) {
      expect(pos.x).toBe(0.5);
      expect(pos.y).toBe(0.5);
    }
  });

  it("evita las celdas ocupadas por árboles ya posicionados", () => {
    const anillo = cuadrado(0.01);
    const ocupada: PosicionPlano = { x: 0.25, y: 0.25 };
    const posiciones = disponerEnMatriz(3, [anillo], { ocupadas: [ocupada] });
    expect(posiciones).toHaveLength(3);
    for (const pos of posiciones) {
      const distancia = Math.hypot(pos.x - ocupada.x, pos.y - ocupada.y);
      expect(distancia).toBeGreaterThanOrEqual(0.04);
    }
  });
});

describe("posDesdeLatLng ↔ latLngDesdePos", () => {
  it("normaliza un punto dentro del bounding box", () => {
    const pos = posDesdeLatLng({ lng: 0.0025, lat: 0.0075 }, [cuadrado(0.01)]);
    expect(pos.x).toBeCloseTo(0.25, 9);
    expect(pos.y).toBeCloseTo(0.75, 9);
  });

  it("hace el viaje de ida y vuelta", () => {
    const anillo = cuadrado(0.01);
    const pos = posDesdeLatLng({ lng: 0.0071, lat: 0.0023 }, [anillo]);
    const recuperado = latLngDesdePos(pos, [anillo]);
    expect(recuperado.lng).toBeCloseTo(0.0071, 9);
    expect(recuperado.lat).toBeCloseTo(0.0023, 9);
  });

  it("acota puntos fuera del bbox al rango 0..1", () => {
    const pos = posDesdeLatLng({ lng: 5, lat: 5 }, [cuadrado(0.01)]);
    expect(pos.x).toBe(1);
    expect(pos.y).toBe(1);
  });
});

describe("crearVistaPlano + posAVista", () => {
  it("proyecta el polígono dentro de la vista con margen", () => {
    const vista = crearVistaPlano([cuadrado(1)]);
    expect(vista.path).toMatch(/^M6\.00 94\.00 L/);
    expect(vista.path.endsWith("Z")).toBe(true);
  });

  it("mapea posiciones normalizadas a la misma vista", () => {
    const vista: VistaPlano = crearVistaPlano([cuadrado(1)]);
    const esquinaInferiorIzquierda: PosicionPlano = { x: 0, y: 0 };
    const esquinaSuperiorDerecha: PosicionPlano = { x: 1, y: 1 };
    expect(posAVista(esquinaInferiorIzquierda, vista)).toEqual({ x: 6, y: 94 });
    expect(posAVista(esquinaSuperiorDerecha, vista)).toEqual({ x: 94, y: 6 });
  });

  it("centra geometrías degeneradas sin NaN", () => {
    const vista = crearVistaPlano([
      [
        [5, 5],
        [5, 5],
        [5, 5],
        [5, 5],
      ],
    ]);
    const punto = posAVista({ x: 0.3, y: 0.8 }, vista);
    expect(Number.isFinite(punto.x)).toBe(true);
    expect(Number.isFinite(punto.y)).toBe(true);
  });
});

describe("colorDeEspecie", () => {
  it("es estable para la misma especie y distinto entre especies", () => {
    expect(colorDeEspecie("limonero")).toBe(colorDeEspecie("limonero"));
    expect(colorDeEspecie("limonero")).not.toBe(colorDeEspecie("naranjo"));
  });
});

describe("expandirUnidades", () => {
  it("expande la cantidad en unidades individuales", () => {
    const filas: FilaArbol[] = [
      { especie: "limonero", cantidad: 3, fecha_plantacion: "2024-08-01", observaciones: "patio" },
      { especie: "naranjo", cantidad: 2, fecha_plantacion: null, observaciones: null },
    ];
    const unidades = expandirUnidades(filas);
    expect(unidades).toHaveLength(5);
    expect(unidades.every((u) => u.especie === "limonero" || u.especie === "naranjo")).toBe(true);
    expect(unidades.filter((u) => u.especie === "limonero")).toHaveLength(3);
    expect(unidades[0].fecha_plantacion).toBe("2024-08-01");
  });

  it("cantidad inválida produce una unidad", () => {
    const unidades = expandirUnidades([{ especie: "olivo", cantidad: 0 }]);
    expect(unidades).toHaveLength(1);
    expect(unidades[0].especie).toBe("olivo");
  });
});
