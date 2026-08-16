-- Task 1.1: CMP consent registry (IAB TCF-style, granular per purpose).
create table public.gf_user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  device_id text not null,
  consent_string text,
  consent_personalized_ads boolean default false,
  consent_precise_geo boolean default false,
  consent_third_party_sharing boolean default false,
  consent_device_linking boolean default false,
  legitimate_interest_opposed boolean default false,
  consent_timestamp timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '390 days'),
  ip_address text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_user_consents_user_device on public.gf_user_consents (user_id, device_id);

create trigger gf_user_consents_set_updated_at
  before update on public.gf_user_consents
  for each row
  execute function public.set_updated_at();