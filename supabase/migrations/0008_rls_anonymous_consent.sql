-- Task 1.5 fix: anonymous (device-scoped) consent.
-- The consent registry supports device-scoped rows with user_id NULL so the
-- CMP can record consent during onboarding before an email-verified session
-- exists. The default policy "Users own consents" only matches authenticated
-- users, so anonymous rows need their own policies.

create policy "Anonymous device consent"
  on public.gf_user_consents for all
  using (user_id is null)
  with check (user_id is null);

-- Enforce a single consent row per anonymous device (the composite unique
-- index treats NULL user_id as distinct, which would allow duplicates).
create unique index idx_user_consents_anonymous_device
  on public.gf_user_consents (device_id)
  where user_id is null;