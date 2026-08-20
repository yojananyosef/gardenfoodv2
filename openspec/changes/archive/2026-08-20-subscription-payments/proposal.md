## Why

GardenFood tiene tres modelos de negocio: (1) suscripción por uso de la app, (2) patrocinios
(anuncios) cobrados por el sponsor, y (3) publicidad potenciada con datos de usuario (targeting
sobre patrocinios). Este cambio cubre el **modelo 1** (suscripción recurrente) y deja la base
lista para el **modelo 2** (ya implementado). Ambos usan **Mercado Pago** como único proveedor
de pagos.

Se migró desde Flow.cl: Flow exige un contrato de "cargo automático" para suscripciones
recurrentes que la empresa no pudo habilitar. Mercado Pago incluye el cobro recurrente automático
de forma nativa (sin contrato aparte) y opera en Chile (`MLC`), por lo que es el proveedor
correcto para los tres módulos.

Hoy `perfiles.plan` ya trae `gratuito | huertero | cosecha | full | admin` y columnas de
suscripción. Necesitábamos un flujo que cree la suscripción en Mercado Pago, confirme por
webhook y active el plan en `perfiles`, y que bloquee rutas core sin plan activo.

## What Changes

- Tabla `gf_subscriptions` (user_id, plan, status, provider_subscription_id, periodos, paid_via)
  para trazabilidad recurrente + RLS (dueño ve la suya; admin ve todas).
- Catálogo `gf_subscription_plans` que cachea los `preapproval_plan` de Mercado Pago por
  tier+intervalo.
- `perfiles.payment_provider` solo acepta `mercadopago`; el webhook activa/desactiva `plan`
  según el estado de la suscripción.
- Rutas (handler) bajo `/api/v1/payments/*`:
  - `POST /api/v1/payments/checkout` — pago único de patrocinio (Checkout Pro).
  - `POST /api/v1/payments/subscribe` — crea la suscripción (preapproval) y devuelve `init_point`.
  - `POST /api/v1/payments/subscribe/status` — verifica estado tras volver de Mercado Pago.
  - `GET|POST /api/v1/payments/webhook` — notificaciones (payment / preapproval).
- **Gating**: `proxy.ts` redirige a `/pricing` al acceder a ruta core sin plan de pago
  (`admin` siempre pasa).
- `lib/payments` con interfaz `PaymentProvider`; `mercadoPagoProvider` la implementa (auth Bearer,
  sin HMAC).

## Capabilities

### New Capabilities
- `payments/subscription`: suscripción recurrente CLP (Mercado Pago) — creación del plan
  (`preapproval_plan`) + suscripción (`preapproval`), redirección a la pasarela, confirmación por
  webhook, y sincronización del plan en `perfiles`. Cobro recurrente automático nativo.

### Modified Capabilities
- `payments/sponsorship`: el checkout (antes Flow) ahora usa Mercado Pago Checkout Pro
  (`/checkout/preferences` → `init_point`); el webhook distingue `topic=payment` (patrocinio) de
  `topic=preapproval` (suscripción) usando `external_reference` como clave de join.

## Impact

- **Datos**: `gf_subscriptions`, `gf_subscription_plans`, `gf_sponsorships` (provider_token/
  provider_payment_id), `perfiles.payment_provider` (check `mercadopago`), RLS.
- **API**: rutas bajo `/api/v1/payments/*` + gating en `proxy.ts`.
- **Navegación**: `/pricing`, `/suscripcion/confirmar`.
- **Config**: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` (reemplazan `FLOW_*`).

## Precios (definidos con el usuario)

| Plan | Mensual | Anual (10×, ~2 meses gratis) |
|------|---------|------------------------------|
| `huertero` | **$9.990 / mes** | **$99.900 / año** |
| `cosecha` | **$19.990 / mes** | **$199.900 / año** |
| `full` | **$29.990 / mes** | **$299.900 / año** |

- Trial: 14 días (`free_trial` en el plan de Mercado Pago), sin cargo.
- Anual = 12 mensualidades (`frequency=12`, `frequency_type=months`).
- Todos los tiers son de pago; `gratuito` es el default y `admin` salta el gating.
