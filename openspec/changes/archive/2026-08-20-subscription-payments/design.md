## Context

GardenFood se monetiza con tres modelos. El modelo 1 (suscripción por uso) se implementó sobre
Mercado Pago tras descartar Flow.cl (Flow exigía un contrato de "cargo automático" que la empresa
no pudo habilitar; Mercado Pago incluye el cobro recurrente automático de forma nativa y opera en
Chile). El módulo de pagos es genérico (`lib/payments`, interfaz `PaymentProvider`), así que el
proveedor es intercambiable.

## Goals / Non-Goals

**Goals:**
- Cobrar la suscripción recurrente en CLP con Mercado Pago (nativo, sin contrato aparte).
- Activar/desactivar `perfiles.plan` solo tras confirmación del webhook de Mercado Pago.
- Gatear funciones core sin plan activo vía `proxy.ts`.
- Trazabilidad recurrente en `gf_subscriptions` (periodos, cancelación).

**Non-Goals:**
- Facturación/boleta electrónica (otra iteración).
- Modelo 3 (ads con datos) — es targeting sobre patrocinios, no pago.

## Decisions

- **Proveedor único: Mercado Pago.** `mercadoPagoProvider` implementa `PaymentProvider` con auth
  Bearer (`MP_ACCESS_TOKEN`), sin firma HMAC. Reemplaza por completo a Flow.
- **Suscripción (`preapproval`)**: se crea el plan con `POST /preapproval_plan`
  (`auto_recurring` con `frequency`/`frequency_type`, `transaction_amount`, `currency_id=CLP`,
  `free_trial` 14 días) y se suscribe al usuario con `POST /preapproval` pasando
  `preapproval_plan_id`, `external_reference` (id de `gf_subscriptions`), `payer_email` y `back_url`.
  Mercado Pago devuelve `init_point` a donde redirigimos al usuario; él autoriza la tarjeta allí
  (sin paso separado de enrolamiento de tarjeta). El webhook (`topic=preapproval`) confirma.
- **Pago único (`checkout/preferences`)**: `POST /checkout/preferences` con `items`, `payer`,
  `back_urls`, `notification_url` y `external_reference` = id del patrocinio. Devuelve `init_point`
  (o `sandbox_init_point` con credenciales de test). Webhook `topic=payment`.
- **Webhook unificado en `/api/v1/payments/webhook`** (GET IPN y POST). Usa `external_reference`
  como clave de join: para `payment` busca en `gf_sponsorships`; para `preapproval` busca en
  `gf_subscriptions`. Siempre responde 200.
- **Planes cacheados** en `gf_subscription_plans` (lazy-created por la ruta `subscribe` o por
  `scripts/setup-mercadopago-plans.mjs`).
- **Gating en `proxy.ts`**: rutas core redirigen a `/pricing` si `perfiles.plan` no es tier de
  pago; `admin` siempre pasa.
- **Monto del servidor**: el precio vive en `lib/payments/plans.ts`, nunca en el cliente.

## Sandbox (pruebas)

- Credenciales de prueba de Mercado Pago: `MP_ACCESS_TOKEN` (test) y `MP_PUBLIC_KEY`.
- Con credenciales de test el checkout devuelve `sandbox_init_point` y los pagos usan usuarios y
  tarjetas de prueba de Mercado Pago (no plata real).
- El webhook de Mercado Pago necesita una URL pública: en local usa un túnel (ngrok/cloudflared)
  apuntando a `/api/v1/payments/webhook`, o invócalo manualmente.

## Risks / Trade-offs

- [Risk] Webhook no llega en local → Mitigation: la ruta `subscribe/status` verifica el estado
  directo contra la API de Mercado Pago tras el retorno del usuario.
- [Risk] Gating rompe la experiencia free → Mitigation: explorar/especies/calculadoras/perfil/
  pricing/suscripcion quedan libres; mensaje claro en `/pricing`.
- [Risk] Renovación recurrente no notifica → Mitigation: `current_period_end` + `paid_via`;
  reconciliación futura fuera de alcance.

## Migration Plan

1. Migración `0015_provider_rebrand`: renombra `flow_*` → `provider_*`, ajusta check de
   `payment_provider` a `mercadopago`, crea `gf_subscription_plans`.
2. `lib/payments/mercadopago.ts` (proveedor) + `plans.ts` (tiers/precios).
3. Rutas `/api/v1/payments/{checkout,subscribe,subscribe/status,webhook}`.
4. Gating en `proxy.ts` + páginas `/pricing` y `/suscripcion/confirmar`.
5. typecheck/lint/build + prueba en sandbox Mercado Pago (suscripción → webhook → plan activo).
