-- 0023: insights de decisión + media kit de venta (Fase 4).
-- Ambas plpgsql SECURITY DEFINER con guard is_admin() y EXECUTE revocado a anon.

-- =====================================================================
-- admin_insights_metrics(): funnel 30d, actividad semanal (8 semanas),
-- CTR por slot publicitario e interés por especie.
-- =====================================================================
create or replace function public.admin_insights_metrics()
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
    'funnel', json_build_object(
      'visitas_30d', (
        select count(distinct device_id)::int
        from public.gf_analytics_events
        where event_category = 'PRODUCT_USAGE'
          and event_name = 'PAGE_VIEW'
          and created_at > now() - interval '30 days'
      ),
      'registros_30d', (
        select count(*)::int
        from public.perfiles
        where created_at > now() - interval '30 days'
      ),
      'trial', (
        select count(*)::int from public.gf_subscriptions where status = 'trialing'
      ),
      'activos', (
        select count(*)::int from public.gf_subscriptions where status = 'active'
      )
    ),
    'semanas', (
      with fe as (
        select user_id, min(created_at) as f
        from public.gf_analytics_events
        where user_id is not null
        group by user_id
      ),
      evw as (
        select distinct user_id, date_trunc('week', created_at) as wk
        from public.gf_analytics_events
        where user_id is not null
          and created_at >= date_trunc('week', now()) - interval '7 weeks'
      )
      select coalesce(json_agg(row_to_json(s) order by s.wk), '[]'::json)
      from (
        select
          gs.wk,
          to_char(gs.wk, 'YYYY-MM-DD') as desde,
          count(distinct evw.user_id) filter (where fe.f >= gs.wk) as nuevos,
          count(distinct evw.user_id) filter (where fe.f < gs.wk) as retornados
        from generate_series(
          date_trunc('week', now()) - interval '7 weeks',
          date_trunc('week', now()),
          interval '7 days'
        ) as gs(wk)
        left join evw on evw.wk = gs.wk
        left join fe on fe.user_id = evw.user_id
        group by gs.wk
      ) s
    ),
    'ctr_slots', (
      select coalesce(json_agg(row_to_json(s) order by s.impresiones desc), '[]'::json)
      from (
        select
          ad_unit_id,
          count(*) filter (where event_name = 'AD_IMPRESSION')::int as impresiones,
          count(*) filter (where event_name = 'AD_CLICK')::int as clics,
          round(
            100.0 * count(*) filter (where event_name = 'AD_CLICK')
            / nullif(count(*) filter (where event_name = 'AD_IMPRESSION'), 0),
            2
          ) as ctr_pct
        from public.gf_analytics_events
        where event_category = 'AD_INTERACTION'
          and ad_unit_id is not null
        group by ad_unit_id
        having count(*) filter (where event_name = 'AD_IMPRESSION') > 0
        order by count(*) filter (where event_name = 'AD_IMPRESSION') desc
        limit 20
      ) s
    ),
    'intereses', (
      select coalesce(json_agg(row_to_json(s) order by s.eventos desc), '[]'::json)
      from (
        select especie_id, count(*)::int as eventos
        from public.gf_analytics_events
        where especie_id is not null
          and created_at > now() - interval '30 days'
        group by especie_id
        order by count(*) desc
        limit 10
      ) s
    )
  );
end;
$$;

-- =====================================================================
-- admin_media_kit(): segmentos agregados con k-anonymity >= 50.
-- Devuelve solo segmentos elegibles; también cuántos quedaron bajo umbral.
-- =====================================================================
create or replace function public.admin_media_kit()
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
    'generado', now()::text,
    'k_minimo', 50,
    'por_segmento', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select seg as etiqueta, count(*)::int as total
        from public.gf_user_audiences, unnest(commercial_segments) as seg
        group by seg
        having count(*) >= 50
      ) s
    ),
    'por_tier', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select purchasing_power_tier as etiqueta, count(*)::int as total
        from public.gf_user_audiences
        where purchasing_power_tier is not null
        group by purchasing_power_tier
        having count(*) >= 50
      ) s
    ),
    'por_especie', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select primary_interest_crop as etiqueta, count(*)::int as total
        from public.gf_user_audiences
        where primary_interest_crop is not null
        group by primary_interest_crop
        having count(*) >= 50
      ) s
    ),
    'por_region', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select p.region as etiqueta, count(*)::int as total
        from public.gf_user_audiences a
        join public.perfiles p on p.id = a.user_id
        group by p.region
        having count(*) >= 50
      ) s
    ),
    'bajo_umbral', (
      select (
        (select count(*) from (
          select seg from public.gf_user_audiences, unnest(commercial_segments) as seg
          group by seg having count(*) < 50
        ) x) +
        (select count(*) from (
          select purchasing_power_tier from public.gf_user_audiences
          where purchasing_power_tier is not null
          group by purchasing_power_tier having count(*) < 50
        ) x) +
        (select count(*) from (
          select primary_interest_crop from public.gf_user_audiences
          where primary_interest_crop is not null
          group by primary_interest_crop having count(*) < 50
        ) x) +
        (select count(*) from (
          select p.region from public.gf_user_audiences a
          join public.perfiles p on p.id = a.user_id
          group by p.region having count(*) < 50
        ) x)
      )::int
    )
  );
end;
$$;

revoke execute on function public.admin_insights_metrics() from anon;
revoke execute on function public.admin_media_kit() from anon;
