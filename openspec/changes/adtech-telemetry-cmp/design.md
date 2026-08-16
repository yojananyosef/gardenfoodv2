## Context

Greenfield Next.js 16.3.1 / TypeScript strict / Tailwind v4.3 / shadcn/ui / Supabase PostgreSQL platform. See proposal.md — Why for motivation. The existing domain (profiles, crops, tasks, harvests) is not yet in the openspec specs; this change introduces the ad-tech layer: CMP consent, telemetry engine, audience profiling and ad inventory. Supabase Auth is the identity source; RLS is the access-control mechanism; the client is mobile-first (PWA) with a future React Native app consuming the same `/api/v1` contract.

## Goals / Non-Goals

**Goals:**
- A telemetry pipeline that never blocks the UI (sendBeacon/keepalive) and survives page unload
- Consent as a hard gate: no telemetry, no GPS, no ad attribution without valid, granular consent
- Automated audience profiling that runs server-side on a schedule, not per-request
- Ad inventory that works with internal sponsorships today and real ad networks later (pluggable `ad_partner_id`)
- RLS policies that keep regular users isolated and give admins read access to telemetry and audiences

**Non-Goals:**
- Payments (Flow.cl / PayPal) — planned separately
- Real ad-network SDKs / RTB bidding — only the pluggable contract and admin-managed sponsorships
- A full data-brokerage sales interface (contracts, invoicing) — only the audience explorer
- Analytics dashboards beyond the admin cohort explorer and basic ad metrics

## Decisions

**D1 — Three-table schema, no denormalization of telemetry**
`gf_analytics_events` keeps raw events; `gf_user_consents` keeps the legal record; `gf_user_audiences` keeps derived profiles. Audience profiles are a materialized projection computed from events, never written per-request.
- Rationale: raw events stay append-only for ad attribution and audit; profiles stay small and queryable for B2B exploration.
- Alternative considered: writing segments at event time — rejected: couples ingestion to rule logic and slows the hot path.

**D2 — Consent string stored but not full IAB TCF binary encoding**
`consent_string` stores a TCF-style encoded string for future ad-exchange handoffs, but the source of truth is the granular boolean columns (personalized ads, precise geo, third-party sharing, device linking, legitimate-interest opposition).
- Rationale: full TCF 2.0 requires a registered CMP and vendor list; the platform has no ad partners yet. Booleans are auditable and queryable now; the string is forward-compatible.
- Alternative considered: implementing full TCF 2.0 with vendor list — rejected: no real ad network integration in scope.

**D3 — Consent token on the client: cookie + localStorage, 390 days**
A signed-ish token (user_id + consent version + expiry) stored in a secure, SameSite cookie and mirrored in localStorage; the CMP modal reads it before showing. Server upsert on `/api/v1/cmp/consent` is authoritative.
- Rationale: returning visitors skip the prompt (Fastic growth loop), while the server record remains the legal source of truth.
- Alternative considered: server-only checks — rejected: adds a round trip per page and re-prompts on every visit.

**D4 — Telemetry endpoint accepts open writes, RLS restricts reads**
`/api/v1/telemetry` validates shape with Zod and inserts with `WITH CHECK (true)` (see D7 for how users are still attributed); reads require the admin plan via a RLS policy on `perfiles`.
- Rationale: high-volume, unauthenticated-safe ingestion without auth round trips; privacy is enforced by never ingesting from non-consented users (client gate) and by admin-only read.

**D5 — Client-side telemetry tracker with batching**
`lib/telemetry/tracker.ts` buffers events, flushes on interval (e.g., 10s) or `visibilitychange`/`pagehide` via `sendBeacon`, falls back to `fetch(keepalive)`. Dwell time measured via IntersectionObserver + timestamps; scroll depth via scroll events; GPS via `navigator.geolocation` only when consent granted, cached per session.
- Rationale: batching cuts request volume; beacon guarantees delivery at unload without blocking the main thread.
- Alternative considered: sending one request per event — rejected: high volume and unload loss.

**D6 — Audience rules engine as a pure function + scheduled refresh**
`lib/telemetry/audiences.ts` exports pure rules (signal → segment/tier) applied by a scheduled server job (e.g., Supabase cron via pg_cron or a server action / edge function) that re-evaluates recent events per user and upserts profiles.
- Rationale: deterministic, testable rules; periodic refresh keeps profiles fresh without hot-path coupling.

**D7 — RLS split: open insert + admin read on events; admin-only on audiences**
- `gf_analytics_events`: `FOR INSERT WITH CHECK (true)`; `FOR SELECT` only when `perfiles.plan = 'admin'`.
- `gf_user_audiences`: admin-only `ALL`.
- `gf_user_consents`: user owns own rows; admin read-all.
- User attribution happens client-side (user_id from auth) and via `device_id`; anonymous/non-consented sessions never send events (D5 gate).
- Rationale: keeps ingestion fast while protecting stored data.

**D8 — Consent gating lives in the tracker and the modal, not only in the DB**
The tracker checks the local consent token before emitting; the modal gates onboarding; the server re-checks consent expiry at upsert time.
- Rationale: defense in depth — cheap client gate for volume, server check for correctness.

**D9 — Ad components with a shared tracking hook**
`NativeAdSlot` and `SponsoredBanner` share a `useAdTracking` hook (IntersectionObserver → impression once per view, click handler → `AD_CLICK`). Sponsorships configured in a new `gf_sponsorships` admin table (ad_unit_id, ad_partner_id, screen, active) served to the app via a server component query.
- Rationale: single tracking contract (D5), admin-managed without deploys.

## Risks / Trade-offs

- [Privacy compliance liability (GDPR / Chilean Data Law) if consent gating fails] → Mitigation: server-side consent expiry check at upsert, RLS admin-only reads, consent audit trail (`consent_timestamp`, `ip_address`, `user_agent`), and a documented retention policy.
- [Telemetry volume grows unbounded] → Mitigation: append-only events table with composite analytical indexes; batch flush; partition or archive strategy deferred to operations (open question).
- [GPS consent but inaccurate coords] → Mitigation: record `gps_accuracy_meters` and treat accuracy > 500 m as unusable for micro-targeting; fall back to comuna/IP.
- [Fingerprinting + cross-device linking perceived as hostile by users / app stores] → Mitigation: consent-gated device linking purpose, clear preferences panel, honest copy in the persuasive modal.
- [Admin read policy depends on `perfiles.plan`] → Mitigation: join via `auth.uid()`; admins are provisioned in `perfiles`; keep the policy as a single source of truth.
- [Audience profiling rules drift from reality] → Mitigation: rules are pure and unit-tested; counters and segments auditable against raw events.

## Migration Plan

1. Deploy SQL migration (3 new tables + indexes + RLS policies) — additive only, no changes to existing tables; safe to apply before any app code ships.
2. Ship client telemetry + consent components behind feature flag if desired (no events are emitted without consent, so partial rollout is safe).
3. Rollback: drop tables/indexes or keep data inert; client code removes the tracker provider; no existing features depend on this layer.

## Open Questions

- Retention/archival strategy for `gf_analytics_events` (partitioning vs. periodic archive) — can be decided at ops time without changing specs or design.
- Whether real ad-network integration (e.g., a TCF-registered CMP vendor list) will follow — the consent-string column and `ad_partner_id` contract are designed to absorb it.
- Exact sponsorship model fields (budget, schedule, targeting) — the explorer and slot contract are agnostic to these.