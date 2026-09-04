/**
 * Modelo 3D procedural por especie: cada frutal tiene su porte (tronco, copa
 * y frutos) para que un duraznero no se vea igual que un olivo. Todo paramétrico,
 * sin assets externos; `components/huerto/modelosArbol3D.ts` lo construye.
 */

export type FormaArbol =
  | "esferico"
  | "citrico"
  | "grande"
  | "olivo"
  | "higuera"
  | "parron"
  | "arbusto"
  | "multitronco"
  | "penacho";

export type ModeloArbol = {
  forma: FormaArbol;
  /** Escala global del ejemplar. */
  escala: number;
  troncoAlto: number;
  troncoRadio: number;
  copaRadio: number;
  /** Achatamiento vertical de la copa (1 = esfera). */
  copaAchatadaY: number;
  colorCopa: string;
  colorCopa2: string;
  frutos: { color: string; cantidad: number } | null;
};

const ESFERICO: Omit<ModeloArbol, "escala" | "colorCopa" | "colorCopa2" | "frutos"> = {
  forma: "esferico",
  troncoAlto: 0.7,
  troncoRadio: 0.085,
  copaRadio: 0.5,
  copaAchatadaY: 1,
};

function esferico(
  colorCopa: string,
  colorCopa2: string,
  extra: Partial<ModeloArbol> = {},
): ModeloArbol {
  return { ...ESFERICO, escala: 1, colorCopa, colorCopa2, frutos: null, ...extra };
}

const MODELOS: Record<string, ModeloArbol> = {
  duraznero: esferico("#3f8f3a", "#5aa848", { frutos: { color: "#f5a623", cantidad: 5 } }),
  ciruelo: esferico("#357a33", "#4d9240", { frutos: { color: "#7c3aed", cantidad: 5 } }),
  cerezo: esferico("#2f7d33", "#479a4b", { frutos: { color: "#dc2626", cantidad: 6 } }),
  damasco: esferico("#45953c", "#5fad52", { frutos: { color: "#fb923c", cantidad: 5 } }),
  nectarino: esferico("#3f8f3a", "#58a647", { frutos: { color: "#f97316", cantidad: 5 } }),
  manzano: esferico("#35803a", "#4c9450", {
    escala: 1.05,
    frutos: { color: "#e11d48", cantidad: 5 },
  }),
  peral: esferico("#3a8740", "#529a58", {
    copaAchatadaY: 1.12,
    frutos: { color: "#facc15", cantidad: 4 },
  }),
  membrillo: esferico("#4d9240", "#63a654"),
  limonero: esferico("#256b2f", "#37853f", {
    forma: "citrico",
    frutos: { color: "#fde047", cantidad: 6 },
  }),
  naranjo: esferico("#1f6b2e", "#33853d", {
    forma: "citrico",
    frutos: { color: "#f59e0b", cantidad: 6 },
  }),
  mandarino: esferico("#23702f", "#36853e", {
    forma: "citrico",
    escala: 0.9,
    frutos: { color: "#fb923c", cantidad: 6 },
  }),
  pomelo: esferico("#256b2f", "#37853f", {
    forma: "citrico",
    escala: 1.05,
    frutos: { color: "#fbbf24", cantidad: 5 },
  }),
  nogal: {
    forma: "grande",
    escala: 1.35,
    troncoAlto: 1.0,
    troncoRadio: 0.13,
    copaRadio: 0.62,
    copaAchatadaY: 1,
    colorCopa: "#2c6b2c",
    colorCopa2: "#3f8340",
    frutos: null,
  },
  almendro: esferico("#4c8f3e", "#62a353", { escala: 1.1 }),
  higuera: {
    forma: "higuera",
    escala: 1,
    troncoAlto: 0.45,
    troncoRadio: 0.13,
    copaRadio: 0.62,
    copaAchatadaY: 0.78,
    colorCopa: "#4d8f31",
    colorCopa2: "#63a546",
    frutos: { color: "#5b21b6", cantidad: 4 },
  },
  granado: esferico("#3e8e3e", "#55a354", {
    escala: 0.85,
    frutos: { color: "#dc2626", cantidad: 4 },
  }),
  caqui: esferico("#468a38", "#5b9e4d", { frutos: { color: "#f97316", cantidad: 4 } }),
  vid: {
    forma: "parron",
    escala: 0.9,
    troncoAlto: 0.4,
    troncoRadio: 0.09,
    copaRadio: 0.72,
    copaAchatadaY: 0.45,
    colorCopa: "#5a9c3c",
    colorCopa2: "#70b151",
    frutos: { color: "#7c3aed", cantidad: 4 },
  },
  arandano: {
    forma: "arbusto",
    escala: 0.55,
    troncoAlto: 0.35,
    troncoRadio: 0.05,
    copaRadio: 0.5,
    copaAchatadaY: 0.85,
    colorCopa: "#3f8f3a",
    colorCopa2: "#55a549",
    frutos: { color: "#3b82f6", cantidad: 6 },
  },
  olivo: {
    forma: "olivo",
    escala: 1,
    troncoAlto: 0.5,
    troncoRadio: 0.14,
    copaRadio: 0.55,
    copaAchatadaY: 0.8,
    colorCopa: "#8a9a5b",
    colorCopa2: "#a3b174",
    frutos: null,
  },
  frutilla: {
    forma: "arbusto",
    escala: 0.35,
    troncoAlto: 0.2,
    troncoRadio: 0.04,
    copaRadio: 0.5,
    copaAchatadaY: 0.7,
    colorCopa: "#46a04a",
    colorCopa2: "#5cb45f",
    frutos: { color: "#ef4444", cantidad: 5 },
  },
  frambuesa: {
    forma: "arbusto",
    escala: 0.5,
    troncoAlto: 0.4,
    troncoRadio: 0.045,
    copaRadio: 0.45,
    copaAchatadaY: 0.9,
    colorCopa: "#3f9340",
    colorCopa2: "#56a856",
    frutos: { color: "#e11d48", cantidad: 6 },
  },
  mora: {
    forma: "arbusto",
    escala: 0.55,
    troncoAlto: 0.4,
    troncoRadio: 0.05,
    copaRadio: 0.5,
    copaAchatadaY: 0.85,
    colorCopa: "#35763a",
    colorCopa2: "#4b8d4f",
    frutos: { color: "#4c1d95", cantidad: 6 },
  },
  kiwi: {
    forma: "parron",
    escala: 1,
    troncoAlto: 0.5,
    troncoRadio: 0.1,
    copaRadio: 0.78,
    copaAchatadaY: 0.45,
    colorCopa: "#558f36",
    colorCopa2: "#6ba64c",
    frutos: null,
  },
  "avellano europeo": {
    forma: "multitronco",
    escala: 1,
    troncoAlto: 0.6,
    troncoRadio: 0.06,
    copaRadio: 0.52,
    copaAchatadaY: 1,
    colorCopa: "#4a8540",
    colorCopa2: "#609a56",
    frutos: null,
  },
  "nispero japones": esferico("#3d8440", "#549859", { escala: 0.95 }),
  chirimoya: esferico("#49943c", "#5fa852", { escala: 1 }),
  lucuma: esferico("#3f8a3c", "#559e51", { escala: 1.05 }),
  "papayo chileno": {
    forma: "penacho",
    escala: 1.1,
    troncoAlto: 1.7,
    troncoRadio: 0.07,
    copaRadio: 0.42,
    copaAchatadaY: 0.7,
    colorCopa: "#57a047",
    colorCopa2: "#6db45c",
    frutos: null,
  },
  palto: {
    forma: "grande",
    escala: 1.3,
    troncoAlto: 0.95,
    troncoRadio: 0.12,
    copaRadio: 0.6,
    copaAchatadaY: 1.05,
    colorCopa: "#2e7030",
    colorCopa2: "#438544",
    frutos: null,
  },
};

const ALIAS: Record<string, string> = {
  cereza: "cerezo",
  durazno: "duraznero",
  ciruela: "ciruelo",
  damasca: "damasco",
  manzana: "manzano",
  pera: "peral",
  naranja: "naranjo",
  limon: "limonero",
  mandarina: "mandarino",
  nuez: "nogal",
  almendra: "almendro",
  higo: "higuera",
  granada: "granado",
  uva: "vid",
  parra: "vid",
  arandanos: "arandano",
  frambuesas: "frambuesa",
  moras: "mora",
  frutillas: "frutilla",
  aceituna: "olivo",
  avellano: "avellano europeo",
  nispero: "nispero japones",
  "nispero japones": "nispero japones",
  papayo: "papayo chileno",
  chirimoyo: "chirimoya",
  lúcuma: "lucuma",
  palta: "palto",
};

export function normalizarEspecie(especie: string): string {
  return especie
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PALETA_FALLBACK = ["#3d8b37", "#4c8f3e", "#357a33", "#458f3c", "#2f7d33"];

export function modeloDeArbol(especie: string): ModeloArbol {
  const clave = normalizarEspecie(especie);
  const directa = MODELOS[clave] ?? MODELOS[ALIAS[clave] ?? ""];
  if (directa) return directa;
  // Fallback: esférico genérico con tono estable derivado del hash (igual
  // criterio que colorDeEspecie para no romper especies futuras).
  let hash = 0;
  for (const ch of clave) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  const color = PALETA_FALLBACK[hash % PALETA_FALLBACK.length];
  return esferico(color, color, { escala: 0.95 });
}
