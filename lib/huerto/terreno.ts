import { z } from "zod";

export type TerrenoPosition = [number, number];
export type TerrenoPolygonCoordinates = TerrenoPosition[][];
export type PuntoMapa = { lat: number; lng: number };

export type TerrenoFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon";
    coordinates: TerrenoPolygonCoordinates;
  };
};

export const TERRENO_MAX_AREA_M2 = 10_000_000;
export const TERRENO_MAX_POSICIONES_ANILLO = 500;
export const CENTRO_DEFAULT = { lat: -35.6751, lng: -71.543 };
export const ZOOM_DEFAULT = 5;
export const ZOOM_UBICACION = 18;
export const MAPA_MAX_ZOOM = 19;

const RADIO_TIERRA_M = 6371008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function abrirAnillo(ring: TerrenoPosition[]): TerrenoPosition[] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  const cerrado = first[0] === last[0] && first[1] === last[1];
  return cerrado ? ring.slice(0, -1) : ring;
}

export function anilloAreaM2(ring: TerrenoPosition[]): number {
  const abierto = abrirAnillo(ring);
  if (abierto.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < abierto.length; i++) {
    const [lng1, lat1] = abierto[i];
    const [lng2, lat2] = abierto[(i + 1) % abierto.length];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * RADIO_TIERRA_M * RADIO_TIERRA_M) / 2);
}

export function terrenoAreaM2(coordinates: TerrenoPolygonCoordinates): number {
  if (!coordinates.length) return 0;
  const exterior = anilloAreaM2(coordinates[0]);
  const huecos = coordinates
    .slice(1)
    .reduce((suma, ring) => suma + anilloAreaM2(ring), 0);
  return Math.max(0, exterior - huecos);
}

const positionSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

const anilloSchema = z
  .array(positionSchema)
  .min(4, "Un anillo del polígono necesita al menos 4 posiciones (3 vértices cerrados).")
  .max(TERRENO_MAX_POSICIONES_ANILLO, "El polígono tiene demasiados vértices.")
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    { message: "El anillo del polígono debe estar cerrado." },
  );

export const terrenoFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    properties: z.record(z.string(), z.unknown()).default({}),
    geometry: z.object({
      type: z.literal("Polygon"),
      coordinates: z.array(anilloSchema).min(1).max(5),
    }),
  })
  .strict()
  .refine(
    (feature) => terrenoAreaM2(feature.geometry.coordinates) <= TERRENO_MAX_AREA_M2,
    { message: "El terreno excede el área máxima permitida (10 km²)." },
  );

export function parseTerrenoFeature(input: unknown): TerrenoFeature | null {
  const result = terrenoFeatureSchema.safeParse(input);
  return result.success ? (result.data as TerrenoFeature) : null;
}

export function featureDesdePuntos(points: PuntoMapa[]): TerrenoFeature {
  const ring: TerrenoPosition[] = points.map((p) => [p.lng, p.lat]);
  if (ring.length > 0) ring.push([ring[0][0], ring[0][1]]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

export function puntosDesdeFeature(feature: TerrenoFeature): PuntoMapa[] {
  const ring = abrirAnillo(feature.geometry.coordinates[0] ?? []);
  return ring.map(([lng, lat]) => ({ lat, lng }));
}

export function formatAreaM2(areaM2: number): string {
  if (areaM2 >= 10_000) {
    return `${(areaM2 / 10_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} ha`;
  }
  return `${Math.round(areaM2).toLocaleString("es-CL")} m²`;
}
