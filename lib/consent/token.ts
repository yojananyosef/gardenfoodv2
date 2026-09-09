import type { ConsentPurpose } from "@/types";

export const CONSENT_VERSION = 2;
export const CONSENT_TTL_MS = 390 * 24 * 60 * 60 * 1000;

// Versiones que aceptamos como elecciones explícitas válidas del titular:
// v1 (pre-LPDP) comparte semántica de oposición, v2 es la actual.
const VERSIONES_ACEPTADAS = new Set([1, CONSENT_VERSION]);

export const LOCAL_CONSENT_KEY = "gf_consent";
export const CONSENT_COOKIE_NAME = "gf_consent";

export interface LocalConsent {
  version: number;
  userId?: string | null;
  deviceId: string;
  consentString?: string | null;
  personalizedAds: boolean;
  preciseGeo: boolean;
  thirdPartySharing: boolean;
  deviceLinking: boolean;
  legitimateInterestOpposed: boolean;
  grantedAt: string;
  expiresAt: string;
}

function writeCookie(name: string, value: string, ttlMs: number): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${Math.floor(ttlMs / 1000)}; Path=/; SameSite=Lax${secure}`;
}

export function getLocalConsent(): LocalConsent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalConsent;
  } catch {
    return null;
  }
}

export function isConsentValid(consent: LocalConsent, now = Date.now()): boolean {
  return (
    VERSIONES_ACEPTADAS.has(consent.version) &&
    Number.isFinite(Date.parse(consent.expiresAt)) &&
    Date.parse(consent.expiresAt) > now
  );
}

/**
 * Bases de licitud LPDP: la telemetría de producto corre por interés legítimo
 * y solo se detiene si existe una elección válida del titular con la oposición
 * activada. Los consentimientos granulares (ads/geo/terceros/vinculación)
 * se consultan aparte con getConsentPurpose().
 */
export function telemetriaPermitidaCon(
  consent: LocalConsent | null,
  now = Date.now(),
): boolean {
  if (!consent || !isConsentValid(consent, now)) return true;
  return !consent.legitimateInterestOpposed;
}

export function telemetriaPermitida(now = Date.now()): boolean {
  return telemetriaPermitidaCon(getLocalConsent(), now);
}

/** El banner CMP aparece solo sin elección local válida (primera visita o tras revocar). */
export function debeMostrarBanner(
  consent: LocalConsent | null,
  now = Date.now(),
): boolean {
  return !consent || !isConsentValid(consent, now);
}

export function hasValidLocalConsent(now = Date.now()): boolean {
  const consent = getLocalConsent();
  return consent !== null && isConsentValid(consent, now);
}

export function getConsentPurpose(purpose: ConsentPurpose): boolean {
  const consent = getLocalConsent();
  if (!consent || !isConsentValid(consent)) return false;
  switch (purpose) {
    case "personalizedAds":
      return consent.personalizedAds;
    case "preciseGeo":
      return consent.preciseGeo;
    case "thirdPartySharing":
      return consent.thirdPartySharing;
    case "deviceLinking":
      return consent.deviceLinking;
  }
}

export function setLocalConsent(consent: LocalConsent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify(consent));
  writeCookie(CONSENT_COOKIE_NAME, consent.expiresAt, CONSENT_TTL_MS);
}

export function clearLocalConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_CONSENT_KEY);
  writeCookie(CONSENT_COOKIE_NAME, "", 0);
}

export function buildLocalConsent(input: {
  userId?: string | null;
  deviceId: string;
  consentString?: string | null;
  personalizedAds: boolean;
  preciseGeo: boolean;
  thirdPartySharing: boolean;
  deviceLinking: boolean;
  legitimateInterestOpposed: boolean;
  expiresAt?: string;
}): LocalConsent {
  const grantedAt = new Date();
  const expiresAt = new Date(
    input.expiresAt ? Date.parse(input.expiresAt) : grantedAt.getTime() + CONSENT_TTL_MS,
  );
  return {
    version: CONSENT_VERSION,
    userId: input.userId ?? null,
    deviceId: input.deviceId,
    consentString: input.consentString ?? null,
    personalizedAds: input.personalizedAds,
    preciseGeo: input.preciseGeo,
    thirdPartySharing: input.thirdPartySharing,
    deviceLinking: input.deviceLinking,
    legitimateInterestOpposed: input.legitimateInterestOpposed,
    grantedAt: grantedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}