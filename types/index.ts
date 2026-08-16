export const TELEMETRY_CATEGORIES = [
  "PRODUCT_USAGE",
  "AD_INTERACTION",
  "CMP_CONSENT",
  "COMMERCE_INTENT",
] as const;

export type TelemetryEventCategory = (typeof TELEMETRY_CATEGORIES)[number];

export const TELEMETRY_EVENT_NAMES = [
  "VIEW_FICHA",
  "PAGE_VIEW",
  "CALCULATOR_SUBMIT",
  "AD_IMPRESSION",
  "AD_CLICK",
  "SEARCH_INP",
  "CMP_CONSENT_GRANTED",
  "CMP_CONSENT_UPDATED",
  "INPUT_QUOTE",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

export interface DeviceMetadata {
  os: string;
  browser: string;
  screenResolution: string;
  connectionType: string;
  manufacturer?: string;
}

export interface GeoContext {
  comuna?: string | null;
  region?: string | null;
  zonaAgroclimatica?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracyMeters?: number | null;
}

export interface TelemetryEvent {
  sessionId: string;
  deviceId: string;
  category: TelemetryEventCategory;
  name: string;
  especieId?: string | null;
  dwellTimeMs?: number | null;
  scrollDepthPercent?: number | null;
  adUnitId?: string | null;
  adPartnerId?: string | null;
  payload?: Record<string, unknown>;
  deviceMetadata?: DeviceMetadata | null;
  clientTimestamp: string;
  geo?: GeoContext | null;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  deviceId: string;
  consentString?: string | null;
  consentPersonalizedAds: boolean;
  consentPreciseGeo: boolean;
  consentThirdPartySharing: boolean;
  consentDeviceLinking: boolean;
  legitimateInterestOpposed: boolean;
  consentTimestamp: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type ConsentPurpose =
  | "personalizedAds"
  | "preciseGeo"
  | "thirdPartySharing"
  | "deviceLinking";

export interface ConsentUpdate {
  deviceId: string;
  consentString?: string;
  consentPersonalizedAds: boolean;
  consentPreciseGeo: boolean;
  consentThirdPartySharing: boolean;
  consentDeviceLinking: boolean;
  legitimateInterestOpposed: boolean;
}

export interface AudienceProfile {
  id: string;
  userId: string;
  commercialSegments: string[];
  purchasingPowerTier: "low" | "medium" | "high" | "commercial" | null;
  lastActivePhenologyStage?: string | null;
  primaryInterestCrop?: string | null;
  totalAdImpressions: number;
  totalAdClicks: number;
  updatedAt: string;
}

export type SponsorshipScreen = "explorar" | "huerto" | "ficha" | "calendario";

export interface Sponsorship {
  id: string;
  adUnitId: string;
  adPartnerId: string;
  screen: SponsorshipScreen;
  title: string;
  description?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
}