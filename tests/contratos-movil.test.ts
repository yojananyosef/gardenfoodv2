import { describe, expect, it } from "vitest";
import { telemetryBatchSchema } from "@/lib/telemetry/schemas";
import { consentUpdateSchema } from "@/lib/consent/schemas";

// Los ejemplos de docs/api/contratos-movil.md son el contrato: si estos
// payloads dejan de validar, la doc y el schema divergieron.
describe("contratos-movil: payloads de ejemplo validan contra los schemas", () => {
  it("ejemplo de evento de telemetría", () => {
    const batch = {
      events: [
        {
          sessionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          deviceId: "install-uuid-o-null",
          category: "PRODUCT_USAGE",
          name: "VIEW_FICHA",
          especieId: "duraznero",
          dwellTimeMs: 42000,
          scrollDepthPercent: 80,
          payload: { path: "/especies/duraznero" },
          deviceMetadata: {
            os: "iOS",
            browser: "RN-Safari",
            screenResolution: "390x844",
            connectionType: "5g",
          },
          clientTimestamp: "2026-09-09T14:30:00.000Z",
          geo: { comuna: "Pichilemu", region: "O'Higgins", zonaAgroclimatica: "5" },
        },
      ],
    };
    const parsed = telemetryBatchSchema.safeParse(batch);
    expect(parsed.success).toBe(true);
  });

  it("evento sin deviceId sigue siendo válido (escalera server-side)", () => {
    const batch = {
      events: [
        {
          sessionId: "sess",
          category: "PRODUCT_USAGE",
          name: "PAGE_VIEW",
          clientTimestamp: "2026-09-09T14:30:00.000Z",
        },
      ],
    };
    const parsed = telemetryBatchSchema.safeParse(batch);
    expect(parsed.success).toBe(true);
  });

  it("ejemplo de consent CMP", () => {
    const parsed = consentUpdateSchema.safeParse({
      deviceId: "install-uuid",
      consentPersonalizedAds: false,
      consentPreciseGeo: false,
      consentThirdPartySharing: false,
      consentDeviceLinking: false,
      legitimateInterestOpposed: false,
      consentString: null,
    });
    expect(parsed.success).toBe(true);
  });
});
