// Targeting layer for sponsorships (modelo 3).
// Filters are evaluated against the user's computed audience (gf_user_audiences)
// and profile (perfiles.region / perfiles.comuna). Empty/absent targeting means
// generic inventory (no personalization).

import type { SponsorshipTargeting } from "@/types";

export const SEGMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "comprador_fertilizantes_bio", label: "Comprador fertilizantes bio" },
  { value: "busca_fertilizante_organico", label: "Busca fertilizante orgánico" },
  { value: "interes_citricos", label: "Interés en cítricos" },
  { value: "alta_atencion_fichas", label: "Alta atención en fichas" },
  { value: "huerto_comercial", label: "Huerto comercial" },
];

export const POWER_TIER_OPTIONS = [
  "low",
  "medium",
  "high",
  "commercial",
] as const;

export interface AudienceSnapshot {
  commercialSegments?: string[] | null;
  purchasingPowerTier?: string | null;
  primaryInterestCrop?: string | null;
  region?: string | null;
  comuna?: string | null;
}

function overlaps(values: string[] | undefined | null, wanted: string[]): boolean {
  if (!wanted.length) return true;
  const set = new Set(values ?? []);
  return wanted.some((v) => set.has(v));
}

function includes(value: string | undefined | null, wanted: string[]): boolean {
  if (!wanted.length) return true;
  if (!value) return false;
  return wanted.includes(value);
}

// AND across fields, OR within a field.
export function audienceMatchesTargeting(
  targeting: SponsorshipTargeting,
  audience: AudienceSnapshot,
): boolean {
  if (!overlaps(audience.commercialSegments, targeting.segments ?? [])) return false;
  if (!includes(audience.purchasingPowerTier, targeting.purchasingPowerTier ?? []))
    return false;
  if (!includes(audience.primaryInterestCrop, targeting.primaryInterestCrop ?? []))
    return false;
  if (!includes(audience.region, targeting.region ?? [])) return false;
  if (!includes(audience.comuna, targeting.comuna ?? [])) return false;
  return true;
}
