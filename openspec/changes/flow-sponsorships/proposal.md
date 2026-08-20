## Why

Stripe no habilita pagos locales en Chile, así que la patrocinación (`gf_sponsorships`)
no se puede cobrar con esa pasarela. Flow.cl es un agregador chileno (Webpay, Multicaja,
transferencias) que sí permite cobros en CLP a residentes locales. Necesitamos cobrar
patrocinaciones con Flow y, a futuro, complementar con PayPal para patrocinadores
internacionales.

## What Changes

- Cobro de patrocinaciones vía **Flow.cl**: se crea una orden de pago en Flow, se redirige
  al usuario a la pasarela de Flow, y Flow confirma vía `urlConfirmation` (webhook firmado).
- En la confirmación se verifica la firma de Flow y se consulta el estado real con
  `payment/getStatus` antes de activar la campaña (fuente de verdad).
- `gf_sponsorships` gana trazabilidad de pago (`payment_status`, `flow_token`/`commerceOrder`,
  `flow_payment_id`, `paid_at`).
- Nuevas rutas Route Handler: `POST /api/v1/flow/checkout` y `POST /api/v1/flow/webhook`.
- Activación solo tras pago confirmado; estado `draft → pending → paid`.
- Variables de entorno: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL`
  (sandbox `https://sandbox.flow.cl` / producción `https://www.flow.cl`).

## Capabilities

### New Capabilities
- `payments/flow`: cobro local de patrocinaciones con Flow.cl — creación de orden de pago,
  redirección a la pasarela, confirmación por webhook firmado, verificación de estado e
  idempotencia. Deja preparado un punto de extensión para un segundo proveedor
  (PayPal) para pagos internacionales.

### Modified Capabilities
<!-- sin capabilities existentes cuyo comportamiento (requirements) cambie a nivel spec -->

## Impact

- **Datos**: migración que añade columnas de pago a `gf_sponsorships` + RLS coherente.
- **API**: dos nuevos Route Handlers bajo `/api/v1/flow/*` (checkout requiere sesión;
  webhook valida firma de Flow con `FLOW_SECRET_KEY`).
- **Dependencias**: cliente HTTP para la API de Flow (sin SDK oficial estable; se usa
  `fetch` + firma HMAC SHA256 sobre los parámetros).
- **Config**: credenciales de Flow en Vercel + `urlConfirmation` apuntando al webhook.
- **Futuro**: PayPal como segundo conector detrás de la misma interfaz de pago.

## Assumptions (a confirmar)

- **Moneda**: CLP (Flow la maneja sin decimales).
- **Modelo**: pago **único** por patrocinación (no suscripción).
- **Confirmación**: webhook de Flow (`urlConfirmation`) como disparador, verificando
  firmando los parámetros recibidos y consultando `payment/getStatus`.
- La patrocinación ya tiene un monto/plan definido que se envía a Flow (no se confía en el cliente).
