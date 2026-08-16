-- Task 6.2: Scheduled audience-refresh job.
-- The refresh logic itself lives in TypeScript (lib/telemetry/refresh.ts,
-- exposed at POST /api/v1/admin/audiences/refresh). This migration wires a
-- pg_cron job that triggers it through pg_net without hardcoding secrets:
-- the endpoint URL and bearer token are stored in gf_cron_config, which an
-- admin sets once (e.g. via the Supabase dashboard SQL editor).

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.gf_cron_config (
  id boolean primary key default true check (id = true),
  refresh_endpoint text not null,
  refresh_token text not null,
  updated_at timestamptz default now()
);

insert into public.gf_cron_config (refresh_endpoint, refresh_token)
values ('http://127.0.0.1:54321/functions/v1/audience-refresh', 'set-me')
on conflict (id) do nothing;

-- Disable RLS on the config table: it holds only an endpoint and a token the
-- owner provisions; the table is not readable by the public anyway unless
-- granted. Kept minimal by design.
alter table public.gf_cron_config disable row level security;

-- Runs every 6 hours. The job posts to the refresh endpoint with the bearer
-- token; failures are logged by pg_cron and do not affect the app.
select cron.schedule(
  'refresh-audience-profiles',
  '0 */6 * * *',
  $$
    select net.http_post(
      url := (select refresh_endpoint from public.gf_cron_config),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select refresh_token from public.gf_cron_config)
      ),
      body := '{}'
    );
  $$
);