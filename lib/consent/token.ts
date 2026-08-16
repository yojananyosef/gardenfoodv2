import type { ConsentPurpose } from "@/types";

export const CONSENT_VERSION = 1;
export const CONSENT_TTL_MS = 390 * 24 * 60 * 60 * 1000;

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

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
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
    consent.version === CONSENT_VERSION &&
    Number.isFinite(Date.parse(consent.expiresAt)) &&
    Date.parse(consent.expiresAt) > now
  );
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
}): LocalConsent {
  const grantedAt = new Date();
  const expiresAt = new Date(grantedAt.getTime() + CONSENT_TTL_MS);
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

export function readConsentCookieExpiry(): string | null {
  return readCookie(CONSENT_COOKIE_NAME);
}