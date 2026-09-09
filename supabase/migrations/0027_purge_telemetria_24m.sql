-- 0027: purge automático de telemetría a 24 meses (Ley 21.719, minimización).
-- La política pública promete retención de 24 meses: este job la ejecuta.
-- Borrado por lotes (sin locks largos), índice de created_at, superficie mínima.

create index if not exists idx_events_created_at
  on public.gf_analytics_events (created_at);

create or replace function public.purga_eventos_telemetria(
  p_meses int default 24,
  p_lote int default 10000
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  total int := 0;
  borrados int;
begin
  loop
    with victimas as (
      select id
      from public.gf_analytics_events
      where created_at < now() - make_interval(months => p_meses)
      limit p_lote
    )
    delete from public.gf_analytics_events e
    using victimas v
    where e.id = v.id;
    get diagnostics borrados = row_count;
    total := total + borrados;
    exit when borrados < p_lote;
  end loop;
  return total;
end;
$$;

revoke execute on function public.purga_eventos_telemetria(int, int)
  from anon, authenticated, public;

-- pg_cron 1.x lanza excepción si el job no existe: desprogramar solo si está.
select cron.unschedule(jobid) from cron.job where jobname = 'purga-telemetria-24m';

select cron.schedule(
  'purga-telemetria-24m',
  '30 6 * * *',
  $$
    select public.purga_eventos_telemetria();
  $$
);
