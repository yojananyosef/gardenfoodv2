# admin/metrics Specification

## Purpose
Da al jefe KPIs vivos del negocio y salud del producto sin pedirle a un dev que haga `SELECT count(*)`.

## Requirements

### Requirement: Overview KPIs

The system SHALL provide an `admin` overview page with cards: `total usuarios` (`perfiles` count), `activos 30d` (users with `gf_analytics_events` in 30d), `MRR` (sum `active` `gf_subscriptions` × monto `lib/payments/plans.ts:17` `9990/19990/29990`), `gratuito` count, and `pending`/`canceled` funnel.

#### Scenario: Admin opens overview
- **WHEN** an admin opens `/admin`
- **THEN** the system shows total usuarios, MRR CLP, gratuito count and a funnel `trialing/pending → active → canceled` with numbers from `gf_subscriptions`

### Requirement: Finance drill-down

The system SHALL show `gf_subscriptions` grouped by `plan`/`interval`/`status` with `provider_subscription_id` link to MP (`https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=...`) and `external_reference`, and allow filtering by `status` and `plan`.

#### Scenario: Admin filters canceled
- **WHEN** an admin filters `status=canceled`
- **THEN** the system lists only `canceled` subscriptions with their `plan` and `external_reference`

### Requirement: Health signals

The system SHALL surface health signals: últimos `gf_analytics_events` (24h count), `preapproval` webhook success rate (`mercadopago_notifications_history` ya 100% `subscription_preapproval 18`), y top `comuna`/`zona` por `gf_cultivos`.

#### Scenario: Admin checks health
- **WHEN** an admin opens `/admin`
- **THEN** the system shows `eventos 24h`, `webhook 100%` y `top comunas` por cultivos
