import { z } from "zod";
import { TELEMETRY_CATEGORIES, TELEMETRY_EVENT_NAMES } from "@/types";

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
    // Opcional: clientes sin identidad durable la omiten; el servidor resuelve
    // por escalera (cookie first-party → nuevo identificador).
    deviceId: z.string().min(1).max(200).optional(),
    category: z.enum(TELEMETRY_CATEGORIES),
    /**
     * El nombre se valida contra el vocabulario, no contra su longitud.
     *
     * Antes era `z.string().min(1).max(100)`, que dejaba pasar cualquier cosa:
     * un nombre mal escrito llegaba a la base como texto y se descubría meses
     * después, cuando un total del panel no cuadraba. Las 6 filas que quedaron
     * fuera del dominio de la Fase 10.2 salieron de ahí.
     *
     * Con el enum en `gf_analytics_events.event_name` (migración 0044), esto
     * deja de ser teórico: sin esta validación, un nombre nuevo mal escrito
     * haría fallar el insert con un error de Postgres en vez de un mensaje de
     * validación en el cliente.
     */
    name: z.enum(TELEMETRY_EVENT_NAMES),
    especieId: z.string().max(120).nullish(),
    dwellTimeMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1000).nullish(),
    scrollDepthPercent: z.number().int().min(0).max(100).nullish(),
    adUnitId: z.string().max(120).nullish(),
    adPartnerId: z.string().max(120).nullish(),
    // `z.json()` y no `z.unknown()`: `payload` termina en una columna jsonb.
    // Con `unknown` el schema aceptaba funciones y referencias circulares, que
    // se descubren recien en el insert de Postgres.
    payload: z.record(z.string(), z.json()).nullish(),
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