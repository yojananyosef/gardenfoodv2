## MODIFIED Requirements

### Requirement: Consent gates telemetry and advertising

El sistema SHALL servir publicidad personalizada únicamente para titulares con consentimiento válido del propósito correspondiente. La telemetría de producto de primer partido SHALL regir por interés legítimo: se registra salvo que exista una elección de privacidad válida del titular con la oposición activada. El registro CMP SHALL seguir almacenando la elección (consentimientos y oposición) en cada guardado.

#### Scenario: Titular sin consentimiento de publicidad
- **WHEN** un usuario no tiene registro de consentimiento válido para publicidad personalizada
- **THEN** no se le sirve inventario personalizado por audiencia (solo contextual/genérico)

#### Scenario: Non-consented user
- **WHEN** un usuario sin consentimiento de publicidad (registro ausente o expirado)
- **THEN** no se le sirve inventario personalizado por audiencia (solo contextual/genérico) y — si además opuso el interés legítimo — no se registra telemetría de producto

#### Scenario: Telemetría bajo interés legítimo sin oposición
- **WHEN** un visitante navega sin elección válida, o con elección válida sin oposición al interés legítimo
- **THEN** la telemetría de producto se registra (eventos con deviceId y, si hay sesión, `user_id` propio)

#### Scenario: Telemetría con oposición activa
- **WHEN** existe elección válida con `legitimateInterestOpposed: true`
- **THEN** no se registran eventos de telemetría de producto

#### Scenario: Rechazo total en onboarding sigue siendo posible
- **WHEN** el usuario elige "Rechazar todo" en el CMP
- **THEN** se guarda una elección con todos los consentimientos OFF y oposición registrada explícita, sin telemetría de producto ni publicidad personalizada
