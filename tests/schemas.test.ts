import { describe, expect, it } from "vitest";
import { consentUpdateSchema } from "@/lib/consent/schemas";
import { telemetryBatchSchema, telemetryEventSchema } from "@/lib/telemetry/schemas";

const VALID_EVENT = {
  sessionId: "sess-1",
  deviceId: "dev-1",
  category: "PRODUCT_USAGE",
  name: "VIEW_FICHA",
  especieId: "durazno",
  dwellTimeMs: 45000,
  scrollDepthPercent: 80,
  payload: { dosis_kg: 1.5 },
  deviceMetadata: {
    os: "Android",
    browser: "Chrome",
    screenResolution: "1080x2400",
    connectionType: "4g",
  },
  clientTimestamp: "2026-08-16T12:00:00.000Z",
  geo: {
    comuna: "Santiago",
    region: "Metropolitana",
    gpsLat: -33.4489,
    gpsLng: -70.6693,
    gpsAccuracyMeters: 120,
  },
};

describe("telemetryEventSchema", () => {
  it("accepts a well-formed event", () => {
    expect(telemetryEventSchema.safeParse(VALID_EVENT).success).toBe(true);
  });

  it("rejects an unknown event category", () => {
    expect(
      telemetryEventSchema.safeParse({ ...VALID_EVENT, category: "SPYING" })
        .success,
    ).toBe(false);
  });

  it("rejects missing session id", () => {
    const rest = { ...VALID_EVENT } as Partial<typeof VALID_EVENT>;
    delete rest.sessionId;
    expect(telemetryEventSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects scroll depth above 100", () => {
    expect(
      telemetryEventSchema.safeParse({ ...VALID_EVENT, scrollDepthPercent: 150 })
        .success,
    ).toBe(false);
  });

  it("rejects negative dwell time", () => {
    expect(
      telemetryEventSchema.safeParse({ ...VALID_EVENT, dwellTimeMs: -5 }).success,
    ).toBe(false);
  });

  it("rejects an invalid timestamp", () => {
    expect(
      telemetryEventSchema.safeParse({
        ...VALID_EVENT,
        clientTimestamp: "ayer",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown extra keys (strict)", () => {
    expect(
      telemetryEventSchema.safeParse({ ...VALID_EVENT, hackerField: true }).success,
    ).toBe(false);
  });
});

describe("telemetryBatchSchema", () => {
  it("accepts a batch of events", () => {
    expect(
      telemetryBatchSchema.safeParse({ events: [VALID_EVENT, VALID_EVENT] }).success,
    ).toBe(true);
  });

  it("rejects an empty batch", () => {
    expect(telemetryBatchSchema.safeParse({ events: [] }).success).toBe(false);
  });

  it("rejects more than 100 events", () => {
    expect(
      telemetryBatchSchema.safeParse({ events: Array(101).fill(VALID_EVENT) })
        .success,
    ).toBe(false);
  });
});

describe("consentUpdateSchema", () => {
  const valid = {
    deviceId: "dev-1",
    consentPersonalizedAds: true,
    consentPreciseGeo: false,
    consentThirdPartySharing: true,
    consentDeviceLinking: true,
    legitimateInterestOpposed: false,
  };

  it("accepts a well-formed consent update", () => {
    expect(consentUpdateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-boolean purpose flags", () => {
    expect(
      consentUpdateSchema.safeParse({ ...valid, consentPreciseGeo: "yes" })
        .success,
    ).toBe(false);
  });

  it("rejects a missing device id", () => {
    const rest = { ...valid } as Partial<typeof valid>;
    delete rest.deviceId;
    expect(consentUpdateSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects unknown extra keys (strict)", () => {
    expect(consentUpdateSchema.safeParse({ ...valid, evil: 1 }).success).toBe(
      false,
    );
  });
});