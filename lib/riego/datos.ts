/**
 * Datos del módulo Suelo y Riego (guía GARDENFOOD, método USDA-NRCS).
 * Factores extraídos de `GARDENFOOD_Suelo_y_Riego_en_Casa.xlsx` hoja
 * "Tablas y factores" + `Suelo_y_Riego_en_Casa_GARDENFOOD.html` (DATOS).
 * La base litros/días por especie+mes vive en FICHAS (lib/agronomy);
 * aquí solo van los factores de ajuste + quiz + mapeo de zonas.
 */

export type SueloId = "G" | "MG" | "M" | "F";

export interface TipoSuelo {
  id: SueloId;
  nombre: string;
  tecnico: string;
  /** Factor de volumen y de frecuencia (misma tabla Excel). */
  fv: number;
  guardaMm: string;
  sensacion: string;
  manejo: string;
}

export const TIPOS_SUELO: TipoSuelo[] = [
  {
    id: "G",
    nombre: "Gruesa (arenosa)",
    tecnico: "Arena, arena francosa, arena fina",
    fv: 0.7,
    guardaMm: "50–100 mm/m",
    sensacion: "Arenoso al tacto, no forma cinta, se desarma solo.",
    manejo:
      "Se seca rápido: riegue MÁS SEGUIDO y con MENOS agua cada vez. Mulch de 10 cm bajo la copa y compost anual.",
  },
  {
    id: "MG",
    nombre: "Moderadamente gruesa",
    tecnico: "Franco arenoso, franco arenoso fino",
    fv: 0.85,
    guardaMm: "108–142 mm/m",
    sensacion: "Forma bola pero cinta corta (menos de 2,5 cm). Áspero al frotar mojado.",
    manejo:
      "Riegue en dos tiempos (mitad, esperar 20 minutos, la otra mitad). Mulch de 8–10 cm y compost anual.",
  },
  {
    id: "M",
    nombre: "Media (franca)",
    tecnico: "Franco, franco limoso, franco arenoso arcilloso",
    fv: 1.0,
    guardaMm: "125–175 mm/m",
    sensacion: "Cinta de 2,5 a 5 cm. Ni muy áspero ni muy jabonoso.",
    manejo:
      "El mejor suelo para frutales. Mantenga el mulch y riegue en el borde de la copa, no pegado al tronco.",
  },
  {
    id: "F",
    nombre: "Fina (arcillosa)",
    tecnico: "Arcilla, franco arcilloso, franco arcilloso limoso",
    fv: 1.15,
    guardaMm: "133–200 mm/m",
    sensacion: "Cinta larga de más de 5 cm, plástica como greda.",
    manejo:
      "Retiene mucha agua: riegue MENOS SEGUIDO, con MÁS agua cada vez, pero LENTO. Nunca riegue si está pegajoso.",
  },
];

export type EdadClase = "recien" | "joven" | "inicial" | "adulto";

export interface EdadRiego {
  id: EdadClase;
  nombre: string;
  factorLitros: number;
  factorDias: number;
}

export const EDADES_RIEGO: EdadRiego[] = [
  { id: "recien", nombre: "Recién plantado (0-1 año)", factorLitros: 0.3, factorDias: 0.55 },
  { id: "joven", nombre: "Joven (2-3 años)", factorLitros: 0.55, factorDias: 0.75 },
  { id: "inicial", nombre: "En producción inicial (4-5 años)", factorLitros: 0.8, factorDias: 0.9 },
  { id: "adulto", nombre: "Adulto (6 años o más)", factorLitros: 1.0, factorDias: 1.0 },
];

/** Test de la bola: 5 niveles USDA. fv multiplica la dosis; regar solo en 1-2. */
export interface NivelHumedad {
  n: number;
  nombre: string;
  fv: number;
  regar: boolean;
}

export const NIVELES_HUMEDAD: NivelHumedad[] = [
  { n: 1, nombre: "0-25 % — muy seco", fv: 1.3, regar: true },
  { n: 2, nombre: "25-50 % — seco (punto de riego)", fv: 1.0, regar: true },
  { n: 3, nombre: "50-75 % — húmedo", fv: 0, regar: false },
  { n: 4, nombre: "75-100 % — muy húmedo", fv: 0, regar: false },
  { n: 5, nombre: "100 % — capacidad de campo", fv: 0, regar: false },
];

export type ZonaRiegoId = "N1" | "N2" | "C1" | "C2" | "S1" | "S2" | "P1" | "V1" | "V2" | "V3" | "V4";

export interface ZonaRiego {
  id: ZonaRiegoId;
  nombre: string;
  fc: number;
  desfase: number;
}

export const ZONAS_RIEGO: ZonaRiego[] = [
  { id: "N1", nombre: "Norte y valles transversales", fc: 1.3, desfase: -1 },
  { id: "N2", nombre: "Costa norte", fc: 0.95, desfase: 0 },
  { id: "C1", nombre: "Valle central interior (referencia)", fc: 1.0, desfase: 0 },
  { id: "C2", nombre: "Costa central", fc: 0.78, desfase: 0 },
  { id: "S1", nombre: "Centro sur", fc: 0.88, desfase: 0 },
  { id: "S2", nombre: "Sur", fc: 0.72, desfase: 1 },
  { id: "P1", nombre: "Precordillera y altura", fc: 0.9, desfase: 1 },
  { id: "V1", nombre: "Verano muy caluroso y seco (+32 °C)", fc: 1.3, desfase: 0 },
  { id: "V2", nombre: "Verano caluroso y seco (28-32 °C)", fc: 1.0, desfase: 0 },
  { id: "V3", nombre: "Verano templado (24-28 °C)", fc: 0.88, desfase: 0 },
  { id: "V4", nombre: "Verano fresco (−24 °C)", fc: 0.75, desfase: 0 },
];

/**
 * Mapeo zona agroclimática app (1..20) → zona de riego Excel.
 * Rapel (12) cae en C1 (valle central interior). P1 es manual (altura).
 */
export function zonaRiegoDeZonaId(zonaId: number | null | undefined): ZonaRiegoId {
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

/** Copa de referencia por especie (m), tabla E del Excel. Default 2,0. */
const COPA_REF: Record<string, number> = {
  Vid: 2.5,
  Arandano: 1.5,
  Olivo: 3.0,
  Frutilla: 0.3,
  Frambuesa: 1.0,
  Mora: 1.5,
  Kiwi: 3.5,
  "Avellano Europeo": 3.5,
  "Níspero Japonés": 3.5,
  Lúcuma: 4.0,
  Palto: 4.0,
  Chirimoya: 4.0,
  "Papayo Chileno": 2.5,
};

export function copaReferencia(dbKey: string): number {
  return COPA_REF[dbKey] ?? 2.0;
}

/** Quiz cinta (paso 1): 6 pasos USDA adaptados. */
export const PASOS_CINTA: { titulo: string; detalle: string }[] = [
  { titulo: "Saque la muestra a 20 cm", detalle: "Bajo el borde de la copa, nunca al pie del tronco." },
  { titulo: "Limpie la tierra", detalle: "Saque piedras, raíces y pasto. Desarme los terrones." },
  { titulo: "Moje de a gotitas", detalle: "Nunca de golpe. Si se pasó de agua, agregue tierra seca." },
  { titulo: "Amase como plasticina", detalle: "Que se deje moldear, sin chorrear ni desarmarse." },
  { titulo: "Forme la cinta", detalle: "Bola entre pulgar e índice, empuje suave hacia arriba." },
  { titulo: "Mida hasta que se corte", detalle: "No forma cinta = G · <2,5 cm = MG · 2,5-5 cm = M · >5 cm = F." },
];

/** Quiz bola (paso 2): se hace antes de cada riego, 15 segundos. */
export const PASOS_BOLA: { titulo: string; detalle: string }[] = [
  { titulo: "No riegue antes de medir", detalle: "Ni justo después de una lluvia." },
  { titulo: "Saque de 20-30 cm", detalle: "Ahí están las raíces que absorben." },
  { titulo: "Apriete fuerte una vez", detalle: "Una sola vez, no amase." },
  { titulo: "Abra y mire", detalle: "Si se armó la bola, si se desarma, si mancha agua." },
  { titulo: "Compare", detalle: "Riegue solo si está en 0-50 % (niveles 1-2)." },
];

export const BALDE_L = 10;
