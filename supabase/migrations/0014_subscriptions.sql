-- Task 1.1: Tabla de suscripciones recurrentes (historial/auditoría).
-- Los tiers de plan ya existen en perfiles.plan: gratuito | huertero | cosecha | full | admin.
-- perfiles ya tiene subscription_id, subscription_status y payment_provider.

create table public.gf_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flow_customer_id text,
  flow_subscription_id text,
  plan text not null check (plan in ('huertero', 'cosecha', 'full')),
  interval text not null default 'monthly' check (interval in ('monthly', 'yearly')),
  status text not null default 'inactive'
    check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at timestamptz,
  paid_via text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_subscriptions_user on public.gf_subscriptions (user_id);
create index idx_subscriptions_flow_sub
  on public.gf_subscriptions (flow_subscription_id);

create trigger gf_subscriptions_set_updated_at
  before update on public.gf_subscriptions
  for each row
  execute function public.set_updated_at();

-- RLS: el dueño ve/modifica su suscripción; admin ve todas.
alter table public.gf_subscriptions enable row level security;

create policy "Users manage own subscription"
  on public.gf_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin read all subscriptions"
  on public.gf_subscriptions for select
  using (public.is_admin());
