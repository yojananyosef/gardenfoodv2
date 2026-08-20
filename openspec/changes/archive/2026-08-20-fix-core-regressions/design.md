## Context

V2 rebuilt the core product (mobile-first-ux) and the ad-tech layer, but six regressions remain (see proposal.md - Why). The most damaging is that `proxy.ts` contains route-protection logic but is never registered as `middleware.ts`, so unauthenticated users get blank dashboard pages. The other gaps are: hardcoded zone at registration, a broken audience-refresh cron pointing at a non-existent localhost Edge Function, an orphaned `gf_arboles` table, a profile page that cannot edit location, and a coercive consent modal with no reject-all.

## Goals / Non-Goals

**Goals:**
- Make dashboard routes redirect (not blank) for unauthenticated users.
- Make location data accurate end-to-end (registration → perfil → alertas).
- Make the audience-refresh pipeline operational and manually triggerable.
- Restore the tree-inventory module from the legacy product.
- Make consent genuinely optional at onboarding.

**Non-Goals:**
- Payments/subscriptions and PWA (out of scope for this change).
- Live INIA weather integration (still static per `lib/climate`).
- Real ad-network SDK integration.

## Decisions

- **Middleware over reusing `proxy.ts`**: `proxy.ts` is dead code with correct intent but wrong wiring. Decision: create a real `middleware.ts` at repo root (Next.js convention) rather than importing `proxy.ts`, since middleware must be a top-level export and `proxy.ts` is not registered. `proxy.ts` will be deleted to avoid confusion.
- **Comuna validation via existing `lib/agronomy/comunas.ts`**: reuse the catalog already powering alerts instead of adding a new dataset; derive `zona_agroclimatica` from the matched comuna.
- **Cron points to the real Route Handler**: change `gf_cron_config.refresh_endpoint` in migration 0007 to the deployed `/api/v1/admin/audiences/refresh` and a valid secret (`CRON_SECRET`), instead of the localhost function URL. Add an admin button as a manual fallback.
- **`gf_arboles` via Server Actions**: mirror the existing `gf_cultivos` patterns in `lib/huerto/actions.ts` and add a tab/section under `/huerto`.
- **Profile edit reuses `lib/supabase/server`**: add an update action in `lib/auth` and a small form in `/perfil`.
- **CMP reject-all**: make `ConsentModal` dismissible (`onOpenChange` wired) and add a "Rechazar todo" button that posts all-false consent.

## Risks / Trade-offs

- [Risk] Middleware redirect loop if matcher includes `/login`/`/registro` → Mitigation: exclude auth routes and public routes from the matcher; only guard `(dashboard)` pages.
- [Risk] Editing migration 0007 after it may already be applied in some environments → Mitigation: add a new idempotent migration that updates `gf_cron_config.refresh_endpoint` rather than editing the old one.
- [Risk] Changing CMP default from grant-all could reduce consent rates → Mitigation: keep "Consentir y Comenzar" as primary CTA; reject-all is secondary, matching GDPR expectation.
