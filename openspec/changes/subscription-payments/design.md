## Context

GardenFood se monetiza con tres modelos. El modelo 1 (suscripción por uso) aún no existe en
código: `perfiles.plan` solo conoce `free`/`admin`. El módulo de pagos ya está generalizado
(`lib/payments`, interfaz `PaymentProvider`) gracias a `flow-sponsorships`, así que este cambio
se apoya en esa base en vez de duplicarla.

## Goals / Non-Goals

**Goals:**
- Cobrar la suscripción mensual en CLP con Flow.cl (local, sin Stripe).
- Activar/desactivar `perfiles.plan = premium` solo tras confirmación firmada de Flow.
- Gatear funciones core cuando no hay plan activo, vía `proxy.ts`.
- Trazabilidad recurrente en `gf_subscriptions` (periodos, cancelación).

**Non-Goals:**
- Facturación/boleta electrónica (otra iteración).
- Múltiples tiers de precio (un solo tier `premium` por ahora).
- Implementar PayPal en este cambio (queda para el conector internacional).

## Decisions

- **Reutilizar `lib/payments`**: se añade un método de suscripción a `PaymentProvider` (o un
  conector `FlowSubscription`) en vez de crear un cliente aparte. La firma HMAC SHA256 ya está
  implementada y es idéntica a la que exige Flow para suscripciones.
- **Modelo de planes de Flow**: se crean los planes con `POST /plans/create`
  (`interval` 3=mensual / 4=anual, `amount`, `trial_period_days`, `periods_number`, `urlCallback`)
  y se suscribe al usuario con `POST /subscriptions/create` tras `customers/create` +
  `register-card`. El webhook `urlCallback` notifica cada cobro recurrente.
- **Webhook unificado**: `POST /api/v1/flow/webhook` distingue `kind` (`sponsorship` |
  `subscription`) y enruta a activar slot o plan. Para suscripciones, Flow notifica por
  `urlCallback` y podemos cruzar con `subscriptions/status` para idempotencia.
- **Gating en `proxy.ts`**: el acceso a rutas core chequea `perfiles.plan`; si no es `premium`/
  `business`, redirige a `/pricing`. Aprovecha el mecanismo de protección de rutas existente.
- **Monto del servidor**: el precio del plan vive en config/DB (tabla de planes o constantes),
  nunca en el cliente.

## Sandbox (pruebas)

- Credenciales `apiKey`/`secretKey`: se obtienen al crear un **comercio de prueba** en el portal
  de Flow (la página "Credenciales de prueba" solo lista tarjetas de test, no el apiKey/secret).
- Tarjetas de prueba Chile: `4051885600446623` / 11-27 / 123 (RUT `11111111-1`, clave `123`).
- Recurrentes (Perú): aceptado `5293138086430769` / CVV 123; rechazado `4551708161768059`.

## Risks / Trade-offs

- [Risk] Flow no soporta suscripciones idénticas a Stripe → Mitigation: usar orden recurrente de
  Flow o cobro mensual automatizado; confirmar API de Flow en la fase de implementación.
- [Risk] Gating rompe la experiencia free → Mitigation: mantener explorar/especies libres y solo
  gatear core; mensaje claro en `/pricing`.
- [Risk] Webhook de renovación no llega → Mitigation: `current_period_end` + job de reconciliación
  (fuera de alcance inicial, se anota).

## Migration Plan

1. Migración: crear `gf_subscriptions` + añadir valor `premium` a `perfiles.plan` (enum/check).
2. Extender `lib/payments` con método de suscripción Flow.
3. Rutas `subscribe` + extender webhook con `kind=subscription`.
4. Gating en `proxy.ts` + página `/pricing`.
5. typecheck/lint/build + prueba en sandbox Flow (suscripción → webhook → plan activo).
