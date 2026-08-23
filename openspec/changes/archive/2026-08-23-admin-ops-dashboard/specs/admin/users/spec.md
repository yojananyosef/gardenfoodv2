## Purpose

Permite al jefe operar el negocio sin SQL: ver quién es quién, dónde cultiva y qué paga, y corregir el plan manualmente cuando MP falla.

## ADDED Requirements

### Requirement: List users with filters

The system SHALL provide an `admin/usuarios` page that lists `perfiles` paginated (20 por página) with `email`, `nombre`, `region`, `comuna`, `zona_agroclimatica` (derivado `getZonaDeComuna`), `plan`, `subscription_status`, `created_at`, and supports filters by `plan` (`gratuito|huertero|cosecha|full|admin`), `zona`, `comuna` search and `email` search. Only `is_admin()` may read; others receive `403`.

#### Scenario: Admin filters by plan huertero
- **WHEN** an admin opens `/admin/usuarios?plan=huertero`
- **THEN** the system returns only `perfiles` where `plan=huertero` with their zona/comuna, ordered by `created_at desc`

#### Scenario: Non-admin is blocked
- **WHEN** a non-admin requests `/admin/usuarios`
- **THEN** the system returns `403` and renders `Acceso denegado`

### Requirement: User detail drill-down

The system SHALL allow an admin to open a user detail showing `gf_cultivos` (especies), `gf_tareas` (pendiente/en_proceso/completada), `gf_registro` (kg cosechado), `gf_arboles` and `gf_subscriptions` (plan, interval, status, `provider_subscription_id`).

#### Scenario: Admin opens user with huerto
- **WHEN** an admin clicks a user row
- **THEN** the system shows that user's cultivos/tareas/registros/árboles and subscriptions linked by `user_id`

### Requirement: Manual plan change

The system SHALL allow an admin to change `perfiles.plan` and `subscription_status` for a user via `PATCH /api/v1/admin/users/{id}` with `plan` in `gratuito|huertero|cosecha|full` and `subscription_status` in `inactive|trialing|active|canceled`, audited (who/when).

#### Scenario: Admin activates buyer after MP failure
- **WHEN** an admin sets `gardenfood.buyer...` to `huertero` `active`
- **THEN** `perfiles` updates, `proxy.ts` `isPaidTier` grants `/huerto`/`/recomendadas` and the user sees `Plan huertero` in `/perfil`

