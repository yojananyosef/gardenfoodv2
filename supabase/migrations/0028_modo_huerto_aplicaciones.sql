-- 0028: modo de /huerto por usuario + registro de aplicaciones de cuidados
-- huerto_modo: preferencia de vista ('guiado' | 'modular'); null = usuario aún no elige.
-- asistente_completado_at: marca que el asistente de 4 pasos ya corrió (no se repite solo).
alter table public.perfiles
  add column if not exists huerto_modo text check (huerto_modo in ('guiado', 'modular')),
  add column if not exists asistente_completado_at timestamptz;

-- gf_aplicaciones: registro «Lo eché» por árbol o por especie (grupal)
create table if not exists public.gf_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  arbol_id uuid references public.gf_arboles(id) on delete cascade,
  especie text not null,
  territorio_huerto_id uuid references public.gf_huertos(id) on delete cascade,
  momento text not null,
  producto text not null,
  gramos numeric check (gramos >= 0),
  creado_en timestamptz not null default now()
);

create index if not exists gf_aplicaciones_user_idx on public.gf_aplicaciones (user_id);
create index if not exists gf_aplicaciones_user_fecha_idx on public.gf_aplicaciones (user_id, creado_en desc);

-- RLS: cada usuario le y escribe solo sus aplicaciones (los árboles/huertos referenciados ya son privados)
alter table public.gf_aplicaciones enable row level security;

drop policy if exists gf_aplicaciones_user_all on public.gf_aplicaciones;
create policy gf_aplicaciones_user_all
  on public.gf_aplicaciones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
