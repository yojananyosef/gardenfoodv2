export interface CropSignals {
  views: number;
  totalDwellMs: number;
  maxScrollPercent: number;
}

export interface AudienceSignals {
  userId: string;
  superficieM2?: number;
  region?: string | null;
  comuna?: string | null;
  cropViews: Record<string, CropSignals>;
  commerceIntents: Array<Record<string, unknown>>;
  fertilizanteSearches: string[];
  phenologyStage?: string | null;
}

export interface AudienceProfileResult {
  commercialSegments: string[];
  purchasingPowerTier: "low" | "medium" | "high" | "commercial";
  lastActivePhenologyStage?: string | null;
  primaryInterestCrop?: string | null;
}

const SEGMENTS = {
  compradorFertilizantesBio: "comprador_fertilizantes_bio",
  buscaFertilizanteOrganico: "busca_fertilizante_organico",
  interesCitricos: "interes_citricos",
  altaAtencionFichas: "alta_atencion_fichas",
  huertoComercial: "huerto_comercial",
} as const;

const CITRUS_CROPS = ["citron", "limon", "naranjo", "mandarino", "pomelo"];

const FERTILIZER_HINTS = [
  "fertilizante_organico",
  "guano",
  "compost",
  "biofertilizante",
  "humus",
];

function isFertilizerIntent(intent: Record<string, unknown>): boolean {
  const tipo = String(intent.tipo ?? "");
  const marca = String(intent.marca ?? "");
  const texto = `${tipo} ${marca}`.toLowerCase();
  return FERTILIZER_HINTS.some((hint) => texto.includes(hint));
}

function isOrganicFertilizerIntent(intent: Record<string, unknown>): boolean {
  const tipo = String(intent.tipo ?? "");
  const marca = String(intent.marca ?? "");
  const texto = `${tipo} ${marca}`.toLowerCase();
  return FERTILIZER_HINTS.some((hint) => texto.includes(hint)) && /bio|organico|organi/.test(texto);
}

export function computeAudienceProfile(
  signals: AudienceSignals,
): AudienceProfileResult {
  const segments = new Set<string>();
  const views = Object.entries(signals.cropViews);
  const totalDwellMs = views.reduce((sum, [, crop]) => sum + crop.totalDwellMs, 0);
  const organicIntents = signals.commerceIntents.filter(isOrganicFertilizerIntent);
  const anyFertilizerIntents = signals.commerceIntents.filter(isFertilizerIntent);

  if (organicIntents.length > 0) {
    segments.add(SEGMENTS.compradorFertilizantesBio);
  }
  if (anyFertilizerIntents.length > 0 || signals.fertilizanteSearches.length > 0) {
    segments.add(SEGMENTS.buscaFertilizanteOrganico);
  }
  if (views.some(([crop]) => CITRUS_CROPS.includes(crop))) {
    segments.add(SEGMENTS.interesCitricos);
  }
  if (totalDwellMs > 10 * 60 * 1000) {
    segments.add(SEGMENTS.altaAtencionFichas);
  }
  if ((signals.superficieM2 ?? 0) >= 5000) {
    segments.add(SEGMENTS.huertoComercial);
  }

  const primaryInterestCrop = views.length > 0
    ? [...views].sort((a, b) => b[1].views - a[1].views)[0][0]
    : null;

  let tier: "low" | "medium" | "high" | "commercial" = "low";
  if ((signals.superficieM2 ?? 0) >= 10000 && anyFertilizerIntents.length >= 2) {
    tier = "commercial";
  } else if (
    (signals.superficieM2 ?? 0) >= 5000 ||
    totalDwellMs > 10 * 60 * 1000 ||
    signals.commerceIntents.length >= 3
  ) {
    tier = "high";
  } else if (signals.commerceIntents.length > 0) {
    tier = "medium";
  }

  return {
    commercialSegments: [...segments],
    purchasingPowerTier: tier,
    lastActivePhenologyStage: signals.phenologyStage ?? null,
    primaryInterestCrop,
  };
}