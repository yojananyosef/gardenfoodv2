# admin/metrics Specification

## Purpose
Da al jefe KPIs vivos del negocio y salud del producto sin pedirle a un dev que haga `SELECT count(*)`.

## Requirements

### Requirement: Overview KPIs

El sistema SHALL proveer una página overview `admin` con tarjetas: `total usuarios` (count de `perfiles`), `activos 30d` (usuarios con `gf_analytics_events` en 30d, count distinct en SQL), `MRR` (suma de suscripciones `active` × monto según `lib/payments/plans.ts`), `gratuito` count y funnel `pending`/`trialing`/`active`/`canceled`/`inactive`. Los agregados SHALL calcularse en SQL (función `admin_overview_metrics()` con `is_admin()` como guard y `EXECUTE` revocado a `anon`) y no descargando tablas completas a JS. Los precios de MRR SHALL seguir definidos en TypeScript; la función devuelve conteos agrupados por `plan`/`interval`.

#### Scenario: Admin abre overview
- **WHEN** un admin abre `/admin`
- **THEN** el sistema muestra total usuarios, MRR CLP por tier, gratuitos y funnel de suscripciones calculados por una única llamada SQL agregada

#### Scenario: Snapshot crece
- **WHEN** `gf_analytics_events` acumula miles de filas
- **THEN** el overview sigue respondiendo con la misma latencia (agregación en Postgres, sin descarga de filas al proceso Node)

#### Scenario: Admin opens overview
- **WHEN** an admin opens `/admin`
- **THEN** the system shows total usuarios, MRR CLP, gratuito count and a funnel `trialing/pending → active → canceled` with numbers from `gf_subscriptions`

### Requirement: Finance drill-down

The system SHALL show `gf_subscriptions` grouped by `plan`/`interval`/`status` with `provider_subscription_id` link to MP (`https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=...`) and `external_reference`, and allow filtering by `status` and `plan`.

#### Scenario: Admin filters canceled
- **WHEN** an admin filters `status=canceled`
- **THEN** the system lists only `canceled` subscriptions with their `plan` and `external_reference`

### Requirement: Health signals

El sistema SHALL mostrar señales de salud: `eventos 24h` (count SQL), `última sincronización de suscripciones` (max `updated_at` de `gf_subscriptions`) y `top comunas` por cantidad de cultivos (join `gf_cultivos` → `perfiles.comuna` en SQL, límite 10). El sistema SHALL NO fabricar indicadores: ningún valor hardcodeado de tasa o historial de webhook.

#### Scenario: Admin revisa salud
- **WHEN** un admin abre `/admin`
- **THEN** el sistema muestra eventos 24h, la fecha/hora de la última sincronización de suscripciones y top comunas reales, sin datos inventados

#### Scenario: Sin datos aún
- **WHEN** no hay eventos en 24h ni suscripciones sincronizadas
- **THEN** las tarjetas muestran estados vacíos explícitos ("sin datos en 24h", "sin sincronizaciones") en lugar de ceros o valores ficticios

#### Scenario: Admin checks health
- **WHEN** an admin opens `/admin`
- **THEN** the system shows `eventos 24h`, la última sincronización real de suscripciones y `top comunas` por cultivos
