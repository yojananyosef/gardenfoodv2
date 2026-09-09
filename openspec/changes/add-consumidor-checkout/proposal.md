# Change: Cumplimiento Ley del Consumidor en el checkout

## Why
Hoy el botón "Suscribirse" envía al usuario a Mercado Pago sin capturar aceptación explícita de los Términos y Condiciones, y la página de retorno (`/suscripcion/confirmar`) no entrega la confirmación escrita del contrato. En una contratación electrónica sin prueba de aceptación ni confirmación escrita, el derecho de retracto (art. 3 bis Ley 19.496) sube de 10 a 90 días corridos: riesgo directo de devoluciones y disputas.

## What Changes
- **Aviso destacado pre-checkout en `/pricing`**: caja con derecho de retracto (10 días corridos), débito automático vía Mercado Pago, cancelación desde el perfil y enlaces a Términos y Política de privacidad.
- **Checkbox de aceptación obligatorio**: el botón "Suscribirse" queda deshabilitado hasta marcar "He leído y acepto los Términos y Condiciones y la Política de privacidad"; el consentimiento viaja al backend.
- **Prueba de aceptación registrada** (migración 0025): `gf_subscriptions` gana `terminos_aceptados_at` y `terminos_aceptados_version`; el endpoint de suscripción rechaza con 400 si el cuerpo no declara la aceptación y la guarda en el draft.
- **Confirmación escrita del contrato** en `/suscripcion/confirmar`: resumen con plan contratado, monto e intervalo, débito automático, cancelación, retracto de 10 días y contacto de soporte.
- SII/boletas: sigue diferida (deuda operacional registrada en PENDING.md), sin cambio en esta fase.

## Impact
- **Affected specs**: `payments/consumidor` (nueva capability).
- **Affected code**: `supabase/migrations/0025_*`, `app/api/v1/payments/subscribe/route.ts` (gate + registro), `app/(public)/pricing/page.tsx` (checkbox + aviso), `app/api/v1/payments/subscribe/status/route.ts` (responde plan/interval/monto), `app/(dashboard)/suscripcion/confirmar/page.tsx` (resumen de condiciones).
- No breaking: el flujo de compra sigue igual para el usuario, solo con un checkbox y aviso previos.
