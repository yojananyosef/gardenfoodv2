# Tasks — harden-payments-and-rls

## 1. Base de datos (migración 0018)

- [x] 1.1 Trigger `guarda_columnas_plan_perfiles`: bloquea a JWT autenticado cambiar `plan`/`subscription_status`/`subscription_id`/`payment_provider` en su propia fila
- [x] 1.2 RLS `gf_analytics_events`: insert solo con `user_id IS NULL` o `auth.uid()`
- [x] 1.3 RLS `gf_sponsorships`: lectura pública solo `payment_status='paid' AND active=true`
- [x] 1.4 RLS `gf_user_consents`: drop de la política anónima `FOR ALL` (server-mediated vía service role)

## 2. Mapeo y webhook

- [x] 2.1 `lib/payments/preapproval.ts`: `mapPreapprovalStatus` (solo `authorized` concede)
- [x] 2.2 `lib/payments/signature.ts`: extraer `verifyMercadoPagoSignature` + ventana replay ±600 s inyectable
- [x] 2.3 Webhook: secret obligatorio en prod (500 si falta), anti-replay, update de draft por `external_reference`, usar mapeo unificado
- [x] 2.4 `subscribe/status`: usar mapeo unificado (fin del self-upgrade por polling)
- [x] 2.5 `/suscripcion/confirmar`: mensaje "pago pendiente" cuando `grantsAccess=false`

## 3. Rutas y libs

- [x] 3.1 `cmp/consent`: service role para lookup/upsert (anon key sin acceso directo a consents)
- [x] 3.2 `payments/checkout`: gate `isAdmin`
- [x] 3.3 `admin/sponsorships` POST: autenticar antes de validar payload
- [x] 3.4 `admin/audiences/refresh`: `CRON_SECRET` con `timingSafeEqual`
- [x] 3.5 `lib/ads/sponsorships.ts`: filtro `payment_status='paid'`
- [x] 3.6 `lib/payments/types.ts`: añadir `"past_due"` a `SubscriptionStatus`

## 4. Docs y tests

- [x] 4.1 README + `.env.example`: `MP_WEBHOOK_SECRET` obligatorio en producción
- [x] 4.2 Tests: firma válida/tamper/replay + mapeo de estados (concesión solo `authorized`)
- [x] 4.3 QA: test/lint/typecheck/build verdes
