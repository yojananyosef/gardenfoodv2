## Purpose

Cobro recurrente local (CLP) de la suscripción por uso de GardenFood con Mercado Pago,
que activa el plan del usuario (`huertero` / `cosecha` / `full`) y gatea las funciones
core de la app. Flujo: se crea una suscripción `pending` (preapproval sin plan, con
`auto_recurring` inline + `external_reference`) y se redirige al checkout hospedado de
Mercado Pago (`init_point`); el webhook de MP enlaza por `external_reference` y activa el plan.

## ADDED Requirements

### Requirement: Create subscription order
The system SHALL create a Mercado Pago `pending` preapproval (plan-less, inline `auto_recurring`) for the authenticated user's plan and return the hosted-checkout `init_point` to redirect the user to.

#### Scenario: Successful subscription creation
- **WHEN** an authenticated user requests to subscribe to a paid plan (huertero/cosecha/full) with monthly or yearly interval
- **THEN** the system creates a preapproval with `external_reference` = our `gf_subscriptions` draft id and returns the `init_point`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a subscribe request is made without a valid session
- **THEN** the system returns 401 and creates no subscription

### Requirement: Activate plan on confirmed payment
The system SHALL, upon Mercado Pago `subscription_preapproval` (or `subscription_authorized_payment`) notification, look up the preapproval by `external_reference` and, if `authorized`, set `perfiles.plan` to the subscribed tier and record the subscription in `gf_subscriptions`.

#### Scenario: Valid authorized subscription
- **WHEN** Mercado Pago sends a notification for the user's preapproval with status `authorized`
- **THEN** the system sets `perfiles.plan` to the tier, `subscription_status` to `active`, and marks the subscription `active`

#### Scenario: Cancelled subscription downgrades
- **WHEN** Mercado Pago sends a notification with status `cancelled`
- **THEN** the system sets `perfiles.plan` back to `gratuito` and `subscription_status` to `canceled`

### Requirement: Gate core features by plan
The system SHALL restrict access to core routes when the user has no active paid plan, redirecting to the pricing page. `admin` bypasses gating.

#### Scenario: Free user hits a core route
- **WHEN** a user without an active paid plan navigates to a gated core route
- **THEN** the system redirects them to `/pricing`

#### Scenario: Public routes stay open
- **WHEN** any user navigates to a public route (explorar, ficha de especie, calculadoras, perfil)
- **THEN** access is allowed regardless of plan
