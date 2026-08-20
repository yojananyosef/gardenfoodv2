## 1. Modelo de datos

- [ ] 1.1 Migración: tabla `gf_subscriptions` (user_id, plan, status, flow_subscription_id, current_period_start, current_period_end, cancel_at, paid_via) + RLS (dueño ve la suya; admin ve todas)
- [ ] 1.2 Migración: añadir valor `premium` a `perfiles.plan`
- [ ] 1.3 Extender tipos: `Subscription`, `PlanStatus` en `types/index.ts`

## 2. Proveedor de pagos (suscripción)

- [ ] 2.1 Añadir método de suscripción a `PaymentProvider` / conector Flow (orden recurrente)
- [ ] 2.2 Reutilizar firma HMAC SHA256 existente en `lib/payments/flow.ts`

## 3. Checkout de suscripción

- [ ] 3.1 `POST /api/v1/flow/subscribe`: auth, monto/plan del servidor, crea suscripción en Flow, guarda `flow_subscription_id`, devuelve `redirect_url`
- [ ] 3.2 Página `/pricing` con plan y CTA a suscribirse

## 4. Webhook (suscripción)

- [ ] 4.1 Extender `POST /api/v1/flow/webhook` para distinguir `kind=subscription`
- [ ] 4.2 Activar `perfiles.plan = premium` y registrar periodo al confirmar; desactivar en cancelación/expiración
- [ ] 4.3 Idempotencia por `flow_subscription_id`

## 5. Gating por plan

- [ ] 5.1 `proxy.ts`: redirigir rutas core a `/pricing` si `perfiles.plan != premium`
- [ ] 5.2 Definir lista de rutas core gateadas (explorar/especies quedan libres)

## 6. Validación

- [ ] 6.1 typecheck + lint + build
- [ ] 6.2 Prueba en sandbox Flow (suscripción → webhook → plan activo → gating)
- [ ] 6.3 Commit + push + `openspec archive subscription-payments`
