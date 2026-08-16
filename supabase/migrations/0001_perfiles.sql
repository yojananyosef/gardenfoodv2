-- Foundational user profile table (greenfield). Needed by RLS policies
-- that gate admin access to telemetry and audience data via perfiles.plan.
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text,
  region text not null,
  comuna text not null,
  zona_agroclimatica text not null,
  superficie_m2 numeric default 0,
  tipo_huerto text check (tipo_huerto in ('maceta', 'patio', 'parcela', 'invernadero')),
  plan text default 'gratuito' check (plan in ('gratuito', 'huertero', 'cosecha', 'full', 'admin')),
  payment_provider text check (payment_provider in ('flow', 'paypal')),
  subscription_id text,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger perfiles_set_updated_at
  before update on public.perfiles
  for each row
  execute function public.set_updated_at();