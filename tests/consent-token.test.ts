import { describe, expect, it } from "vitest";
import {
  buildLocalConsent,
  isConsentValid,
  telemetriaPermitida,
  telemetriaPermitidaCon,
  debeMostrarBanner,
  CONSENT_VERSION,
} from "@/lib/consent/token";

const NOW = Date.parse("2026-08-16T12:00:00.000Z");
const IN_390_DAYS = NOW + 390 * 24 * 60 * 60 * 1000;

describe("buildLocalConsent", () => {
  it("sets a 390-day expiry from the grant moment", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: false,
      thirdPartySharing: true,
      deviceLinking: true,
      legitimateInterestOpposed: false,
    });

    expect(consent.version).toBe(CONSENT_VERSION);
    expect(consent.deviceId).toBe("dev-1");
    expect(consent.personalizedAds).toBe(true);
    expect(consent.preciseGeo).toBe(false);
    expect(Date.parse(consent.expiresAt) - Date.parse(consent.grantedAt)).toBe(
      390 * 24 * 60 * 60 * 1000,
    );
  });
});

describe("isConsentValid", () => {
  it("accepts a consent before expiry", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.expiresAt = new Date(IN_390_DAYS).toISOString();
    consent.version = 1;

    expect(isConsentValid(consent, NOW)).toBe(true);
  });

  it("rejects expired consent", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.expiresAt = new Date(NOW - 1000).toISOString();

    expect(isConsentValid(consent, NOW)).toBe(false);
  });

  it("rejects consent with an invalid expiry timestamp", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.expiresAt = "not-a-date";

    expect(isConsentValid(consent, NOW)).toBe(false);
  });

  it("rejects consent from a future consent version", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: true,
      thirdPartySharing: true,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.expiresAt = new Date(IN_390_DAYS).toISOString();
    consent.version = 99;

    expect(isConsentValid(consent, NOW)).toBe(false);
  });
});
describe("telemetriaPermitida", () => {
  function consentBase(legitimateInterestOpposed: boolean) {
    return buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed,
    });
  }

  it("permite telemetría sin elección registrada (interés legítimo por defecto)", () => {
    expect(telemetriaPermitidaCon(null, NOW)).toBe(true);
    expect(telemetriaPermitida(NOW)).toBe(true);
  });

  it("permite telemetría con elección válida sin oposición", () => {
    const consent = consentBase(false);
    expect(isConsentValid(consent, NOW)).toBe(true);
    expect(telemetriaPermitidaCon(consent, NOW)).toBe(true);
  });

  it("bloquea telemetría con oposición activa", () => {
    const consent = consentBase(true);
    expect(telemetriaPermitidaCon(consent, NOW)).toBe(false);
  });

  it("no bloquea telemetría si la elección está expirada", () => {
    const consent = consentBase(true);
    consent.expiresAt = new Date(NOW - 1000).toISOString();
    expect(telemetriaPermitidaCon(consent, NOW)).toBe(true);
  });
});

describe("versiones del token", () => {
  it("acepta un token v1 explícito (migración defensiva)", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: true,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.version = 1;
    expect(isConsentValid(consent, NOW)).toBe(true);
  });

  it("rechaza versiones futuras", () => {
    const consent = buildLocalConsent({
      userId: "u1",
      deviceId: "dev-1",
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.version = 99;
    expect(isConsentValid(consent, NOW)).toBe(false);
  });
});

describe("debeMostrarBanner", () => {
  it("aparece sin elección local", () => {
    expect(debeMostrarBanner(null, NOW)).toBe(true);
  });

  it("no aparece con elección válida", () => {
    const consent = buildLocalConsent({
      userId: null,
      deviceId: "dev-1",
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: true,
    });
    expect(debeMostrarBanner(consent, NOW)).toBe(false);
  });

  it("reaparece cuando la elección expira", () => {
    const consent = buildLocalConsent({
      userId: null,
      deviceId: "dev-1",
      personalizedAds: false,
      preciseGeo: false,
      thirdPartySharing: false,
      deviceLinking: false,
      legitimateInterestOpposed: false,
    });
    consent.expiresAt = new Date(NOW - 1000).toISOString();
    expect(debeMostrarBanner(consent, NOW)).toBe(true);
  });
});
