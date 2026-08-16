import { NextResponse } from "next/server";
import { telemetryBatchSchema } from "@/lib/telemetry/schemas";
import { resolveIpGeo } from "@/lib/telemetry/ipgeo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = telemetryBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid telemetry payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ipGeo =
    ipAddress &&
    parsed.data.events.some((event) => !event.geo?.comuna && !event.geo?.region)
      ? await resolveIpGeo(ipAddress)
      : null;

  const rows = parsed.data.events.map((event) => ({
    user_id: user?.id ?? null,
    session_id: event.sessionId,
    device_id: event.deviceId,
    event_category: event.category,
    event_name: event.name,
    comuna: event.geo?.comuna ?? ipGeo?.comuna ?? null,
    region: event.geo?.region ?? ipGeo?.region ?? null,
    zona_agroclimatica: event.geo?.zonaAgroclimatica ?? null,
    gps_lat: event.geo?.gpsLat ?? null,
    gps_lng: event.geo?.gpsLng ?? null,
    gps_accuracy_meters: event.geo?.gpsAccuracyMeters ?? null,
    especie_id: event.especieId ?? null,
    dwell_time_ms: event.dwellTimeMs ?? null,
    scroll_depth_percent: event.scrollDepthPercent ?? null,
    ad_unit_id: event.adUnitId ?? null,
    ad_partner_id: event.adPartnerId ?? null,
    payload: (event.payload ?? {}) as Record<string, unknown>,
    device_metadata: (event.deviceMetadata ?? {}) as Record<string, unknown>,
    client_timestamp: event.clientTimestamp,
  }));

  const { error } = await supabase.from("gf_analytics_events").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ingested: rows.length });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(request.headers.get("x-limit") ?? 50), 1), 500);
  const { data, error } = await supabase
    .from("gf_analytics_events")
    .select("*")
    .order("client_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}