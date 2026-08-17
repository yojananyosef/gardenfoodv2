-- gf_cultivos: cultivos del huerto del usuario
create table if not exists public.gf_cultivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  especie text not null,
  cantidad integer not null default 1 check (cantidad >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists gf_cultivos_user_especie_unique
  on public.gf_cultivos (user_id, especie);
create index if not exists gf_cultivos_user_idx on public.gf_cultivos (user_id);

-- gf_tareas: tareas del calendario
create table if not exists public.gf_tareas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  especie text,
  tipo text not null check (tipo in ('riego', 'nutricion', 'sanidad', 'personalizada')),
  texto text not null,
  origen_id text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'completada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gf_tareas_user_fecha_idx on public.gf_tareas (user_id, fecha);
create index if not exists gf_tareas_user_estado_idx on public.gf_tareas (user_id, estado);

-- gf_registro: bitácora de cosechas
create table if not exists public.gf_registro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha timestamptz not null default now(),
  especie text not null,
  nota text,
  produccion_kg numeric check (produccion_kg >= 0),
  created_at timestamptz not null default now()
);

create index if not exists gf_registro_user_fecha_idx on public.gf_registro (user_id, fecha desc);

-- gf_arboles: árboles individuales
create table if not exists public.gf_arboles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  especie text not null,
  cantidad integer not null default 1 check (cantidad >= 1),
  fecha_plantacion date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gf_arboles_user_idx on public.gf_arboles (user_id);

-- RLS: los usuarios administran sus propios datos
alter table public.gf_cultivos enable row level security;
alter table public.gf_tareas enable row level security;
alter table public.gf_registro enable row level security;
alter table public.gf_arboles enable row level security;

drop policy if exists "Users manage their cultivos" on public.gf_cultivos;
create policy "Users manage their cultivos" on public.gf_cultivos
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their tareas" on public.gf_tareas;
create policy "Users manage their tareas" on public.gf_tareas
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their registro" on public.gf_registro;
create policy "Users manage their registro" on public.gf_registro
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their arboles" on public.gf_arboles;
create policy "Users manage their arboles" on public.gf_arboles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- triggers para updated_at (la función set_updated_at ya existe desde 0001)
drop trigger if exists gf_cultivos_set_updated_at on public.gf_cultivos;
create trigger gf_cultivos_set_updated_at before update on public.gf_cultivos
  for each row execute function public.set_updated_at();

drop trigger if exists gf_tareas_set_updated_at on public.gf_tareas;
create trigger gf_tareas_set_updated_at before update on public.gf_tareas
  for each row execute function public.set_updated_at();

drop trigger if exists gf_arboles_set_updated_at on public.gf_arboles;
create trigger gf_arboles_set_updated_at before update on public.gf_arboles
  for each row execute function public.set_updated_at();