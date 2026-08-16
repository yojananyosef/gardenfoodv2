## 1. Database Schema & Migrations

- [x] 1.1 Create SQL migration for `gf_user_consents` (per-purpose booleans, consent_string, 390-day expiry via `NOW() + INTERVAL '390 days'`, consent_timestamp, ip_address, user_agent, device_id, FK to auth.users)
- [x] 1.2 Create SQL migration for `gf_analytics_events` (event_category/event_name, session_id, device_id, comuna/region/zona_agroclimatica, gps_lat/lng/accuracy, especie_id, dwell_time_ms, scroll_depth_percent, ad_unit_id, ad_partner_id, payload JSONB, device_metadata JSONB, client_timestamp, FK to auth.users ON DELETE SET NULL)
- [x] 1.3 Create SQL migration for `gf_user_audiences` (commercial_segments TEXT[], purchasing_power_tier CHECK, last_active_phenology_stage, primary_interest_crop, total_ad_impressions, total_ad_clicks, updated_at, FK to auth.users)
- [x] 1.4 Add analytical indexes: `idx_events_adtech`, `idx_events_geo_advanced`, `idx_events_payload_gin`, `idx_user_audiences_segments`
- [x] 1.5 Enable RLS and add policies: user-own consents, open-insert telemetry with admin-read (`perfiles.plan = 'admin'`), admin-only audiences
- [x] 1.6 Apply migrations to Supabase and verify with a smoke query  <!-- Applied: project ayhpmsocohrorabvrmow (sa-east-1, Free). 6 tables + pg_cron job 'refresh-audience-profiles' verified. -->

## 2. Shared Types & Consent Contracts

- [x] 2.1 Add TypeScript contracts to `types/index.ts`: `ConsentRecord`, `ConsentUpdate`, `TelemetryEvent`, `TelemetryEventCategory/Name` unions, `AudienceProfile`, `DeviceMetadata`
- [x] 2.2 Add Zod schemas for consent updates and telemetry events (strict, no `any`)
- [x] 2.3 Create `lib/consent/token.ts` for reading/writing the local consent token (secure SameSite cookie + localStorage, 390-day expiry, consent version)

## 3. Consent API & UI (CMP)

- [x] 3.1 Implement `app/api/v1/cmp/consent/route.ts`: Zod-validated upsert of consent per user+device, server-side expiry check, returns canonical consent state
- [x] 3.2 Build `components/cmp/ConsentModal.tsx`: persuasive onboarding modal with motivational copy, dominant green "Consentir y Comenzar" primary button, discreet "Gestionar opciones" secondary link
- [x] 3.3 Build `components/cmp/ConsentPreferences.tsx`: detailed panel with per-purpose and per-partner switches, confirm button, immediate persistence via the consent API
- [x] 3.4 Wire the consent flow into the registration flow: show modal, block onboarding until a choice is made, persist token locally and server-side
- [x] 3.5 Add "Ajustes de privacidad" entry in the profile page to reopen ConsentPreferences at any time (changes apply immediately)

## 4. Telemetry Engine

- [x] 4.1 Implement `lib/telemetry/tracker.ts`: non-blocking capture engine — event buffer, 10s interval flush, `sendBeacon` on `pagehide`/`visibilitychange`, `fetch(keepalive)` fallback, no error surfacing to users
- [x] 4.2 Implement device fingerprint helpers: persistent `device_id` (localStorage), `device_metadata` (OS, browser, screen resolution, connection type)
- [x] 4.3 Implement hybrid geolocation helper: declared comuna/region from profile + consent-gated `navigator.geolocation` (cached per session, accuracy in meters) + IP fallback on server
- [x] 4.4 Build `components/analytics/TelemetryProvider.tsx`: global tracker — viewport/route change events, consent gate before any emission, GPS only when `consent_precise_geo`
- [x] 4.5 Add dwell-time (IntersectionObserver + timestamps) and scroll-depth tracking hooks used on species sheets (`VIEW_FICHA`) and calculators
- [x] 4.6 Emit `COMMERCE_INTENT` events on calculator submits and input quotes (dose, fertilizer brand, price in payload)
- [x] 4.7 Implement `app/api/v1/telemetry/route.ts`: Zod-validated batch ingestion, insert with open-write RLS, silent failure handling, admin-only reads

## 5. Ad Inventory

- [x] 5.1 Create `gf_sponsorships` table + admin CRUD API (`/api/v1/admin/sponsorships`) with ad_unit_id, ad_partner_id, screen, active
- [x] 5.2 Build shared `useAdTracking` hook: impression once per view (IntersectionObserver), click tracking, respects consent gate
- [x] 5.3 Build `components/ads/NativeAdSlot.tsx` and `components/ads/SponsoredBanner.tsx` using the shared hook, touch targets >= 48px, app-consistent styling
- [x] 5.4 Integrate active sponsorships into `/explorar` and `/huerto` server components; render only active units
- [x] 5.5 Add admin sponsorship management UI (list, activate/deactivate, assign partner)

## 6. Audience Profiling & Data Brokerage

- [x] 6.1 Implement `lib/telemetry/audiences.ts`: pure rule functions mapping telemetry signals (dwell time, scroll depth, commerce intent, crop interest, geo) to segments, purchasing-power tier, phenology stage and primary crop
- [x] 6.2 Implement the scheduled refresh job: re-evaluate recent events per consented user, upsert `gf_user_audiences` profiles and counters (impressions/clicks)
- [x] 6.3 Build admin dashboard `app/(dashboard)/admin/audiencias/page.tsx`: cohort explorer with filters (segment, tier, region/comuna, phenology stage, crop), counts and composition
- [x] 6.4 Add admin-only guard on the audience explorer (deny non-admin plans)

## 7. Verification

- [x] 7.1 Add unit tests for `lib/telemetry/audiences.ts` rules and consent token expiry logic
- [x] 7.2 Add unit tests for Zod schemas (reject malformed telemetry and consent payloads)
- [x] 7.3 Manual E2E: register → consent modal → full and partial consent paths → verify telemetry events stored and attributed  <!-- Verified against project ayhpmsocohrorabvrmow: anonymous + authenticated consent POST (full & partial), upsert no-duplicate, telemetry batch ingest, events stored/attributed -->
- [x] 7.4 Manual E2E: non-consented user produces no events; admin-only access to telemetry and audiences; consent expiry prompts renewal  <!-- Verified: admin GET telemetry/refresh/sponsorships OK; non-admin 403/401; anonymous consent RLS fixed via 0008_rls_anonymous_consent.sql -->
- [x] 7.5 Run lint and typecheck (strict TS, zero `any`); confirm no UI blocking during telemetry flush