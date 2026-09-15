import { z } from "zod";

/**
 * Nombres canónicos (cortos): los que envían todos los clientes
 * (ConsentBanner, ConsentModal, ConsentPreferences/useConsentSave) y los que
 * usa `LocalConsent`. El servidor los acepta tal cual.
 */
export const consentPurposesSchema = z.object({
  personalizedAds: z.boolean(),
  preciseGeo: z.boolean(),
  thirdPartySharing: z.boolean(),
  deviceLinking: z.boolean(),
  legitimateInterestOpposed: z.boolean(),
});

/** Compat hacia atrás: payloads antiguos con prefijo `consent*`. */
const PREFIJO_A_CORTO: Record<string, string> = {
  consentPersonalizedAds: "personalizedAds",
  consentPreciseGeo: "preciseGeo",
  consentThirdPartySharing: "thirdPartySharing",
  consentDeviceLinking: "deviceLinking",
};

function normalizarConsentimiento(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const entrada = value as Record<string, unknown>;
  const salida: Record<string, unknown> = { ...entrada };
  for (const [prefijada, corta] of Object.entries(PREFIJO_A_CORTO)) {
    if (!(corta in salida) && prefijada in salida) {
      salida[corta] = salida[prefijada];
    }
    delete salida[prefijada];
  }
  return salida;
}

const consentUpdateBase = consentPurposesSchema.extend({
  deviceId: z.string().min(1).max(200),
  consentString: z.string().max(2048).nullish(),
});

/**
 * Acepta nombres cortos (clientes actuales) y prefijados (legacy); las
 * claves desconocidas se ignoran para no romper clientes futuros.
 * El resultado siempre usa nombres cortos.
 */
export const consentUpdateSchema = z.preprocess(
  normalizarConsentimiento,
  consentUpdateBase,
);

export type ConsentUpdateInput = z.infer<typeof consentUpdateBase>;
