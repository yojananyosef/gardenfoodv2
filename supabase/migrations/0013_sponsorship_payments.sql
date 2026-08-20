-- Payment support for sponsorships (Flow.cl).
-- The app has two business models: (1) app usage via subscription and
-- (2) sponsorships + user-data brokering. This migration adds the payment
-- columns to gf_sponsorships so a slot can be paid via Flow and activated
-- only after a confirmed payment. A future change adds subscriptions.
alter table public.gf_sponsorships
  add column if not exists amount numeric(12, 2) not null default 0,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists flow_token text,
  add column if not exists flow_payment_id text,
  add column if not exists paid_at timestamptz;

create index if not exists idx_sponsorships_flow_token
  on public.gf_sponsorships (flow_token);

-- payment_status domain note (documentation only, not a CHECK to stay flexible):
--   'unpaid'  -> never paid
--   'pending' -> Flow order created, awaiting confirmation
--   'paid'    -> confirmed by Flow webhook, slot activated
--   'failed'  -> Flow reported a failed/expired payment
