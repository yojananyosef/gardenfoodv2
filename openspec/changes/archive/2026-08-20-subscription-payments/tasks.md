## 1. Modelo de datos

- [x] 1.1 Migración `0015_provider_rebrand`: renombra `flow_*` → `provider_*` en `gf_sponsorships` y `gf_subscriptions`, ajusta check `perfiles.payment_provider` a `mercadopago`, crea `gf_subscription_plans` + RLS (aplicada en vivo).
- [x] 1.2 `gf_subscriptions` (user_id, plan, status, provider_subscription_id, periodos, paid_via) + RLS dueño/admin.
- [x] 1.3 `lib/payments/plans.ts`: tiers `huertero`/`cosecha`/`full`, precios CLP, helper `mpPlanKey`.

## 2. Proveedor de pagos (Mercado Pago)

- [x] 2.1 `lib/payments/mercadopago.ts`: `mercadoPagoProvider` implementa `PaymentProvider` (auth Bearer). Métodos: `createPayment` (`/checkout/preferences`), `getStatus` (`/v1/payments/{id}`), `createSubscription` (crea `/preapproval` **sin plan**, con `auto_recurring` inline + `external_reference` + `status:"pending"`, devuelve `init_point`), `getSubscriptionStatus` (`/preapproval/{id}`), `getAuthorizedPayment` (`/authorized_payments/{id}`).
- [x] 2.2 `lib/payments/types.ts` reescrito a tipos agnósticos del proveedor (sin `createCustomer`/`registerCard`).

## 3. Checkout de patrocinio (pago único)

- [x] 3.1 `POST /api/v1/payments/checkout`: auth, monto del servidor, crea preferencia, guarda `provider_token`, devuelve `redirectUrl` (`sandbox_init_point` en test).
- [x] 3.2 Webhook `topic=payment`: busca patrocinio por `external_reference`, marca `paid`/`active`.

## 4. Suscripción recurrente

- [x] 4.1 `POST /api/v1/payments/subscribe`: inserta borrador en `gf_subscriptions` (`status:"trialing"`), crea `preapproval` **plan-less** con `auto_recurring` inline (monto CLP del tier, `free_trial` 14 días) + `external_reference` = id del borrador + `payer_email` = email del usuario, devuelve `url` (`init_point`) para redirigir al checkout hospedado de MP.
- [x] 4.2 `POST /api/v1/payments/subscribe/status`: verifica estado MP tras retorno y activa `perfiles.plan` + `subscription_status`.
- [x] 4.3 Webhook (`subscription_preapproval` / `subscription_authorized_payment` / `payment`): enlaza por `external_reference` (id del borrador en `gf_subscriptions`); `authorized`→`active`+`plan=tier`, `cancelled`→`gratuito`, `paused`→`inactive`, `pending`→`trialing`.
- [x] 4.4 `scripts/setup-mercadopago-plans.mjs`: creó los 6 `preapproval_plan` en MP (catálogo); el flujo actual NO los usa (suscripción sin plan, recurrencia inline). Tabla `gf_subscription_plans` queda como catálogo.

## 5. Gating por plan

- [x] 5.1 `proxy.ts`: redirige rutas core a `/pricing` si `perfiles.plan` no es tier de pago (`admin` pasa). Rutas libres: explorar, especies, calculadoras, perfil, pricing, suscripcion, login/registro.
- [x] 5.2 Página `/pricing` (3 tiers, mensual/anual) + `/suscripcion/confirmar`.

## 6. Validación

- [x] 6.1 typecheck + lint + build (Next 16) — OK; rutas `/api/v1/payments/*` compilan, las de Flow fueron eliminadas.
- [~] 6.2 Prueba sandbox Mercado Pago: **verificado** el create (`/preapproval` plan-less → `init_point`) + enlazado por webhook `external_reference` (script `e2e2_test.mjs` → PASS). **Pendiente** el paso final en navegador: el cliente ingresa la tarjeta en el `init_point` de MP → preapproval `authorized` → webhook activa `perfiles.plan`. Requiere (a) usuario prueba con email distinto al del vendedor MP, (b) webhook de MP apuntando a `/api/v1/payments/webhook`, (c) app con URL pública.
- [ ] 6.3 Commit + push + `openspec archive subscription-payments` (pendiente a decisión del usuario).

## Notas

- Se **eliminó** todo lo de Flow: `lib/payments/flow.ts`, `app/api/v1/flow/*`, `scripts/setup-flow-plans.mjs`, y las variables `FLOW_*` del `.env` (ahora `MP_*`).
- **Card token por API no sirve para `/preapproval`**: un `card_token_id` creado vía `/v1/card_tokens` (ni con public key ni con access token) da *"Card token service not found"* (404) o 503. MP tokeniza la tarjeta dentro de su propio checkout (`init_point`). Por eso la suscripción es **plan-less + `status:"pending"`** y redirigimos al checkout hospedado. `X-scope: stage` (de la doc) da 503 en esta cuenta TEST, así que NO se usa.
- **`payer_email` ≠ coleccionador**: MP rechaza con *"Payer and collector cannot be the same user"* si el email del pagador es el del dueño de la cuenta MP. En producción los clientes usan su propio email (OK); en nuestro usuario de prueba el email coincide con el vendedor, por lo que el `/subscribe` falla para ese usuario (esperado, no es bug).
- Tiers elegidos: los 3 (`huertero` $9.990/mes·$99.900/año, `cosecha` $19.990/mes·$199.900/año, `full` $29.990/mes·$299.900/año). Anual = 10× mensual. Trial 14 días.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` quedó sin uso (ya no hay Bricks); se puede eliminar del `.env` si se quiere.
