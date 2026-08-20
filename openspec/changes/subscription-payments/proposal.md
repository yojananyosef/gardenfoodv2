## Why

GardenFood tiene tres modelos de negocio: (1) suscripción por uso de la app, (2) patrocinios
cobrados con Flow (ya implementado en `flow-sponsorships`), y (3) publicidad potenciada con
datos de usuario. Este cambio ataca el **modelo 1**: cobrar a los usuarios una cuota recurrente
para usar la app, en CLP y localmente, vía Flow.cl (Stripe no opera pagos locales en Chile).

Hoy `perfiles.plan` existe (`free`/`admin`) pero no hay cobro ni gating asociado. Necesitamos
un flujo de suscripción que cree la orden en Flow, confirme por webhook y habilite el plan
`premium`/`pro` en el perfil, además de bloquear funciones core cuando no hay plan activo.

## What Changes

- Nueva tabla `gf_subscriptions` (user_id, plan, status, flow_subscription_id,
  current_period_start, current_period_end, cancel_at, paid_via) para trazabilidad recurrente.
- `perfiles.plan` gana el valor `premium` (o `pro`); el webhook lo activa/desactiva según el estado.
- Nuevas rutas Route Handler: `POST /api/v1/flow/subscribe` (auth + monto/plan del servidor) y
  reutiliza/extiende `POST /api/v1/flow/webhook` para suscripciones (ver design.md).
- **Gating**: el `proxy.ts` (ex-middleware) redirige a `/pricing` cuando una ruta core se accede
  sin plan activo (asunción: lista de rutas core por confirmar).
- Reutiliza `lib/payments` (interfaz `PaymentProvider`); se añade un método de suscripción al
  proveedor Flow (o un conector Flow Subscription).

## Capabilities

### New Capabilities
- `payments/subscription`: cobro recurrente local (CLP) de la suscripción de uso de la app con
  Flow.cl — creación de la suscripción/orden recurrente, redirección a la pasarela, confirmación
  por webhook, renovación/cancelación y sincronización del plan en `perfiles`.

### Modified Capabilities
- `payments/flow`: el webhook pasa a distinguir intención `sponsorship` vs `subscription`
  (misma ruta, distinto payload/origen) para activar el slot o el plan según corresponda.

## Impact

- **Datos**: nueva tabla `gf_subscriptions` + columna/valor `premium` en `perfiles.plan` + RLS
  (el usuario ve su propia suscripción; admin ve todas).
- **API**: ruta `POST /api/v1/flow/subscribe` (requiere sesión) y extensión del webhook.
- **Navegación**: `proxy.ts` gana gating por plan (redirección a `/pricing`).
- **Config**: reutiliza `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_URL` y añade `NEXT_PUBLIC_PRICING_*`.

## Precios referencia (investigados, editables)

Benchmark de SaaS B2B agtech / gestión de huertos (precios en USD/EUR; Chile en CLP):
KernelAg $12–32/mes, Farmbrite $29–59/mes, Solara $29–99/mes, CamoAg $15–99/mes,
GardenBud $20–30/mes, Farmable €33/mes·$399/año, SeedSort ~£40/año. Patrón dominante:
**mensual + anual con ~15–20% de descuento** (≈2 meses "gratis") y trial de 14 días.

Precios **referencia** propuestos para GardenFood (CLP, editables luego):

| Plan | Mensual | Anual (ahorro ~17%) |
|------|---------|---------------------|
| `premium` (prosumer / huerta pro) | **$9.990 / mes** | **$99.900 / año** (~$8.325/mes) |
| `business` (restaurantes, cooperativas, municipalidades) | **$29.990 / mes** | **$299.900 / año** |

- Trial: `trial_period_days = 14` (sin cargo).
- Anual implementado en Flow como `interval = 4` (amount = $99.900 / $299.900).

## Assumptions (a confirmar)

- **Precio/periodo**: suscripción **mensual y anual** en CLP (precios referencia arriba; editables).
- **Planes**: dos tiers de pago (`premium`, `business`); `free` es el default.
- **Gating**: se bloquean rutas core (huerto, calendario, cosechas) sin plan; explorar/especies
  quedan libres (lista exacta por confirmar).
- **Renovación**: Flow maneja el cobro recurrente vía planes; el webhook (`urlCallback`) actualiza
  `current_period_end`.
- **Cancelación**: el usuario cancela desde `/perfil`; el plan sigue activo hasta `current_period_end`.
