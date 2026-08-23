## Why

El jefe necesita ver el negocio sin pedirle a un dev que corra SQL: cuántos usuarios hay, de qué comuna/zona, qué cultivan, qué plan pagan y si la suscripción está `active`, y cuánto rinde la telemetría/audiencias. Hoy `admin/audiencias` y `admin/sponsorships` existen, pero no hay vista de usuarios/finanzas/huerto ni KPIs (`perfiles`, `gf_cultivos`, `gf_tareas`, `gf_registro`, `gf_arboles`, `gf_subscriptions`, `gf_analytics_events`). Sin eso no puede tomar decisiones de chum, MRR o qué especies empujar.

## What Changes

- **Nuevo `/admin` overview:** KPI cards (total usuarios, activos 30d, MRR por tier `huertero 9990 / cosecha 19990 / full 29990`, `gratuito` count), funnel `registro → trialing/pending → active → canceled`, últimos `preapproval` con `status_detail`.
- **`/admin/usuarios`:** tabla paginada de `perfiles` con `email, comuna, zona, plan, subscription_status`, buscador/filtro por `plan`/`zona`/`comuna`, drill-down a `gf_cultivos`/`gf_tareas`/`gf_registro`/`gf_arboles` y cambio de `plan` manual (admin) con auditoría.
- **`/admin/finanzas`:** `gf_subscriptions` por `plan`/`interval`/`status`, MRR real (`active` × monto `lib/payments/plans.ts:17`), `pending`/`canceled` con `external_reference` y link a MP `preapproval_id`.
- **Reutiliza RLS `is_admin()` `supabase/migrations/0006`:** solo `perfiles.plan=admin` ve todo; `proxy.ts:73` ya gatea `admin`. Sin nuevas tablas, solo lectura + `update perfiles.plan` auditado.

## Capabilities

### New Capabilities
- `admin/users`: gestión operativa de usuarios — listado, filtros, detalle de huerto y cambio de plan.
- `admin/metrics`: métricas de negocio y salud — KPIs, MRR, funnel, últimos eventos y suscripciones.

### Modified Capabilities
<!-- ninguna — amplía admin sin cambiar requisitos existentes -->

## Impact

- Código: `app/(dashboard)/admin/{page,usuarios,finanzas}/page.tsx`, `lib/admin/*`, `components/admin/*`, `app/api/v1/admin/users|metrics/route.ts` con `createAdminClient` y `is_admin` check.
- DB: solo lecturas agregadas + `UPDATE perfiles` auditado; sin migraciones.
- Permisos: `proxy.ts` + `is_admin()` ya cubren; si no es admin → `403`.
