-- 0024: gate de compartición en el media kit (ad-tech B-lite clean-room).
-- Los segmentos comercializables cuentan SOLO titulares cuya última elección
-- vigente tenga consent_third_party_sharing = true. Guard is_admin() + revoke anon.

create or replace function public.admin_media_kit()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resultado json;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'No autorizado: solo administradores';
  end if;

  with vigentes_comparticion as (
    select distinct on (user_id) user_id
    from public.gf_user_consents
    where user_id is not null
      and expires_at > now()
      and consent_third_party_sharing
    order by user_id, consent_timestamp desc
  )
  select json_build_object(
    'generado', now()::text,
    'k_minimo', 50,
    'por_segmento', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select seg as etiqueta, count(*)::int as total
        from public.gf_user_audiences a
        join public.vigentes_comparticion v on v.user_id = a.user_id,
             unnest(a.commercial_segments) as seg
        group by seg
        having count(*) >= 50
      ) s
    ),
    'por_tier', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select a.purchasing_power_tier as etiqueta, count(*)::int as total
        from public.gf_user_audiences a
        join public.vigentes_comparticion v on v.user_id = a.user_id
        where a.purchasing_power_tier is not null
        group by a.purchasing_power_tier
        having count(*) >= 50
      ) s
    ),
    'por_especie', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select a.primary_interest_crop as etiqueta, count(*)::int as total
        from public.gf_user_audiences a
        join public.vigentes_comparticion v on v.user_id = a.user_id
        where a.primary_interest_crop is not null
        group by a.primary_interest_crop
        having count(*) >= 50
      ) s
    ),
    'por_region', (
      select coalesce(json_agg(row_to_json(s) order by s.total desc), '[]'::json)
      from (
        select p.region as etiqueta, count(*)::int as total
        from public.gf_user_audiences a
        join public.perfiles p on p.id = a.user_id
        join public.vigentes_comparticion v on v.user_id = a.user_id
        group by p.region
        having count(*) >= 50
      ) s
    ),
    'bajo_umbral', (
      select (
        (select count(*) from (
          select seg from public.gf_user_audiences a
          join public.vigentes_comparticion v on v.user_id = a.user_id,
               unnest(a.commercial_segments) as seg
          group by seg having count(*) < 50
        ) x) +
        (select count(*) from (
          select a.purchasing_power_tier from public.gf_user_audiences a
          join public.vigentes_comparticion v on v.user_id = a.user_id
          where a.purchasing_power_tier is not null
          group by a.purchasing_power_tier having count(*) < 50
        ) x) +
        (select count(*) from (
          select a.primary_interest_crop from public.gf_user_audiences a
          join public.vigentes_comparticion v on v.user_id = a.user_id
          where a.primary_interest_crop is not null
          group by a.primary_interest_crop having count(*) < 50
        ) x) +
        (select count(*) from (
          select p.region from public.gf_user_audiences a
          join public.perfiles p on p.id = a.user_id
          join public.vigentes_comparticion v on v.user_id = a.user_id
          group by p.region having count(*) < 50
        ) x)
      )::int
    )
  )
  into resultado;

  return resultado;
end;
$$;

revoke execute on function public.admin_media_kit() from anon;
