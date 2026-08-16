-- Task 5.1: Admin-managed sponsorship configuration.
create table public.gf_sponsorships (
  id uuid primary key default gen_random_uuid(),
  ad_unit_id text not null,
  ad_partner_id text not null,
  screen text not null,
  title text not null,
  description text,
  cta_url text,
  cta_label text,
  image_url text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sponsorships_active on public.gf_sponsorships (active, screen, sort_order);

create trigger gf_sponsorships_set_updated_at
  before update on public.gf_sponsorships
  for each row
  execute function public.set_updated_at();