-- NOTE: this migration originally pointed the job at GUCs (app.gf_app_url /
-- app.gf_cron_secret), but Supabase blocks `ALTER DATABASE ... SET app.*`
-- (permission denied). 0012_cron_config_in_table.sql supersedes this: it stores
-- app_base_url and cron_secret in gf_cron_config and the job reads them from the
-- row. The app base URL and cron secret are set at deploy time via an UPDATE,
-- never hardcoded here, e.g.:
--   update public.gf_cron_config
--     set app_base_url = 'https://<tu-app-desplegada>',
--         cron_secret = '<CRON_SECRET>'
--   where id = true;

-- Keep the config row documented; the cron job below resolves the real values
-- from the deploy GUCs rather than from this static text.
update public.gf_cron_config
  set refresh_endpoint = '/api/v1/admin/audiences/refresh',
      refresh_token = ''
where id = true;

select cron.unschedule('refresh-audience-profiles');

select cron.schedule(
  'refresh-audience-profiles',
  '0 */6 * * *',
  $$
    select net.http_post(
      url := (coalesce(current_setting('app.gf_app_url', true), '') || '/api/v1/admin/audiences/refresh'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(current_setting('app.gf_cron_secret', true), '')
      ),
      body := '{}'
    );
  $$
);
