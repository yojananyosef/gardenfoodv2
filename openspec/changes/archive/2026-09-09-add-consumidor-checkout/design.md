# Design: Consumidor en checkout

## Context
- `/pricing` (client component) llama a `/api/v1/payments/subscribe` con `{tier, interval}` y redirige a `data.url` (init_point de MP). No hay aceptación de términos en ningún punto.
- El `back_url` de MP ya apunta a `/suscripcion/confirmar`, que verifica el estado vía `/api/v1/payments/subscribe/status` (POST, responde `{status, grantsAccess, subscriptionId}`) y sincroniza la fila draft + perfil.
- `freeTrialDays` está desactivado en el endpoint (riesgo de MP) aunque el spec original contempla trial de 14d: sin trial vigente, el derecho aplicable es el retracto del art. 3 bis Ley 19.496. La confirmación escrita mantiene el plazo en 10 días (sin ella sería 90).
- SII/boletas: diferida por decisión del usuario, documentada en PENDING.md — fuera de alcance.

## Goals / Non-Goals
- **Goals**: prueba de aceptación (checkbox + registro en la fila del draft), aviso de retracto/débito/cancelación visible pre-checkout, confirmación escrita post-pago con resumen de condiciones.
- **Non-Goals**: no exigir cláusula de exclusión del retracto (innecesaria y hostil); no implementar boletas SII; no cambiar la mecánica de MP ni el mapeo de webhook.

## Decisions

### D1: Gate server-side, no solo UI
El checkbox es UX y la prueba legal es server-side: el endpoint rechaza con 400 si `aceptoTerminos !== true` y guarda `terminos_aceptados_at` (fecha del servidor, no del cliente) + `terminos_aceptados_version` en el draft. La versión de términos se define como constante `TERMINOS_VERSION` en el route (hoy "2026-09"); al cambiar los Términos en el futuro se incrementa el string y los drafts nuevos dejan registro de qué versión aceptó cada suscripción.

### D2: Aviso único en la página, no por tarjeta
Una caja de aviso sobre el grid de planes (retracto 10 días, débito automático MP, cancelación en perfil, email de soporte, enlaces legales) en vez de repetir el texto en cada Card: un solo elemento prominente cumple y no fragmenta el copy. El checkbox vive junto al aviso.

### D3: Confirmación escrita reusa el estado existente
El status API ya consulta el draft (select `id, plan`): se agrega `interval` al select y `planAmount` al response. La página `/suscripcion/confirmar` renderiza el resumen con esos datos; si el usuario vuelve sin draft (acceso directo), el resumen no aparece y solo se muestra el estado genérico — no fabricamos condiciones.

### D4: Checkbox aplicado a toda la página
Un checkbox global (no uno por plan) porque la aceptación es de los mismos documentos para cualquier tier; deshabilita los tres botones a la vez. Si un flujo futuro necesita aceptación por plan, el endpoint ya valida por solicitud.

## Risks / Trade-offs
- **Checkbox añade fricción**: aceptado — es exactamente lo que exige la ley para acortar el retracto a 10 días y da prueba de aceptación.
- **`terminos_aceptados_version` sin UI pública de versionado**: el string sirve de prueba; la página pública de términos no tiene número de versión visible todavía (deuda menor registrada).

## Migration Open Questions
- Ninguna: 0025 es un `alter table ... add column` reversible.
