# Design — harden-payments-and-rls

## 1. Guard de columnas de plan en `perfiles` (trigger, no política)

RLS no puede comparar NEW contra OLD en `WITH CHECK`, así que la protección correcta es un trigger `BEFORE UPDATE`:

```sql
if auth.uid() is not null then  -- solo requests con JWT de usuario autenticado
  if new.plan is distinct from old.plan or ... then raise exception
end if;
```

- `auth.uid() IS NULL` cubre: service role (JWT sin sub), postgres/SQL editor, cron → pasan sin restricción.
- Usuario autenticado actualizando su propia fila: `comuna`, `terreno_geojson`, etc. siguen libres; columnas de plan bloqueadas.
- `security definer` + `search_path = public` fijo (best practice Supabase).

## 2. Mapeo unificado `mapPreapprovalStatus(mp)`

Hoy hay dos mapeos que discrepan (status: `pending→grantsAccess:true`; webhook: plan solo en `active`). Nueva función única en `lib/payments/preapproval.ts`:

| MP | sub | grantsAccess |
|---|---|---|
| authorized | active | **true** |
| pending | trialing | false |
| cancelled | canceled | false |
| paused | inactive | false |
| desconocido | trialing | false |

Solo `authorized` concede. `pending` sigue mapeando a `trialing` (semántica de trial futuro si se re-activa) pero **sin** conceder plan. El webhook usa `.sub`; el status route usa ambos.

## 3. Webhook

- **Secret en prod**: `NODE_ENV=production && !MP_WEBHOOK_SECRET → 500`. En dev sigue el warn y procesa (DX local).
- **Anti-replay**: `|now − ts| > 600 s → 401`. Ventana holgada para reintentos de MP.
- **Race del draft**: `handleSubscription` ya resuelve la fila por `external_reference` (`subRow.id`); `applySubscription` recibirá ese `id` y actualizará `.eq("id", draftId)` — se elimina el re-fetch "latest by user".
- **Extracción**: `verifyMercadoPagoSignature` → `lib/payments/signature.ts` con parámetro `nowSeconds` inyectable para tests.

## 4. Consent anónimo server-mediated

El navegador nunca escribe directo en `gf_user_consents` (todo pasa por `POST /api/v1/cmp/consent`). La ruta pasa a `createAdminClient()` para lookup/upsert y queda la validación zod + scope por `device_id` server-side. La anon key queda sin políticas sobre filas anónimas (INSERT/UPDATE/SELECT/DELETE bloqueados a nivel DB). Riesgo cero de regresión: los únicos lectores (route + `hasPersonalizationConsent` para usuarios autenticados) usan admin/user-client con su propia política.

## 5. Sponsorships

- Policy pública: `USING (payment_status = 'paid' AND active = true)`.
- `getActiveSponsorships` añade `.eq("payment_status", "paid")` para paridad con la policy (los admins ven todo vía `is_admin()`/service role).
- `/payments/checkout` ahora exige `isAdmin`: el pago de un sponsorship se inicia desde `/admin/sponsorships`; un usuario no-admin no tiene negocio con ese endpoint.

## 6. Menores

- `PaymentStatus`/`SubscriptionStatus`: `lib/payments/types.ts` gana `"past_due"` (ya existe en `types/index.ts` y en el CHECK de DB).
- `CRON_SECRET` con `timingSafeEqual` (longitud igualada antes de comparar).
- `/suscripcion/confirmar`: con `grantsAccess:false` muestra "Pago pendiente de confirmación" (el mensaje actual dice "tu plan ya está activo" para `trialing`).
- README + `.env.example`: `MP_WEBHOOK_SECRET` obligatorio en producción.

## Migración 0018 — orden y reversibilidad

1. Función + trigger en `perfiles` (idempotente con `drop trigger if exists` / `create or replace`).
2. `drop policy if exists` + recreate para telemetría y sponsorships (nombres nuevos).
3. `drop policy if exists "Anonymous device consent"` — el índice único parcial `idx_user_consents_anonymous_device` se conserva.

Despliegue: `supabase db push` tras deploy del código que usa admin client en consent (el código nuevo tolera ambas configuraciones de RLS; la DB nueva bloquea lo viejo).
