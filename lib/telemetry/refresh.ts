import { createAdminClient } from "@/lib/supabase/admin";
import { computeAudienceProfile, type AudienceSignals } from "@/lib/telemetry/audiences";

const LOOKBACK_DAYS = 30;
const BATCH_SIZE = 500;

interface EventRow {
  user_id: string | null;
  event_category: string;
  event_name: string;
  especie_id: string | null;
  dwell_time_ms: number | null;
  scroll_depth_percent: number | null;
  payload: Record<string, unknown> | null;
  region: string | null;
  comuna: string | null;
  client_timestamp: string;
}

interface ConsentRow {
  user_id: string | null;
  expires_at: string;
}

export async function refreshAudiences(): Promise<{ processed: number; errors: string[] }> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase
    .from("perfiles")
    .select("id, superficie_m2, zona_agroclimatica")
    .order("created_at", { ascending: true });

  const profileMap = new Map<string, { superficieM2?: number; phenologyStage?: string }>();
  for (const profile of profiles ?? []) {
    profileMap.set(profile.id, {
      superficieM2: profile.superficie_m2 ?? undefined,
      phenologyStage: profile.zona_agroclimatica ?? undefined,
    });
  }

  const { data: consents } = await supabase
    .from("gf_user_consents")
    .select("user_id, expires_at")
    .gt("expires_at", new Date().toISOString());

  const consented = new Set<string>();
  for (const consent of (consents ?? []) as ConsentRow[]) {
    if (consent.user_id) consented.add(consent.user_id);
  }

  let processed = 0;
  let offset = 0;
  for (;;) {
    const { data: events, error } = await supabase
      .from("gf_analytics_events")
      .select(
        "user_id, event_category, event_name, especie_id, dwell_time_ms, scroll_depth_percent, payload, region, comuna, client_timestamp",
      )
      .gte("client_timestamp", since)
      .not("user_id", "is", null)
      .order("client_timestamp", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      errors.push(error.message);
      break;
    }
    const rows = (events ?? []) as EventRow[];
    if (rows.length === 0) break;

    const byUser = new Map<string, EventRow[]>();
    for (const row of rows) {
      if (!row.user_id || !consented.has(row.user_id)) continue;
      const list = byUser.get(row.user_id) ?? [];
      list.push(row);
      byUser.set(row.user_id, list);
    }

    for (const [userId, userEvents] of byUser) {
      const signals = buildSignals(userId, userEvents, profileMap.get(userId));
      const result = computeAudienceProfile(signals);
      const impressions = userEvents.filter(
        (e) => e.event_category === "AD_INTERACTION" && e.event_name === "AD_IMPRESSION",
      ).length;
      const clicks = userEvents.filter(
        (e) => e.event_category === "AD_INTERACTION" && e.event_name === "AD_CLICK",
      ).length;

      const { error: upsertError } = await supabase.from("gf_user_audiences").upsert(
        {
          user_id: userId,
          commercial_segments: result.commercialSegments,
          purchasing_power_tier: result.purchasingPowerTier,
          last_active_phenology_stage: result.lastActivePhenologyStage,
          primary_interest_crop: result.primaryInterestCrop,
          total_ad_impressions: impressions,
          total_ad_clicks: clicks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (upsertError) {
        errors.push(`user ${userId}: ${upsertError.message}`);
      } else {
        processed += 1;
      }
    }

    offset += BATCH_SIZE;
    if (rows.length < BATCH_SIZE) break;
  }

  return { processed, errors };
}

function buildSignals(
  userId: string,
  events: EventRow[],
  profile?: { superficieM2?: number; phenologyStage?: string },
): AudienceSignals {
  const cropViews: Record<string, { views: number; totalDwellMs: number; maxScrollPercent: number }> = {};
  const commerceIntents: Array<Record<string, unknown>> = [];
  const fertilizanteSearches: string[] = [];
  let region: string | null = null;
  let comuna: string | null = null;

  for (const event of events) {
    if (event.region) region = event.region;
    if (event.comuna) comuna = event.comuna;

    if (event.event_category === "COMMERCE_INTENT") {
      const payload = event.payload ?? {};
      commerceIntents.push(payload);
      const marca = String(payload.marca ?? "");
      if (marca) fertilizanteSearches.push(marca);
    }

    if (event.especie_id) {
      const current = cropViews[event.especie_id] ?? { views: 0, totalDwellMs: 0, maxScrollPercent: 0 };
      current.views += 1;
      current.totalDwellMs += event.dwell_time_ms ?? 0;
      current.maxScrollPercent = Math.max(current.maxScrollPercent, event.scroll_depth_percent ?? 0);
      cropViews[event.especie_id] = current;
    }
  }

  return {
    userId,
    superficieM2: profile?.superficieM2,
    region,
    comuna,
    cropViews,
    commerceIntents,
    fertilizanteSearches,
    phenologyStage: profile?.phenologyStage,
  };
}