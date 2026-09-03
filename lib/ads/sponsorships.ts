import type { Sponsorship, SponsorshipScreen, SponsorshipTargeting } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { audienceMatchesTargeting, type AudienceSnapshot } from "@/lib/ads/targeting";

interface SponsorshipRow {
  id: string;
  ad_unit_id: string;
  ad_partner_id: string;
  screen: SponsorshipScreen;
  title: string;
  description: string | null;
  cta_url: string | null;
  cta_label: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  amount: number;
  payment_status: string;
  paid_at: string | null;
  targeting: SponsorshipTargeting | null;
}

export function mapSponsorship(row: SponsorshipRow): Sponsorship {
  return {
    id: row.id,
    adUnitId: row.ad_unit_id,
    adPartnerId: row.ad_partner_id,
    screen: row.screen,
    title: row.title,
    description: row.description,
    ctaUrl: row.cta_url,
    ctaLabel: row.cta_label,
    imageUrl: row.image_url,
    active: row.active,
    sortOrder: row.sort_order,
    amount: Number(row.amount ?? 0),
    paymentStatus: (row.payment_status as Sponsorship["paymentStatus"]) ?? "unpaid",
    paidAt: row.paid_at,
    targeting: row.targeting ?? null,
  };
}

// Resuelve si el usuario consintió personalización (consentimiento no expirado).
async function hasPersonalizationConsent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("gf_user_consents")
    .select("consent_personalized_ads")
    .eq("user_id", userId)
    .eq("consent_personalized_ads", true)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  return !!data;
}

// Devuelve los patrocinios activos de la pantalla, filtrados por la audiencia
// del usuario cuando hay identidad y consentimiento; si no, solo genéricos.
export async function getActiveSponsorships(
  screen: SponsorshipScreen,
  userId?: string,
): Promise<Sponsorship[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_sponsorships")
    .select("*")
    .eq("active", true)
    .eq("payment_status", "paid")
    .eq("screen", screen)
    .order("sort_order", { ascending: true });

  if (error) return [];

  const rows = (data as SponsorshipRow[]).map(mapSponsorship);

  // Sin identidad: solo inventario genérico (sin personalización).
  if (!userId) return rows.filter((s) => !s.targeting);

  const personalized = await hasPersonalizationConsent(supabase, userId);
  if (!personalized) return rows.filter((s) => !s.targeting);

  const [{ data: audience }, { data: profile }] = await Promise.all([
    supabase
      .from("gf_user_audiences")
      .select("commercial_segments, purchasing_power_tier, primary_interest_crop")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("perfiles")
      .select("region, comuna")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const snapshot: AudienceSnapshot = {
    commercialSegments: audience?.commercial_segments ?? null,
    purchasingPowerTier: audience?.purchasing_power_tier ?? null,
    primaryInterestCrop: audience?.primary_interest_crop ?? null,
    region: profile?.region ?? null,
    comuna: profile?.comuna ?? null,
  };

  const targeted = rows.filter(
    (s) => s.targeting && audienceMatchesTargeting(s.targeting, snapshot),
  );
  const generic = rows.filter((s) => !s.targeting);

  return [...targeted, ...generic].sort((a, b) => a.sortOrder - b.sortOrder);
}