import { describe, expect, it } from "vitest";
import {
  anilloAreaM2,
  featureDesdePuntos,
  formatAreaM2,
  parseTerrenoFeature,
  puntosDesdeFeature,
  terrenoFeatureSchema,
  terrenoAreaM2,
  TERRENO_MAX_POSICIONES_ANILLO,
  type TerrenoPosition,
} from "@/lib/huerto/terreno";

function cuadrado(lado: number, offset = 0): TerrenoPosition[] {
  return [
    [offset, offset],
    [offset + lado, offset],
    [offset + lado, offset + lado],
    [offset, offset + lado],
    [offset, offset],
  ];
}

function featureValido() {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [cuadrado(0.001)] },
  };
}

describe("terrenoFeatureSchema", () => {
  it("acepta un polígono GeoJSON válido", () => {
    const result = terrenoFeatureSchema.safeParse(featureValido());
    expect(result.success).toBe(true);
  });

  it("completa properties por defecto", () => {
    const sinPropiedades = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [cuadrado(0.001)] },
    };
    const result = terrenoFeatureSchema.safeParse(sinPropiedades);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.properties).toEqual({});
  });

  it("rechaza un anillo con menos de 3 vértices", () => {
    const dosVertices = [
      [0, 0],
      [0.001, 0],
      [0, 0],
    ];
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [dosVertices] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un anillo abierto", () => {
    const abierto = [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0.001],
    ];
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [abierto] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza coordenadas fuera de rango", () => {
    const fuera = [
      [0, 0],
      [0.001, 0],
      [0.001, 91],
      [0, 91],
      [0, 0],
    ];
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [fuera] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza longitud fuera de rango", () => {
    const fuera = [
      [-181, 0],
      [0, 0],
      [0, 0.001],
      [-181, 0.001],
      [-181, 0],
    ];
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [fuera] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un anillo con demasiadas posiciones", () => {
    const enorme: TerrenoPosition[] = [];
    for (let i = 0; i <= TERRENO_MAX_POSICIONES_ANILLO; i++) {
      enorme.push([(i % 2) * 0.001, (i % 2) * 0.001]);
    }
    enorme[enorme.length - 1] = enorme[0];
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [enorme] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un polígono que excede el área máxima", () => {
    const gigante = cuadrado(1);
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      geometry: { type: "Polygon", coordinates: [gigante] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza geometrías que no son Polygon", () => {
    const result = terrenoFeatureSchema.safeParse({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-70.6693, -33.4489],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza propiedades desconocidas en el nivel raíz", () => {
    const result = terrenoFeatureSchema.safeParse({
      ...featureValido(),
      user_id: "otro-usuario",
    });
    expect(result.success).toBe(false);
  });
});

describe("terrenoAreaM2", () => {
  it("calcula el área de un cuadrado de 0.01° por lado cerca del ecuador", () => {
    const area = terrenoAreaM2([cuadrado(0.01)]);
    expect(area).toBeGreaterThan(1_200_000);
    expect(area).toBeLessThan(1_280_000);
  });

  it("descuenta huecos del área exterior", () => {
    const conHueco = [cuadrado(0.01), cuadrado(0.005, 0.002)];
    const sinHueco = terrenoAreaM2([cuadrado(0.01)]);
    const conHuecoArea = terrenoAreaM2(conHueco);
    expect(conHuecoArea).toBeLessThan(sinHueco);
    expect(conHuecoArea).toBeGreaterThan(0);
  });

  it("devuelve 0 para anillos degenerados", () => {
    expect(anilloAreaM2([])).toBe(0);
    expect(
      anilloAreaM2([
        [0, 0],
        [1, 1],
      ]),
    ).toBe(0);
  });

  it("es independiente de la orientación del anillo", () => {
    const horario = cuadrado(0.01);
    const antihorario = [...cuadrado(0.01)].reverse();
    expect(terrenoAreaM2([horario])).toBeCloseTo(
      terrenoAreaM2([antihorario]),
      6,
    );
  });
});

describe("conversiones feature ↔ puntos", () => {
  it("featureDesdePuntos cierra el anillo", () => {
    const feature = featureDesdePuntos([
      { lat: -33.4, lng: -70.6 },
      { lat: -33.405, lng: -70.6 },
      { lat: -33.405, lng: -70.595 },
    ]);
    const ring = feature.geometry.coordinates[0];
    expect(ring).toHaveLength(4);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(feature.geometry.type).toBe("Polygon");
    expect(feature.type).toBe("Feature");
  });

  it("puntosDesdeFeature revierte featureDesdePuntos", () => {
    const puntos = [
      { lat: -33.4, lng: -70.6 },
      { lat: -33.405, lng: -70.6 },
      { lat: -33.405, lng: -70.595 },
    ];
    const recuperados = puntosDesdeFeature(featureDesdePuntos(puntos));
    expect(recuperados).toEqual(puntos);
  });

  it("parseTerrenoFeature acepta el feature generado y rechaza basura", () => {
    const feature = featureDesdePuntos([
      { lat: -33.4, lng: -70.6 },
      { lat: -33.405, lng: -70.6 },
      { lat: -33.405, lng: -70.595 },
    ]);
    expect(parseTerrenoFeature(feature)).not.toBeNull();
    expect(parseTerrenoFeature(null)).toBeNull();
    expect(parseTerrenoFeature("polygon")).toBeNull();
    expect(parseTerrenoFeature({ type: "Feature" })).toBeNull();
  });
});

describe("formatAreaM2", () => {
  it("formatea metros cuadrados bajo 1 ha", () => {
    expect(formatAreaM2(5000)).toMatch(/5[.,]000 m²/);
  });

  it("formatea hectáreas desde 10.000 m²", () => {
    expect(formatAreaM2(25_000)).toMatch(/2,5 ha|2.5 ha/);
  });
});
