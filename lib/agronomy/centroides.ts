import centroides from "../../supabase/comunas_centroides.json";
import { COMUNAS } from "./comunas";

/**
 * Coordenadas de cada comuna, para consultar el pronóstico.
 *
 * Vienen de un seed generado una vez por `scripts/comunas_centroides.mjs`
 * contra Nominatim y versionado en Git, igual que el seed del XLSX de
 * fertilización. No hay llamada a un tercero en runtime: la política de uso de
 * Nominatim no permite el tráfico de producción, y 346 requests en la primera
 * carga de cada usuario no sería una consulta sino un abuso.
 *
 * LIMITACIÓN CONOCIDA: son centroides de la relación administrativa, no del
 * caserío. En comunas muy extensas (Magallanes, por ejemplo) el punto puede
 * quedar a decenas de kilómetros de donde vive la gente. Para un pronóstico a
 * 7 días la diferencia es de décimas de grado y no cambia la alerta.
 */

type Punto = { lat: number; lng: number };

const POR_COMUNA = centroides as unknown as Record<string, Punto>;

export function centroideDe(comuna?: string | null): Punto | null {
  if (!comuna) return null;
  return POR_COMUNA[comuna] ?? null;
}

/**
 * Último recurso: el centro del de la zona agroclimática.
 *
 * Son 20 valores, no 346, y para un pronóstico a 7 días alcanza. Existe para
 * que una comuna sin coordenada en el seed no quede sin pronóstico en pleno
 * invierno, que es cuando más importa.
 */
const CENTRO_POR_ZONA: Record<number, Punto> = {
  1: { lat: -18.48, lng: -69.8 },   // Arica - Azapa
  2: { lat: -27.37, lng: -70.33 },  // Copiapó Valle
  3: { lat: -29.9, lng: -71.25 },   // La Serena Costa
  4: { lat: -30.08, lng: -71.6 },   // Ovalle
  5: { lat: -32.78, lng: -71.53 },  // Valparaíso-Quillota
  6: { lat: -34.63, lng: -70.87 },  // San Fernando
  7: { lat: -33.03, lng: -70.67 },  // Santiago Norte
  8: { lat: -33.69, lng: -70.83 },  // Santiago Sur - Buin
  9: { lat: -32.83, lng: -70.63 },  // Aconcagua
  10: { lat: -34.44, lng: -70.83 }, // Rancagua
  11: { lat: -34.48, lng: -72.0 },  // Pichilemu Costa
  12: { lat: -35.4, lng: -71.65 },  // Linares
  13: { lat: -36.13, lng: -72.5 },  // Chillán - Ñuble
  14: { lat: -36.9, lng: -72.4 },   // Los Ángeles Interior
  15: { lat: -36.82, lng: -73.05 }, // Chillán
  16: { lat: -37.47, lng: -72.88 }, // Los Ángeles Interior
  17: { lat: -36.83, lng: -73.05 }, // Concepción Costa
  18: { lat: -38.74, lng: -72.6 },  // Temuco - Araucanía
  19: { lat: -39.81, lng: -73.09 }, // Valdivia - Los Ríos
  20: { lat: -41.47, lng: -72.94 }, // Osorno - Los Lagos
};

export function centroideDeZona(zonaId?: number | null): Punto | null {
  if (zonaId == null) return null;
  return CENTRO_POR_ZONA[zonaId] ?? null;
}

/**
 * Centroide de una comuna, con caída a su zona.
 *
 * `deZona: true` avisa que la coordenada es la de la zona y no la del
 * caserío, para que la interfaz pueda decirlo en vez de fingir precisión.
 */
export function puntoDeConsulta(
  comuna?: string | null,
  zonaId?: number | null,
): { punto: Punto; deZona: boolean } | null {
  const propio = centroideDe(comuna);
  if (propio) return { punto: propio, deZona: false };
  const deZona = centroideDeZona(zonaId);
  if (deZona) return { punto: deZona, deZona: true };
  return null;
}

/** Comunas del catálogo que no tienen coordenada en el seed, para diagnosticar. */
export function comunasSinCentroide(): string[] {
  return COMUNAS.filter((c) => !POR_COMUNA[c.comuna]).map((c) => c.comuna);
}