-- Task 1.2: High-volume telemetry event store (AdTech metrics + hybrid geo).
create table public.gf_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null,
  device_id text not null,
  event_category text not null,
  event_name text not null,
  comuna text,
  region text,
  zona_agroclimatica text,
  gps_lat numeric(9, 6),
  gps_lng numeric(9, 6),
  gps_accuracy_meters numeric,
  especie_id text,
  dwell_time_ms int,
  scroll_depth_percent int,
  ad_unit_id text,
  ad_partner_id text,
  payload jsonb default '{}'::jsonb,
  device_metadata jsonb default '{}'::jsonb,
  client_timestamp timestamptz not null,
  created_at timestamptz default now()
);

-- Task 1.4: Analytical indexes.
create index idx_events_adtech on public.gf_analytics_events (event_category, event_name, ad_unit_id);
create index idx_events_geo_advanced on public.gf_analytics_events (region, comuna, gps_lat, gps_lng);
create index idx_events_payload_gin on public.gf_analytics_events using gin (payload);
create index idx_events_user_time on public.gf_analytics_events (user_id, client_timestamp);