# payments/subscription Specification

## Purpose

Cobro recurrente local (CLP) de la suscripción por uso de GardenFood con Mercado Pago, que activa el plan del usuario (`huertero` / `cosecha` / `full`) y gatea las funciones core de la app. Flujo: se crea una suscripción `pending` (preapproval sin plan, con `auto_recurring` inline + `external_reference`) y se redirige al checkout hospedado de Mercado Pago (`init_point`); el webhook de MP enlaza por `external_reference` y activa el plan.

## Requirements

### Requirement: Create subscription order
The system SHALL create a Mercado Pago `pending` preapproval **without a plan** (inline `auto_recurring`) for the authenticated user's tier and interval and return the hosted-checkout `init_point` to redirect the user to. Yearly interval SHALL be encoded as 12 charges of `frequency:12, frequency_type:"months"` (annual = 10× monthly amount, 12 cuotas), monthly as `frequency:1, frequency_type:"months"`. The request SHALL include `external_reference` equal to the draft `gf_subscriptions.id`, `payer_email` equal to the user's Supabase email, `back_url` validated as `${NEXT_PUBLIC_SITE_URL}/suscripcion/confirmar`, `notification_url` as `${NEXT_PUBLIC_SITE_URL}/api/v1/payments/webhook`, `transaction_amount` as CLP integer from `plans.ts`, `currency_id:"CLP"`, `status:"pending"` and, when applicable, `free_trial:{frequency:14, frequency_type:"days"}`. The system SHALL reject yearly using `frequency_type:"years"` and SHALL not use `card_token_id` or `preapproval_plan_id` (legacy Bricks) which returns 404. The system SHALL not embed Mercado Pago Bricks/secure-fields inline and SHALL thus avoid CSP `script-src nonce strict-dynamic` violations and `fontSize:number` / `No length configuration` errors.

#### Scenario: Successful subscription creation
- **WHEN** an authenticated user requests to subscribe to a paid plan (huertero/cosecha/full) with monthly or yearly interval
- **THEN** the system creates a preapproval with `external_reference` = our `gf_subscriptions` draft id and returns the `init_point` (monthly: `frequency:1, months` with `9990|19990|29990`; yearly: `frequency:12, months` with `99900|199900|299900` + `free_trial 14d` + `back_url`/`notification_url`)

#### Scenario: Successful subscription creation yearly
- **WHEN** an authenticated user requests yearly
- **THEN** the system uses `frequency:12, frequency_type:"months"` with `transaction_amount:99900|199900|299900` (10× monthly) and the same `free_trial`/`back_url`/`notification_url` semantics, and returns `init_point`

#### Scenario: Payer is collector
- **WHEN** `payer_email` equals the Mercado Pago collector account email (common in TEST)
- **THEN** the system returns `400` with human message "Usa un email de prueba distinto al de tu cuenta de Mercado Pago" and deletes the draft, without leaking the MP error body

#### Scenario: Unauthenticated request is rejected
- **WHEN** a subscribe request is made without a valid session
- **THEN** the system returns 401 and creates no subscription

### Requirement: Activate plan on confirmed payment
The system SHALL, upon Mercado Pago `subscription_preapproval`, `subscription_authorized_payment` or `payment` notification, resolve `external_reference` to the draft `gf_subscriptions.id`, fetch `/preapproval/{id}` (or `/authorized_payments/{id}`→ preapproval), map `authorized→active`, `pending→trialing`, `paused→inactive`, `cancelled→canceled`, and update `gf_subscriptions(status, current_period_end, paid_via:mercadopago, provider_subscription_id)` and `perfiles(plan, subscription_status, subscription_id, payment_provider:mercadopago)`. Signature validation with `MP_WEBHOOK_SECRET` via `x-signature` `ts`/`v1` over `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` SHALL be enforced when the env is set; without it, the webhook still processes but logs a warning.

#### Scenario: Valid authorized subscription
- **WHEN** Mercado Pago sends a notification for the user's preapproval with status `authorized`
- **THEN** the system sets `perfiles.plan` to the tier, `subscription_status` to `active`, and marks the subscription `active`

#### Scenario: Cancelled subscription downgrades
- **WHEN** Mercado Pago sends a notification with status `cancelled`
- **THEN** the system sets `perfiles.plan` back to `gratuito` and `subscription_status` to `canceled`

#### Scenario: Webhook without valid signature is rejected
- **WHEN** `MP_WEBHOOK_SECRET` is set and `x-signature` is missing/invalid
- **THEN** the system returns 401 `invalid signature` and does not update the profile

### Requirement: Gate core features by plan
The system SHALL restrict access to core routes `/huerto`, `/calendario`, `/cosechas`, `/recomendadas` when the user has no active paid plan, redirecting to `/pricing`. `admin` bypasses gating. Public routes `/`, `/explorar`, `/especies/*`, `/calculadoras`, `/pricing`, `/suscripcion/*`, `/perfil`, `/login`, `/registro`, `/api` stay open. The gating SHALL be enforced in `proxy.ts` via `perfiles.plan` and `isPaidTier`.

#### Scenario: Free user hits a core route
- **WHEN** a user without an active paid plan navigates to a gated core route
- **THEN** the system redirects them to `/pricing`

#### Scenario: Public routes stay open
- **WHEN** any user navigates to a public route (explorar, ficha de especie, calculadoras, perfil)
- **THEN** access is allowed regardless of plan

### Requirement: Synchronous status confirmation
The client after returning from Mercado Pago hosted checkout SHALL be able to confirm the subscription without waiting for the webhook, by calling `POST /api/v1/payments/subscribe/status` which fetches the latest `preapproval` status and applies the same mapping as the webhook.

#### Scenario: User returns from checkout before webhook arrives
- **WHEN** the user lands on `/suscripcion/confirmar` and the webhook has not yet fired
- **THEN** the page calls `subscribe/status`, the server fetches `/preapproval/{id}`, updates local state, and shows "Suscripción en periodo de prueba activa" if `pending/trialing` or "Suscripción activa" if `authorized`
