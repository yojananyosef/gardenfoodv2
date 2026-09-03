## MODIFIED Requirements

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

### Requirement: Synchronous status confirmation
The client after returning from Mercado Pago hosted checkout SHALL be able to confirm the subscription without waiting for the webhook, by calling `POST /api/v1/payments/subscribe/status` which fetches the latest `preapproval` status and applies the same shared mapping as the webhook; access SHALL be granted only when the preapproval is `authorized`.

#### Scenario: User returns from checkout before webhook arrives
- **WHEN** the user lands on `/suscripcion/confirmar` and the webhook has not yet fired
- **THEN** the page calls `subscribe/status`, the server fetches `/preapproval/{id}`, updates local state, and shows success only if `authorized`; otherwise it shows a pending-payment message
