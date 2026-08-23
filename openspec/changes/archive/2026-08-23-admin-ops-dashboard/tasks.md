## 1. Admin overview — KPIs

- [x] 1.1 `app/(dashboard)/admin/page.tsx` — cards `total usuarios` (`perfiles` count), `MRR` (sum `active` `gf_subscriptions` × `planAmount` `lib/payments/plans.ts:17`), `gratuito` count, funnel `pending→active→canceled` con `createAdminClient` + `is_admin` guard, `403` si no admin.
- [x] 1.2 `lib/admin/metrics.ts` — helpers `getMRR()`, `getFunnel()`, `getActive30d()` (distinct `gf_analytics_events.user_id` 30d), con `limit` y `count` exact.
- [x] 1.3 Health signals en overview: `eventos 24h` (`gf_analytics_events` count), `webhook 100%` (últimos 27 `subscription_preapproval` ok), `top comunas` por `gf_cultivos` (group by `perfiles.comuna`).

## 2. Usuarios — tabla y detalle

- [x] 2.1 `app/(dashboard)/admin/usuarios/page.tsx` — tabla paginada 20 `perfiles` con `email, nombre, region, comuna, zona (getZonaDeComuna), plan, subscription_status, created_at`, filtros `plan`/`zona`/`comuna`/`email` via `searchParams`, orden `created_at desc`, `is_admin` guard.
- [x] 2.2 `components/admin/UserDetailDrawer.tsx` — al click abre `gf_cultivos` (especies), `gf_tareas` (counts por `estado`), `gf_registro` (sum kg), `gf_arboles`, `gf_subscriptions` (plan, interval, status, `provider_subscription_id` link `https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=...`).
- [x] 2.3 `app/api/v1/admin/users/[id]/route.ts` — `GET` detalle + `PATCH` `plan`/`subscription_status` con `zod` `gratuito|huertero|cosecha|full` y `inactive|trialing|active|canceled`, `is_admin` check, `UPDATE perfiles` + `console.log [admin] actor -> user plan`.

## 3. Finanzas — suscripciones

- [x] 3.1 `app/(dashboard)/admin/finanzas/page.tsx` — tabla `gf_subscriptions` `plan/interval/status` con `external_reference`, `provider_subscription_id` link MP, filtros `status`/`plan`, paginación 20, `is_admin`.
- [x] 3.2 `lib/admin/finanzas.ts` — `getSubscriptionsGrouped()` y `getMRRByTier()` para `overview` y `finanzas`.

## 4. API y validación

- [x] 4.1 `app/api/v1/admin/metrics/route.ts` — `GET` JSON `{ totalUsuarios, mrr, funnel, eventos24h, topComunas }` con `is_admin` guard para `overview` SSR y posible `revalidate`.
- [x] 4.2 `tests/admin-ops.test.ts` — `is_admin` 403, `MRR` con `active` `huertero 9990` + `full 29990`, `list users` filtra `plan`.
- [x] 4.3 `pnpm typecheck && pnpm test && pnpm build` verde; `proxy.ts` ya gatea `/admin`.

