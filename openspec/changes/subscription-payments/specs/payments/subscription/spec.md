## Purpose

Cobro recurrente local (CLP) de la suscripción por uso de GardenFood con Flow.cl, que activa
el plan `premium` en el perfil del usuario y gatea las funciones core de la app.

## ADDED Requirements

### Requirement: Create subscription order
The system SHALL create a Flow.cl subscription/recurring order for the authenticated user's plan and return the redirect URL to Flow's hosted page.

#### Scenario: Successful subscription creation
- **WHEN** an authenticated user requests to subscribe to the `premium` plan
- **THEN** the system creates a Flow recurring order for the plan amount (CLP) and returns a `redirect_url` and `token`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a subscribe request is made without a valid session
- **THEN** the system returns 401 and creates no subscription

### Requirement: Activate plan on confirmed payment
The system SHALL, upon confirmed Flow payment, set `perfiles.plan = premium` and record the subscription period in `gf_subscriptions`.

#### Scenario: Valid confirmed subscription
- **WHEN** Flow sends a confirmation for the user's subscription with a valid signature and `getStatus` reports paid
- **THEN** the system sets `perfiles.plan` to `premium`, records `current_period_start`/`current_period_end`, and marks the subscription `active`

### Requirement: Gate core features by plan
The system SHALL restrict access to core routes when the user has no active `premium` plan, redirecting to the pricing page.

#### Scenario: Free user hits a core route
- **WHEN** a user without an active `premium` plan navigates to a gated core route
- **THEN** the system redirects them to `/pricing`

#### Scenario: Public routes stay open
- **WHEN** any user navigates to a public route (explorar, ficha de especie)
- **THEN** access is allowed regardless of plan
