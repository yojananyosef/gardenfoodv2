-- gf_huertos: huertos delimitados en el mapa (un registro por polígono).
-- Reemplaza el modelo de un solo terreno (perfiles.terreno_geojson, 0017):
-- cada polígono dibujado en /perfil es un huerto con nombre y superficie.

create table if not exists public.gf_huertos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null default 'Mi huerto'
    check (length(btrim(nombre)) between 1 and 60),
  terreno_geojson jsonb
    check (terreno_geojson is null or jsonb_typeof(terreno_geojson) = 'object'),
  superficie_m2 numeric not null default 0 check (superficie_m2 >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gf_huertos_user_idx on public.gf_huertos (user_id);

comment on column public.gf_huertos.terreno_geojson is
  'Feature GeoJSON {type, properties, geometry:{type:"Polygon", coordinates}} del huerto. Validado en aplicación (Zod); check jsonb solo como última línea de defensa.';

-- RLS: los usuarios administran sus propios huertos
alter table public.gf_huertos enable row level security;

drop policy if exists "Users manage their huertos" on public.gf_huertos;
create policy "Users manage their huertos" on public.gf_huertos
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trigger para updated_at (la función set_updated_at ya existe desde 0001)
drop trigger if exists gf_huertos_set_updated_at on public.gf_huertos;
create trigger gf_huertos_set_updated_at before update on public.gf_huertos
  for each row execute function public.set_updated_at();

-- Migración de datos: el terreno único del perfil se convierte en el primer huerto.
-- perfiles.terreno_geojson se conserva (queda deprecado, ya no lo lee la app)
-- para permitir rollback del deploy de código sin perder datos.
insert into public.gf_huertos (user_id, nombre, terreno_geojson, superficie_m2)
select p.id, 'Mi huerto', p.terreno_geojson, p.superficie_m2
from public.perfiles p
where p.terreno_geojson is not null
  and not exists (select 1 from public.gf_huertos h where h.user_id = p.id);

comment on column public.perfiles.terreno_geojson is
  'DEPRECATED: la app ya no lee ni escribe esta columna; usar gf_huertos.terreno_geojson. Se conserva con datos como respaldo de la migración.';

comment on column public.perfiles.superficie_m2 is
  'Suma de las superficies de los huertos del usuario (gf_huertos); la mantienen sincronizada las server actions de huertos. La consume telemetría/audiencias.';
