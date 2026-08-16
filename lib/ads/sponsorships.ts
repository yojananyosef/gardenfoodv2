import type { Sponsorship, SponsorshipScreen } from "@/types";
import { createClient } from "@/lib/supabase/server";

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
  };
}

export async function getActiveSponsorships(
  screen: SponsorshipScreen,
): Promise<Sponsorship[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_sponsorships")
    .select("*")
    .eq("active", true)
    .eq("screen", screen)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data as SponsorshipRow[]).map(mapSponsorship);
}