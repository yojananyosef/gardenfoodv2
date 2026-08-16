import { describe, expect, it } from "vitest";
import { computeAudienceProfile } from "@/lib/telemetry/audiences";

describe("computeAudienceProfile", () => {
  it("assigns organic fertilizer buyer segments from commerce intents", () => {
    const result = computeAudienceProfile({
      userId: "u1",
      cropViews: {},
      commerceIntents: [
        { tipo: "fertilizante_organico", marca: "guano_rojo", dosis_kg: 12 },
      ],
      fertilizanteSearches: [],
    });

    expect(result.commercialSegments).toContain("comprador_fertilizantes_bio");
    expect(result.commercialSegments).toContain("busca_fertilizante_organico");
  });

  it("tags citrus interest from species sheet views", () => {
    const result = computeAudienceProfile({
      userId: "u2",
      cropViews: {
        limon: { views: 4, totalDwellMs: 60000, maxScrollPercent: 90 },
      },
      commerceIntents: [],
      fertilizanteSearches: [],
    });

    expect(result.commercialSegments).toContain("interes_citricos");
    expect(result.primaryInterestCrop).toBe("limon");
  });

  it("marks high attention when dwell time exceeds ten minutes", () => {
    const result = computeAudienceProfile({
      userId: "u3",
      cropViews: {
        durazno: { views: 6, totalDwellMs: 12 * 60 * 1000, maxScrollPercent: 95 },
      },
      commerceIntents: [],
      fertilizanteSearches: [],
    });

    expect(result.commercialSegments).toContain("alta_atencion_fichas");
    expect(result.purchasingPowerTier).toBe("high");
  });

  it("derives commercial tier from large surface and repeated fertilizer intents", () => {
    const result = computeAudienceProfile({
      userId: "u4",
      superficieM2: 12000,
      cropViews: {},
      commerceIntents: [
        { tipo: "fertilizante_organico" },
        { tipo: "fertilizante_organico" },
        { tipo: "fertilizante_organico" },
      ],
      fertilizanteSearches: [],
    });

    expect(result.purchasingPowerTier).toBe("commercial");
    expect(result.commercialSegments).toContain("huerto_comercial");
  });

  it("keeps low tier for users with no signals", () => {
    const result = computeAudienceProfile({
      userId: "u5",
      cropViews: {},
      commerceIntents: [],
      fertilizanteSearches: [],
    });

    expect(result.purchasingPowerTier).toBe("low");
    expect(result.commercialSegments).toEqual([]);
    expect(result.primaryInterestCrop).toBeNull();
  });
});