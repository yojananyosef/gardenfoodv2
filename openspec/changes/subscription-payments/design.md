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
  conector `FlowSubscription`) en vez de crear un cliente aparte.
- **Webhook unificado**: `POST /api/v1/flow/webhook` distingue `kind` (`sponsorship` |
  `subscription`) y enruta a activar slot o plan. Ya verifica vía `getStatus`.
- **Gating en `proxy.ts`**: el acceso a rutas core chequea `perfiles.plan`; si no es `premium`,
  redirige a `/pricing`. Esto aprovecha el mecanismo de protección de rutas ya existente.
- **Monto del servidor**: el precio del plan vive en config/DB, nunca en el cliente.

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
