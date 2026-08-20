import { z } from "zod";

export const sponsorshipSchema = z
  .object({
    adUnitId: z.string().min(1).max(120),
    adPartnerId: z.string().min(1).max(120),
    screen: z.enum(["explorar", "huerto", "ficha", "calendario"]),
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    ctaUrl: z.string().url().max(1000).optional(),
    ctaLabel: z.string().max(80).optional(),
    imageUrl: z.string().max(1000).optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    amount: z.number().nonnegative().optional(),
  })
  .strict();

export const sponsorshipUpdateSchema = sponsorshipSchema.partial().strict();

export type SponsorshipInput = z.infer<typeof sponsorshipSchema>;
export type SponsorshipUpdateInput = z.infer<typeof sponsorshipUpdateSchema>;