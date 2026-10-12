export const TELEMETRY_CATEGORIES = [
  "PRODUCT_USAGE",
  "AD_INTERACTION",
  "CMP_CONSENT",
  "COMMERCE_INTENT",
] as const;

import type { TerrenoFeature } from "@/lib/huerto/terreno";

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
  deviceId?: string;
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

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export type PlanTier = "huertero" | "cosecha" | "full";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  interval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
  cancelAt?: string | null;
  paidVia?: string | null;
}

export interface SponsorshipTargeting {
  segments?: string[];
  purchasingPowerTier?: string[];
  primaryInterestCrop?: string[];
  region?: string[];
  comuna?: string[];
}

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
  amount: number;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  targeting?: SponsorshipTargeting | null;
}

export type TipoTarea = "riego" | "nutricion" | "sanidad" | "personalizada";

export type EstadoTarea = "pendiente" | "en_proceso" | "completada";

export interface Cultivo {
  id: string;
  especie: string;
  cantidad: number;
  createdAt: string;
}

/**
 * Edad del árbol como `dim_edad.edad_n` (1..4), o null si no se eligió.
 *
 * Antes era `EdadClaseArbol = "recien" | "joven" | "inicial" | "adulto"` con la
 * columna `gf_arboles.edad_clase`. Ese vocabulario era un cuarto: `dim_edad` ya
 * tiene el número (1-4) y el rótulo largo, y para pasar de uno al otro
 * `EditarArbolDialog` tenía dos mapas escritos a mano. Guardar el número deja
 * de necesitarlos. Ver la Fase 10.5 del plan.
 *
 * Es `number` y no `1 | 2 | 3 | 4` a propósito: la columna es un integer y
 * PostgREST devuelve `number`, así que un union aquí obligaría a castear en
 * cada lectura para no mentir. El rango 1..4 lo garantizan dos cosas de verdad:
 * el `z.number().int().min(1).max(4)` de `ACTUALIZAR_ARBOL` y la clave foránea
 * a `dim_edad.edad_n`.
 */
export type EdadArbol = number;
export type MetodoRiegoArbol = "balde" | "manguera" | "goteo";

export interface Arbol {
  id: string;
  especie: string;
  cantidad: number;
  fechaPlantacion: string | null;
  observaciones: string | null;
  huertoId: string | null;
  posX: number | null;
  posY: number | null;
  createdAt: string;
  edadN?: EdadArbol | null;
  copaM?: number | null;
  metodoRiego?: MetodoRiegoArbol | null;
  caudalLH?: number | null;
}

export interface HuertoResumen {
  id: string;
  nombre: string;
  superficieM2: number;
  centro: { lat: number; lng: number } | null;
  feature: TerrenoFeature | null;
}

export interface Tarea {
  id: string;
  fecha: string;
  especie: string | null;
  tipo: TipoTarea;
  texto: string;
  origenId: string | null;
  estado: EstadoTarea;
  createdAt: string;
}

export interface RegistroCosecha {
  id: string;
  fecha: string;
  especie: string;
  nota: string | null;
  produccionKg: number | null;
  createdAt: string;
}