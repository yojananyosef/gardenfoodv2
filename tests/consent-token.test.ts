import { describe, expect, it } from "vitest";
import { buildLocalConsent, isConsentValid } from "@/lib/consent/token";

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

    expect(consent.version).toBe(1);
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