-- 0029_fertilizacion.sql — generado por scripts/fertilizacion_seed.py
-- NO EDITAR A MANO: regenerar con  python3 scripts/fertilizacion_seed.py
-- Fuente: GARDENFOOD_Guia_Fertilizacion_Casera.xlsx (INIA, Hirzel y Hepp,
-- Boletín INIA N° 426, cuadros 3.5-3.8; INIA 2013 olivo; INIA 2014 lib N° 31).
-- Datos: supabase/fertilizacion_seed.json, aplicados con scripts/fertilizacion_push.mjs.

create table if not exists public.gf_fertilizacion_fertilizantes (
  producto text primary key,
  etiqueta text,
  n_pct numeric,
  p_pct numeric,
  k_pct numeric,
  ca_pct numeric,
  mg_pct numeric,
  gramos_cucharada numeric,
  se_reparte text,
  consejo text
);

create table if not exists public.gf_fertilizacion_fenologia (
  especie text not null,
  region_guia text not null,
  se_cultiva boolean not null default true,
  brota text,
  florece text,
  cosecha text,
  m_despierta text,
  m_engorda text,
  m_recupera text,
  veces_suelo integer,
  veces_goteo integer,
  nota text,
  primary key (especie, region_guia)
);

create table if not exists public.gf_fertilizacion_cosecha_tipica (
  especie text primary key,
  cosecha_kg_adulto numeric not null
);

create table if not exists public.gf_fertilizacion_programa (
  especie text not null,
  region_guia text not null,
  metodo text not null check (metodo in ('suelo', 'goteo')),
  orden integer not null check (orden between 0 and 2),
  momento text not null,
  meses text not null,
  veces integer not null check (veces >= 1),
  cada_dias integer not null check (cada_dias between 1 and 60),
  detalle jsonb not null,
  primary key (especie, region_guia, metodo, orden)
);
create index if not exists gf_fertilizacion_programa_idx
  on public.gf_fertilizacion_programa (especie, region_guia, metodo);

-- Contenido compartido: lectura pública, sin escritura de usuarios.
alter table public.gf_fertilizacion_fertilizantes enable row level security;
alter table public.gf_fertilizacion_fenologia enable row level security;
alter table public.gf_fertilizacion_cosecha_tipica enable row level security;
alter table public.gf_fertilizacion_programa enable row level security;

drop policy if exists gf_fertilizacion_lectura_publica on public.gf_fertilizacion_fertilizantes;
create policy gf_fertilizacion_lectura_publica on public.gf_fertilizacion_fertilizantes for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_fenologia_lectura_publica on public.gf_fertilizacion_fenologia;
create policy gf_fertilizacion_fenologia_lectura_publica on public.gf_fertilizacion_fenologia for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_cosecha_lectura_publica on public.gf_fertilizacion_cosecha_tipica;
create policy gf_fertilizacion_cosecha_lectura_publica on public.gf_fertilizacion_cosecha_tipica for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_programa_lectura_publica on public.gf_fertilizacion_programa;
create policy gf_fertilizacion_programa_lectura_publica on public.gf_fertilizacion_programa for select to anon, authenticated using (true);

comment on table public.gf_fertilizacion_programa is
  'Programa de fertilización casera por especie/región/método de riego. Fuente: xlsx socio, base INIA Boletín 426 (Hirzel y Hepp). Dosis para planta adulta; ajuste por edad en lib/agronomy/medidasCaseras.ts';
