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

### Requirement: Sign in with email and password

The system SHALL allow an existing user to sign in with email and password, and on success establish a session that grants access to the dashboard.

#### Scenario: Valid credentials

- **WHEN** a user submits valid email and password
- **THEN** the system authenticates the user, establishes a session and redirects to the huerto dashboard

#### Scenario: Invalid credentials

- **WHEN** a user submits invalid email or password
- **THEN** the system shows a clear error message and keeps the user on the sign-in page

#### Scenario: Sign in errors are human readable

- **WHEN** authentication fails for any reason (wrong password, unconfirmed email, network error)
- **THEN** the system shows a localized, human-readable error message instead of a raw API error

### Requirement: Sign out

The system SHALL allow an authenticated user to sign out, which terminates the session and returns the user to the public home page.

#### Scenario: User signs out

- **WHEN** an authenticated user triggers sign out
- **THEN** the session is terminated and the user is redirected to the home page

### Requirement: Protected dashboard routes

The system SHALL redirect unauthenticated users away from dashboard routes and redirect authenticated users away from auth-only pages.

#### Scenario: Unauthenticated user opens a dashboard route

- **WHEN** a user without a session opens any route under the dashboard
- **THEN** the system redirects them to the sign-in page

#### Scenario: Authenticated user opens the sign-in page

- **WHEN** an authenticated user opens the sign-in or sign-up page
- **THEN** the system redirects them to the huerto dashboard

### Requirement: New user profile creation

The system SHALL create a profile record in the `perfiles` table when a user signs up, including email, name, region, commune and agroclimatic zone.

#### Scenario: Profile created on sign up

- **WHEN** a new user completes sign up
- **THEN** the system creates the corresponding profile record and the user is treated as authenticated

### Requirement: Profile plan columns are server-managed
The database SHALL prevent authenticated users from changing their own `plan`, `subscription_status`, `subscription_id` or `payment_provider` on `perfiles` (trigger `guarda_columnas_plan_perfiles` rejecting the UPDATE); plan changes SHALL only happen through the service role (payment webhook/status, admin API). Regular profile fields (location, terreno, nombre) remain user-editable, and `perfiles.plan` SHALL remain the single trust source for `isAdmin()` and admin route gating.

#### Scenario: Self-service admin escalation is rejected

- **WHEN** an authenticated user updates their own profile row setting `plan = 'admin'`
- **THEN** the database raises an exception and the plan stays unchanged

#### Scenario: Server-side plan change still works

- **WHEN** the payment webhook or an admin API updates `perfiles.plan` via the service role
- **THEN** the update succeeds
