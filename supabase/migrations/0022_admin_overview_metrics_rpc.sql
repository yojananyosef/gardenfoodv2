-- 0022: métricas de overview admin agregadas en SQL (una ida, sin full-table scans en JS).
-- Guard is_admin() dentro (SECURITY DEFINER) + EXECUTE revocado a anon.

create or replace function public.admin_overview_metrics()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'No autorizado: solo administradores';
  end if;

  return json_build_object(
    'total_usuarios', (select count(*)::int from public.perfiles),
    'gratuitos', (select count(*)::int from public.perfiles where plan = 'gratuito'),
    'subs_por_estado', (
      select coalesce(json_agg(row_to_json(s)), '[]'::json)
      from (
        select status, count(*)::int as total
        from public.gf_subscriptions
        group by status
      ) s
    ),
    'subs_activas_por_plan', (
      select coalesce(json_agg(row_to_json(s)), '[]'::json)
      from (
        select plan, interval, count(*)::int as total
        from public.gf_subscriptions
        where status = 'active'
        group by plan, interval
      ) s
    ),
    'activos_30d', (
      select count(distinct user_id)::int
      from public.gf_analytics_events
      where created_at > now() - interval '30 days'
        and user_id is not null
    ),
    'eventos_24h', (
      select count(*)::int
      from public.gf_analytics_events
      where created_at > now() - interval '24 hours'
    ),
    'top_comunas', (
      select coalesce(json_agg(row_to_json(s)), '[]'::json)
      from (
        select p.comuna, count(*)::int as total
        from public.gf_cultivos c
        join public.perfiles p on p.id = c.user_id
        where p.comuna is not null
        group by p.comuna
        order by count(*) desc
        limit 10
      ) s
    ),
    'ultima_sincronizacion', (select max(updated_at)::text from public.gf_subscriptions)
  );
end;
$$;

revoke execute on function public.admin_overview_metrics() from anon;
