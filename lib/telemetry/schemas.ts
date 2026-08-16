import { z } from "zod";

const geoContextSchema = z
  .object({
    comuna: z.string().max(120).nullish(),
    region: z.string().max(120).nullish(),
    zonaAgroclimatica: z.string().max(120).nullish(),
    gpsLat: z.number().min(-90).max(90).nullish(),
    gpsLng: z.number().min(-180).max(180).nullish(),
    gpsAccuracyMeters: z.number().nonnegative().max(10000).nullish(),
  })
  .strict();

const deviceMetadataSchema = z
  .object({
    os: z.string().max(80),
    browser: z.string().max(80),
    screenResolution: z.string().max(40),
    connectionType: z.string().max(40),
    manufacturer: z.string().max(80).optional(),
  })
  .strict();

export const telemetryEventSchema = z
  .object({
    sessionId: z.string().min(1).max(200),
    deviceId: z.string().min(1).max(200),
    category: z.enum([
      "PRODUCT_USAGE",
      "AD_INTERACTION",
      "CMP_CONSENT",
      "COMMERCE_INTENT",
    ]),
    name: z.string().min(1).max(100),
    especieId: z.string().max(120).nullish(),
    dwellTimeMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1000).nullish(),
    scrollDepthPercent: z.number().int().min(0).max(100).nullish(),
    adUnitId: z.string().max(120).nullish(),
    adPartnerId: z.string().max(120).nullish(),
    payload: z.record(z.string(), z.unknown()).nullish(),
    deviceMetadata: deviceMetadataSchema.nullish(),
    clientTimestamp: z.iso.datetime({ offset: true }),
    geo: geoContextSchema.nullish(),
  })
  .strict();

export const telemetryBatchSchema = z
  .object({
    events: z.array(telemetryEventSchema).min(1).max(100),
  })
  .strict();

export type TelemetryEventInput = z.infer<typeof telemetryEventSchema>;
export type TelemetryBatchInput = z.infer<typeof telemetryBatchSchema>;