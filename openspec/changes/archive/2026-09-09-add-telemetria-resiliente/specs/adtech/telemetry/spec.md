## MODIFIED Requirements

### Requirement: Device fingerprinting

El sistema SHALL adjuntar un identificador de dispositivo persistente y metadatos técnicos — sistema operativo, navegador, resolución, tipo de conexión y User-Agent — a los eventos de telemetría. El identificador SHALL resolverse por escalera de degradación: (1) `deviceId` almacenado localmente por el cliente; (2) si el cliente lo omite, cookie first-party `gf_did` emitida por el servidor de ingestión (`httpOnly`, `SameSite=Lax`, `Secure` en HTTPS, vigencia 390 días); (3) huella determinista de metadatos del dispositivo **únicamente cuando el titular otorgó el consentimiento `deviceLinking`** y no hay almacenamiento persistente; (4) identificador efímero de sesión como último recurso del servidor. El cliente SHALL omitir el deviceId cuando solo disponga de un identificador desechable, y el servidor SHALL garantizar siempre un valor (la columna es obligatoria). El `user_id` de sesión autenticada SHALL tener precedencia sobre cualquier deviceId como ancla de identidad.

#### Scenario: Event includes device metadata
- **WHEN** se captura un evento de telemetría
- **THEN** el evento incluye el deviceId resuelto y un objeto de metadatos con OS, navegador, resolución y tipo de conexión

#### Scenario: Evento con deviceId local disponible
- **WHEN** el cliente tiene un deviceId persistente en almacenamiento local
- **THEN** el evento lo incluye y el servidor lo respeta sin emitir cookie

#### Scenario: Almacenamiento local bloqueado u otro dispositivo
- **WHEN** el cliente no puede enviar deviceId (almacenamiento bloqueado, app nativa sin id propio)
- **THEN** el servidor usa la cookie `gf_did` vigente, o genera un nuevo identificador y lo devuelve como `Set-Cookie` en la respuesta de ingestión

#### Scenario: Huella solo con consentimiento de vinculación
- **WHEN** no hay almacenamiento persistente disponible y el titular otorgó `deviceLinking`
- **THEN** el cliente deriva un identificador determinista a partir de metadatos técnicos y lo envía como deviceId

#### Scenario: Sin consentimiento de vinculación
- **WHEN** `deviceLinking` no está otorgado y no hay almacenamiento persistente
- **THEN** el cliente omite el deviceId y el servidor resuelve con cookie o identificador efímero; nunca se atribuye identidad por huella sin consentimiento

#### Scenario: Usuario autenticado
- **WHEN** el titular tiene sesión activa en el momento de la ingestión
- **THEN** el evento queda asociado a su `user_id` con independencia del deviceId resuelto
