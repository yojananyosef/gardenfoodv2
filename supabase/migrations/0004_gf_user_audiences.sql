-- Task 1.3: Commercial audience profiles (the B2B data-brokerage product).
create table public.gf_user_audiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  commercial_segments text[],
  purchasing_power_tier text check (purchasing_power_tier in ('low', 'medium', 'high', 'commercial')),
  last_active_phenology_stage text,
  primary_interest_crop text,
  total_ad_impressions int default 0,
  total_ad_clicks int default 0,
  updated_at timestamptz default now()
);

-- Task 1.4: Segment array index.
create index idx_user_audiences_segments on public.gf_user_audiences using gin (commercial_segments);
create unique index idx_user_audiences_user on public.gf_user_audiences (user_id);