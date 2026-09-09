# payments/consumidor Specification

## Purpose
TBD - created by archiving change add-consumidor-checkout. Update Purpose after archive.

## Requirements

### Requirement: Aceptación de términos pre-checkout

El sistema SHALL requerir, antes de redirigir a Mercado Pago, la aceptación explícita de los Términos y Condiciones y de la Política de privacidad mediante un checkbox en `/pricing`, con enlaces visibles a ambos documentos. El botón de suscripción SHALL permanecer deshabilitado sin la casilla marcada. El endpoint de creación de suscripción SHALL rechazar con 400 cualquier solicitud cuyo cuerpo no declare `aceptoTerminos: true` y SHALL registrar la aceptación en la fila del draft (`terminos_aceptados_at` con la fecha/hora del servidor y `terminos_aceptados_version` con la versión vigente de los términos).

#### Scenario: Usuario suscribe con aceptación
- **WHEN** un usuario autenticado marca el checkbox de términos y pulsa "Suscribirse"
- **THEN** el sistema crea el draft con `terminos_aceptados_at` y `terminos_aceptados_version` registrados y redirige al checkout de Mercado Pago

#### Scenario: Solicitud sin aceptación
- **WHEN** el endpoint de suscripción recibe `aceptoTerminos` distinto de `true`
- **THEN** rechaza con 400 sin llamar a Mercado Pago ni crear filas

#### Scenario: Botón sin casilla marcada
- **WHEN** el usuario no ha marcado el checkbox en `/pricing`
- **THEN** los botones "Suscribirse" están deshabilitados y el aviso de condiciones es visible junto a ellos

### Requirement: Aviso de retracto y condiciones en pricing

El sistema SHALL mostrar en `/pricing`, antes de los botones de suscripción, un aviso destacado que incluya: la existencia del derecho de retracto dentro de los 10 días corridos siguientes a la contratación (art. 3 bis Ley 19.496) con el canal de ejercicio (pichilemugardenfood@gmail.com), la naturaleza de débito automático recurrente vía Mercado Pago, la cancelación disponible en cualquier momento desde el perfil y los enlaces a los Términos y la Política de privacidad.

#### Scenario: Visitante revisa planes
- **WHEN** un visitante abre `/pricing`
- **THEN** encuentra el aviso de retracto, débito automático, cancelación y los enlaces legales sin necesidad de hacer scroll a pie de página

### Requirement: Confirmación escrita del contrato

El sistema SHALL mostrar en `/suscripcion/confirmar` (pantalla de retorno desde Mercado Pago) un resumen escrito de las condiciones del contrato: plan contratado, monto e intervalo de cobro, naturaleza del débito automático y del proveedor de pago, cancelación desde el perfil, derecho de retracto de 10 días corridos con canal de ejercicio y contacto de soporte. El endpoint de estado SHALL proveer `plan`, `interval` y el monto correspondiente a `plans.ts`.

#### Scenario: Usuario vuelve desde Mercado Pago
- **WHEN** un usuario regresa desde el checkout de Mercado Pago a `/suscripcion/confirmar`
- **THEN** ve la confirmación del estado de la suscripción y el resumen escrito de las condiciones contratadas (plan, monto, intervalo, débito automático, cancelación, retracto de 10 días, soporte)
