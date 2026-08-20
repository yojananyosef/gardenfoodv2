-- Rebrand payment columns from Flow-specific to provider-agnostic (Mercado Pago).
-- We are dropping Flow entirely and using Mercado Pago as the single provider.

-- gf_sponsorships
alter table public.gf_sponsorships rename column flow_token to provider_token;
alter table public.gf_sponsorships rename column flow_payment_id to provider_payment_id;

drop index if exists idx_sponsorships_flow_token;
create index if not exists idx_sponsorships_provider_token
  on public.gf_sponsorships (provider_token);

-- gf_subscriptions
alter table public.gf_subscriptions rename column flow_customer_id to provider_customer_id;
alter table public.gf_subscriptions rename column flow_subscription_id to provider_subscription_id;

drop index if exists idx_subscriptions_flow_sub;
create index if not exists idx_subscriptions_provider_sub
  on public.gf_subscriptions (provider_subscription_id);

-- perfiles.payment_provider now only allows mercadopago
alter table public.perfiles drop constraint if exists perfiles_payment_provider_check;
alter table public.perfiles add constraint perfiles_payment_provider_check
  check (payment_provider in ('mercadopago'));

-- Catalog of provider plan ids (Mercado Pago preapproval_plan) per tier+interval.
create table public.gf_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  tier text not null,
  interval text not null,
  provider_plan_id text not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (provider, tier, interval)
);

alter table public.gf_subscription_plans enable row level security;

create policy "Read subscription plans"
  on public.gf_subscription_plans for select
  using (true);
