-- Task 1.5 hardening: enable RLS on gf_cron_config.
-- The original migration disabled RLS "by design", but the only reader is the
-- pg_cron job, which runs as the postgres superuser and bypasses RLS anyway.
-- Enabling RLS removes the security-linter ERROR without changing behavior.

alter table public.gf_cron_config enable row level security;