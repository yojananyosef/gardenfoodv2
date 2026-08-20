-- Store the audience-refresh runtime config in the table instead of custom GUCs.
--
-- Supabase blocks `ALTER DATABASE ... SET app.*` (permission denied), so the
-- GUC-based approach from 0011 cannot be used. We keep the secret and the app
-- base URL out of version control by writing them into gf_cron_config at deploy
-- time via an UPDATE, not via this migration:
--
--   update public.gf_cron_config
--     set app_base_url = 'https://<tu-app-desplegada>',
--         cron_secret = '<CRON_SECRET>'
--   where id = true;
--
-- The single config row already exists (created by 0007/0009). We only add the
-- columns and point the scheduled job at the Route Handler, reading the URL and
-- secret from the row at execution time.

alter table public.gf_cron_config
  add column if not exists app_base_url text not null default '',
  add column if not exists cron_secret text not null default '';

-- Make sure the endpoint path is the real Route Handler.
update public.gf_cron_config
  set refresh_endpoint = '/api/v1/admin/audiences/refresh'
where id = true;

-- Reschedule: empty app_base_url => no-op (safe until configured).
select cron.unschedule('refresh-audience-profiles');

select cron.schedule(
  'refresh-audience-profiles',
  '0 */6 * * *',
  $$
    select net.http_post(
      url := (cfg.app_base_url || cfg.refresh_endpoint),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cfg.cron_secret
      ),
      body := '{}'
    )
    from public.gf_cron_config cfg
    where cfg.id = true
      and cfg.app_base_url <> '';
  $$
);
