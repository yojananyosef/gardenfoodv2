# garden/auth Specification

## Purpose
Protects dashboard routes via middleware, validates the user's location at registration, and lets users edit their own profile location so agroclimatic features resolve correctly.

## Requirements

### Requirement: Dashboard routes are protected by middleware
The system SHALL register a `middleware.ts` that guards authenticated dashboard routes and redirects unauthenticated users to `/login`; authenticated users hitting `/login` or `/registro` SHALL be redirected to `/huerto`. Unauthenticated users MUST NOT see a blank dashboard page.

#### Scenario: Unauthenticated user visits a dashboard route
- **WHEN** a user without an active session navigates to `/huerto`, `/calendario`, `/cosechas` or `/perfil`
- **THEN** the system redirects them to `/login` and never renders a blank authenticated page

#### Scenario: Authenticated user visits login
- **WHEN** a user with an active session navigates to `/login` or `/registro`
- **THEN** the system redirects them to `/huerto`

### Requirement: Registration validates location against the comuna catalog
The registration flow SHALL validate `region` and `comuna` against the catalog of 245 comunas and SHALL derive `zona_agroclimatica` from the matched comuna instead of hardcoding it.

#### Scenario: Valid comuna is registered
- **WHEN** a user registers with a `comuna` present in the catalog and a matching `region`
- **THEN** the system stores the user's `zona_agroclimatica` derived from that comuna and does not hardcode any zone

#### Scenario: Unknown comuna is rejected
- **WHEN** a user registers with a `comuna` not present in the catalog
- **THEN** the system rejects the registration with a validation error and does not store an invalid zone

### Requirement: Users can edit their profile location
The profile page SHALL let authenticated users update their `region`, `comuna` and derived `zona_agroclimatica`, and the change SHALL persist to `perfiles`.

#### Scenario: User updates comuna
- **WHEN** an authenticated user changes their comuna in `/perfil` to a valid catalog comuna
- **THEN** the system updates `perfiles` with the new region, comuna and agroclimatic zone, and agroclimatic alerts recompute accordingly
