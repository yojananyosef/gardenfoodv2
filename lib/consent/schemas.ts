import { z } from "zod";

export const consentPurposesSchema = z.object({
  consentPersonalizedAds: z.boolean(),
  consentPreciseGeo: z.boolean(),
  consentThirdPartySharing: z.boolean(),
  consentDeviceLinking: z.boolean(),
  legitimateInterestOpposed: z.boolean(),
});

export const consentUpdateSchema = consentPurposesSchema
  .extend({
    deviceId: z.string().min(1).max(200),
    consentString: z.string().max(2048).optional(),
  })
  .strict();

export type ConsentUpdateInput = z.infer<typeof consentUpdateSchema>;