## Why

GardenFood V2 currently lacks the technical layer needed to reach the monetization level of apps like Fastic: programmatic ad-tech, commercial audience profiling and data brokerage (B2B). Without granular legal consent (CMP), device identity, hybrid geolocation, micro-behavior tracking and automatic audience segmentation, the platform cannot serve targeted sponsorships, sell audience cohorts to brands, or comply with GDPR / Chilean Data Law. The registration flow also has no persuasive consent experience, which caps consent rates and therefore ad revenue.

## What Changes

- **CMP consent module (IAB TCF-style)**: granular consent registry per purpose/provider with 390-day expiry, consent string, opt-out of legitimate interest, and storage of the consent token locally (localStorage + secure cookie). Includes a persuasive onboarding consent modal ("Consentir y Comenzar") and a detailed preferences panel ("Gestionar opciones").
- **Device identity layer**: persistent `device_id` + fingerprinting metadata (IP, User-Agent, screen resolution, manufacturer) captured on every telemetry event.
- **Hybrid geolocation**: declared comuna/region/agroclimatic zone + consent-based GPS coordinates (< 500m accuracy) + IP geolocation fallback, for micro-targeting of nearby agricultural stores.
- **Micro-behavior telemetry engine**: non-blocking event ingestion (`sendBeacon` / `fetch keepalive`) tracking dwell time per screen, scroll depth on species sheets, commerce intent (calculator submits, quoted inputs, searched fertilizer brands) and active phenology stages.
- **Audience profiling & data brokerage**: automatic assignment of commercial segments and purchasing-power tiers (`gf_user_audiences`), plus an admin dashboard to explore audience cohorts (the B2B sellable product).
- **Ad inventory plumbing**: `NativeAdSlot` / `SponsoredBanner` components with impression and click tracking (`ad_unit_id`, `ad_partner_id`) and admin-managed sponsorship, ready for future real ad-network integration.
- **New DB schema**: `gf_user_consents`, `gf_user_audiences`, `gf_analytics_events` tables with analytical indexes and RLS policies (user-own rows, open telemetry insert, admin read/management).

## Capabilities

### New Capabilities

- `adtech/consent`: Legal consent management (CMP) — granular per-purpose/per-partner consent, IAB TCF-style consent string, 390-day expiry, local token persistence, and the persuasive onboarding flow with preferences management.
- `adtech/telemetry`: Telemetry engine — non-blocking event ingestion, device fingerprinting, hybrid geolocation, dwell time / scroll depth / commerce-intent capture, and ad impression/click metrics.
- `adtech/audiences`: Automatic commercial audience profiling (segments, purchasing-power tiers, phenology stage) and the admin cohort explorer for B2B data brokerage.
- `adtech/ads`: Native ad inventory — ad slot and sponsored banner components with impression/click tracking and admin-managed sponsorship configuration.

### Modified Capabilities

- None. This openspec root has no existing specs yet; all capabilities above are new.

## Impact

- **Database (Supabase PostgreSQL)**: 3 new tables (`gf_user_consents`, `gf_user_audiences`, `gf_analytics_events`), analytical indexes, RLS policies. The existing `perfiles` table gains an admin check dependency for audience/telemetry management policies (no column changes).
- **API**: new Route Handlers `/api/v1/telemetry` (async ingestion) and `/api/v1/cmp/consent` (save/update consent).
- **Client**: `TelemetryProvider` global tracker, `ConsentModal` + `ConsentPreferences` components in the registration flow, ad slot components in `/explorar` and `/huerto`, admin dashboard `/admin/audiencias`.
- **Libraries**: `lib/telemetry/tracker.ts` (capture engine), `lib/telemetry/audiences.ts` (cohort assignment rules).
- **Out of scope (assumed)**: payments (Flow.cl / PayPal subscriptions) — already planned separately and untouched by this change; no real ad-network SDK integration yet, only pluggable `ad_partner_id` plumbing and admin-managed sponsorships.