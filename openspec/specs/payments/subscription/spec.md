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
The system SHALL, upon Mercado Pago `subscription_preapproval`, `subscription_authorized_payment` or `payment` notification, resolve `external_reference` to the draft `gf_subscriptions.id`, fetch `/preapproval/{id}` (or `/authorized_payments/{id}`→ preapproval), map `authorized→active`, `pending→trialing`, `paused→inactive`, `cancelled→canceled` through a single shared mapping, and update the draft row identified by `external_reference` (`gf_subscriptions.status, current_period_end, paid_via:mercadopago, provider_subscription_id`) and `perfiles(subscription_status, subscription_id, payment_provider:mercadopago)`. Only `authorized` SHALL set `perfiles.plan` to the tier; `pending` SHALL NOT grant the paid plan. Signature validation SHALL use `MP_WEBHOOK_SECRET` via `x-signature` `ts`/`v1` over `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with a ±600 s freshness window on `ts`; the environment SHALL reject webhooks with a 500 when `MP_WEBHOOK_SECRET` is unset in production.

#### Scenario: Valid authorized subscription
- **WHEN** Mercado Pago sends a notification for the user's preapproval with status `authorized`
- **THEN** the system sets `perfiles.plan` to the tier, `subscription_status` to `active`, and marks the subscription `active`

#### Scenario: Pending checkout abandoned never grants the plan
- **WHEN** a notification (or status poll) reports a preapproval that was never authorized (`pending`)
- **THEN** the system records `trialing` without access and `perfiles.plan` remains `gratuito`

#### Scenario: Cancelled subscription downgrades
- **WHEN** Mercado Pago sends a notification with status `cancelled`
- **THEN** the system sets `perfiles.plan` back to `gratuito` and `subscription_status` to `canceled`

#### Scenario: Webhook without valid signature is rejected
- **WHEN** `MP_WEBHOOK_SECRET` is set and `x-signature` is missing/invalid or `ts` is older than 600 seconds
- **THEN** the system returns 401 `invalid signature` and does not update the profile

#### Scenario: Missing secret in production fails loudly
- **WHEN** the app runs with `NODE_ENV=production` and `MP_WEBHOOK_SECRET` is unset
- **THEN** the webhook returns 500 instead of processing unsigned notifications

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

### Requirement: Synchronous status confirmation
The client after returning from Mercado Pago hosted checkout SHALL be able to confirm the subscription without waiting for the webhook, by calling `POST /api/v1/payments/subscribe/status` which fetches the latest `preapproval` status and applies the same shared mapping as the webhook; access SHALL be granted only when the preapproval is `authorized`.

#### Scenario: User returns from checkout before webhook arrives
- **WHEN** the user lands on `/suscripcion/confirmar` and the webhook has not yet fired
- **THEN** the page calls `subscribe/status`, the server fetches `/preapproval/{id}`, updates local state, and shows success only if `authorized`; otherwise it shows a pending-payment message
