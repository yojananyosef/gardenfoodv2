-- P0 security hardening (change: harden-payments-and-rls).
--
-- 1) perfiles: users with an authenticated JWT can no longer change their own
--    plan/subscription columns (the "Users own profile" FOR ALL policy allowed
--    self-service escalation to plan='admin', which isAdmin() trusts). Service
--    role (webhooks, admin API, payment routes) and direct DB access have
--    auth.uid() = null and are exempt.
-- 2) gf_analytics_events: open insert was WITH CHECK (true), letting anyone
--    attribute events to arbitrary user_id and poison audience signals.
-- 3) gf_sponsorships: public read was USING (true), exposing unpaid rows with
--    amount/provider_token to the anon key.
-- 4) gf_user_consents: the anonymous policy (USING user_id is null) let any
--    anon-key client read/update/delete every anonymous consent row including
--    ip_address/user_agent. Consent writes are server-mediated via the
--    service-role route, so anonymous direct access is removed.

create or replace function public.bloquea_cambio_plan_perfiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.plan is distinct from old.plan
    or new.subscription_status is distinct from old.subscription_status
    or new.subscription_id is distinct from old.subscription_id
    or new.payment_provider is distinct from old.payment_provider then
    raise exception 'Las columnas de plan y suscripcion solo pueden cambiar via servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists guarda_columnas_plan_perfiles on public.perfiles;
create trigger guarda_columnas_plan_perfiles
  before update on public.perfiles
  for each row
  execute function public.bloquea_cambio_plan_perfiles();

drop policy if exists "Open insert telemetry" on public.gf_analytics_events;
create policy "Insert telemetry device or self"
  on public.gf_analytics_events for insert
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Public read active sponsorships" on public.gf_sponsorships;
create policy "Public read paid active sponsorships"
  on public.gf_sponsorships for select
  using (payment_status = 'paid' and active = true);

drop policy if exists "Anonymous device consent" on public.gf_user_consents;
