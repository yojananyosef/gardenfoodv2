# harden-payments-and-rls

## Why

La auditoría P0 encontró 5 huecos que combinados permiten: (1) un usuario autenticado se auto-promueve a `admin` o a plan pago porque la política RLS de `perfiles` le permite UPDATEar su propia fila sin restricción de columnas — y todo el sistema (`isAdmin`, rutas `/api/v1/admin/*`) confía en esa columna; (2) un usuario que abandona el checkout de Mercado Pago (preapproval `pending`, nunca pagó) obtiene acceso pago haciendo polling a `/subscribe/status`, que mapea `pending → trialing → grantsAccess: true`; (3) el webhook acepta notificaciones sin firma si `MP_WEBHOOK_SECRET` no está configurado (en prod = mutación no autenticada de planes) y sin ventana anti-replay; (4) la inserción de telemetría es `WITH CHECK (true)` con `user_id` arbitrario → envenenamiento de las señales B2B; (5) la política anónima de `gf_user_consents` (`USING user_id is null`) deja a cualquiera con la anon key leer/modificar/borrar **todas** las filas anónimas de consentimiento, incluyendo IP y User-Agent. Además: el webhook actualiza el draft "más reciente" del usuario en vez del identificado por `external_reference` (race), y las filas de sponsorship no pagadas son legibles por cualquiera.

## What Changes

- **Migración 0018**: trigger `BEFORE UPDATE` en `perfiles` que bloquea a usuarios autenticados cambiar `plan`, `subscription_status`, `subscription_id`, `payment_provider` sobre su propia fila (el service role y el acceso directo a DB quedan exentos). Sin cambios de políticas de SELECT/INSERT de `perfiles`.
- **RLS telemetría**: `WITH CHECK (user_id IS NULL OR user_id = auth.uid())` — anónimo inserta eventos de dispositivo, autenticado solo con su propio `user_id`; fin de la atribución falsable.
- **RLS sponsorships**: lectura pública solo de filas `payment_status = 'paid' AND active = true`; los admins siguen viendo todo vía `is_admin()` / service role. `getActiveSponsorships` añade el filtro explícito.
- **RLS consents anónimos**: se elimina la política "Anonymous device consent"; la ruta `/api/v1/cmp/consent` pasa a service role (valida y scopea por `device_id` server-side). La anon key pierde todo acceso directo a `gf_user_consents`.
- **Mapeo unificado de preapproval** (`lib/payments/preapproval.ts`): solo `authorized` concede plan; `pending`/desconocido → `trialing` sin acceso. Webhook y `subscribe/status` usan la misma función (hoy discrepan).
- **Webhook endurecido**: en producción exige `MP_WEBHOOK_SECRET` (rechaza con 500 si falta); ventana anti-replay de `ts` (±600 s); actualiza el draft identificado por `external_reference`, no el "más reciente"; `verifyMercadoPagoSignature` extraída a `lib/payments/signature.ts` (testeable).
- **Gates menores**: `/api/v1/payments/checkout` exige `isAdmin` (el pago de sponsorships es operación admin); `POST /api/v1/admin/sponsorships` autentica antes de validar payload; `CRON_SECRET` comparado con `timingSafeEqual`.

## Capabilities

### Modified Capabilities

- `payments/subscription`: webhook exige secret en prod + anti-replay + update por `external_reference`; la confirmación síncrona solo concede acceso con `authorized`.
- `adtech/telemetry`: la inserción ya no acepta `user_id` arbitrario (null o propio).
- `adtech/consent`: las filas anónimas de consentimiento son server-mediated; la anon key no accede directo.
- `adtech/ads`: la lectura pública de sponsorships solo expone unidades pagadas y activas.
- `garden/auth`: ADDED — las columnas de plan/suscripción del perfil son server-managed (trigger).

## Impact

- **Código**: `app/api/v1/payments/{webhook,subscribe/status,checkout}/route.ts`, `app/api/v1/admin/sponsorships/route.ts`, `app/api/v1/admin/audiences/refresh/route.ts`, `app/api/v1/cmp/consent/route.ts`, `lib/payments/{preapproval,signature}.ts` (nuevos), `lib/ads/sponsorships.ts`, `lib/payments/types.ts` (drift `past_due`), página `/suscripcion/confirmar`, README, `.env.example`.
- **Base de datos**: migración `0018_security_hardening.sql` (trigger + 3 políticas). Requiere `supabase db push`.
- **Riesgo operacional controlado**: si `MP_WEBHOOK_SECRET` falta en prod, el webhook ahora falla ruidosamente (500) — intencional: es preferible a aceptar mutaciones sin firmar.
