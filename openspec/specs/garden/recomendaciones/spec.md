# garden/recomendaciones Specification

## Purpose
Restaura el valor core de legacy `resultados.html`: permitir al usuario saber qué especies puede cultivar en su comuna, clasificadas como recomendadas, con riesgo o no recomendadas para su zona agroclimática, con explicación técnica, para que el flujo "elige comuna → descubre → ficha" exista en V2.

## Requirements

### Requirement: Species recommendation by agroclimatic zone

The system SHALL provide a recommendations view that, for the authenticated user's agroclimatic zone derived from `perfiles.comuna`, classifies the 30 species into `si` (recomendado), `riesgo` (con riesgo) and `no` (no recomendado) using the viability matrix, and shows the technical `viabRazon` for each entry.

#### Scenario: Authenticated user with valid comuna sees classified catalog
- **WHEN** an authenticated user with a comuna present in the 254-entry catalog opens `/recomendadas` (or the recommendations block inside `/explorar`)
- **THEN** the system resolves `zonaId` via `getZonaDeComuna`, calls `getEspeciesPorZona(zonaId)` and renders three sections with counts and species cards grouped by implantation status, each card linking to `/especies/[slug]`

#### Scenario: User without comuna sees CTA
- **WHEN** a user without a valid comuna (or unauthenticated visitor on the block) opens recommendations
- **THEN** the system shows an empty state with a CTA to set comuna in `/perfil` (or to register), and does not crash

#### Scenario: Fallback zone when comuna unknown
- **WHEN** the stored comuna does not match the catalog
- **THEN** the system falls back to zone 7 (Santiago Norte) as neutral default and still renders the classification, marking the fallback in UI copy

### Requirement: Recommendation is reachable from primary navigation

The system SHALL expose recommendations through primary navigation (bottom nav on mobile, header on desktop) and as a card on `/huerto` summary, so the discovery loop is not orphaned.

#### Scenario: Navigate to recommendations from huerto
- **WHEN** a user taps "Ver recomendaciones para mi zona" on the huerto dashboard
- **THEN** the system navigates to the recommendations view filtered for that user's zone

### Requirement: Recommendation view respects plan gating but catalog stays public

Recommendations that show zone-specific guidance SHALL be gated like other core routes (`proxy.ts` redirects free users to `/pricing`), while the flat catalog `/explorar` and species sheets remain public.

#### Scenario: Free user hits `/recomendadas`
- **WHEN** a user without active paid plan navigates to `/recomendadas`
- **THEN** the system redirects to `/pricing` unless plan is `admin`
