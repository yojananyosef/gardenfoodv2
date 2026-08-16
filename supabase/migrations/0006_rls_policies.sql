-- Task 1.5: RLS policies.
-- Model: user-own rows for consents; open telemetry insert with admin-only
-- read; admin-only audiences; public read of active sponsorships with
-- admin-only writes.

alter table public.perfiles enable row level security;
alter table public.gf_user_consents enable row level security;
alter table public.gf_analytics_events enable row level security;
alter table public.gf_user_audiences enable row level security;
alter table public.gf_sponsorships enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and plan = 'admin'
  );
$$;

-- perfiles: users own their own profile.
create policy "Users own profile"
  on public.perfiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- consents: users own their own rows; admins may read all.
create policy "Users own consents"
  on public.gf_user_consents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin read all consents"
  on public.gf_user_consents for select
  using (public.is_admin());

-- telemetry: open insert, admin-only read.
create policy "Open insert telemetry"
  on public.gf_analytics_events for insert
  with check (true);

create policy "Admin read all telemetry"
  on public.gf_analytics_events for select
  using (public.is_admin());

-- audiences: admin-only (system rules engine also runs with elevated rights).
create policy "Admin manage audiences"
  on public.gf_user_audiences for all
  using (public.is_admin())
  with check (public.is_admin());

-- sponsorships: everyone can read active units; admins manage them.
create policy "Public read active sponsorships"
  on public.gf_sponsorships for select
  using (true);

create policy "Admin manage sponsorships"
  on public.gf_sponsorships for all
  using (public.is_admin())
  with check (public.is_admin());