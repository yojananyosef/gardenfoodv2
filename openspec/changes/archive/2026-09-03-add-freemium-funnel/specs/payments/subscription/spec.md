## MODIFIED Requirements

### Requirement: Gate access by tier (anonymous → free → paid)
The system SHALL gate access in three layers. **Anonymous** (no session): public routes `/`, `/explorar`, `/especies/*`, `/pricing`, `/login`, `/registro`, `/api` stay open; `/calculadoras`, `/huerto`, `/calendario`, `/cosechas`, `/recomendadas`, `/perfil` and `/admin` SHALL redirect to `/registro?next=<path>`. In the species catalog only `duraznero` (muestra gratuita) is unlocked for anonymous users; every other species page SHALL render its full content server-side (indexable, sitemap intact) with a locked presentation and a registration CTA. **Free registered** (`perfiles.plan = "gratuito"`): core routes `/huerto`, `/calendario`, `/cosechas`, `/recomendadas` are accessible with free-tier limits (máx 3 cultivos, máx 1 árbol, anuncios visibles, sin logros ni analítica de producción). **Paid** tiers and `admin` are unlimited. `/admin` SHALL additionally require `perfiles.plan === "admin"` at the proxy layer. The gating SHALL be enforced in `proxy.ts` via `perfiles.plan`, `isPaidTier` and the free-tier limit helpers, with limits re-validated inside the server actions.

#### Scenario: Anonymous hits calculadoras
- **WHEN** a user without a session navigates to `/calculadoras`
- **THEN** the system redirects to `/registro?next=/calculadoras` and, after successful registration, returns them to `/calculadoras`

#### Scenario: Anonymous browses the catalog
- **WHEN** a user without a session opens `/explorar`
- **THEN** all 30 species render, only `duraznero` opens its full ficha, and the other 29 show a locked card that leads to their locked ficha preview

#### Scenario: Anonymous opens a locked ficha
- **WHEN** a user without a session opens `/especies/cerezo`
- **THEN** the server renders the full ficha content in the HTML (SEO preserved) while the UI shows the header/summary plus a blurred, locked body with a "Regístrate gratis" CTA

#### Scenario: Anonymous opens the muestra gratuita
- **WHEN** a user without a session opens `/especies/duraznero`
- **THEN** the full ficha is shown unlocked without registration

#### Scenario: Free user uses the core app
- **WHEN** a registered user with plan `gratuito` navigates to `/huerto`, `/calendario`, `/cosechas` or `/recomendadas`
- **THEN** access is allowed without redirecting to `/pricing`, subject to free-tier limits

#### Scenario: Non-admin hits /admin
- **WHEN** an authenticated user whose plan is not `admin` navigates to any `/admin/*` route
- **THEN** the proxy redirects them away from `/admin` before the page renders
