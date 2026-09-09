# Telemetry Specification

## Purpose

Captures high-volume user behavior telemetry — device identity, hybrid geolocation, dwell time, scroll depth and commerce intent — through non-blocking client ingestion, powering advertising attribution and audience profiling.

## Requirements

### Requirement: Non-blocking telemetry ingestion

The system SHALL ingest telemetry events asynchronously without blocking the UI thread, using `navigator.sendBeacon` or `fetch` with `keepalive: true` for page-lifecycle events. Ingestion SHALL be fire-and-forget: failures SHALL NOT surface errors to the user.

#### Scenario: Event captured during page usage

- **WHEN** a telemetry event is captured while the user interacts with the app
- **THEN** the client sends it asynchronously to the telemetry endpoint and the UI continues without interruption

#### Scenario: Event on page unload

- **WHEN** the user leaves a page
- **THEN** the client delivers pending events using `sendBeacon` so the event is not lost

#### Scenario: Ingestion endpoint unavailable

- **WHEN** the telemetry endpoint returns an error or times out
- **THEN** the event is dropped silently and no error is shown to the user

### Requirement: Event classification

Every telemetry event SHALL carry a category and a name. Categories SHALL include `PRODUCT_USAGE`, `AD_INTERACTION`, `CMP_CONSENT` and `COMMERCE_INTENT`, and events SHALL include species, session and device identifiers where applicable.

#### Scenario: Product usage event

- **WHEN** a user views a species sheet
- **THEN** the system records a `PRODUCT_USAGE` event named `VIEW_FICHA` with the species id, session id and device id

#### Scenario: Commerce intent event

- **WHEN** a user submits a calculator or quotes an input
- **THEN** the system records a `COMMERCE_INTENT` event with the calculated payload (e.g., dose, fertilizer brand, input price) stored in the event payload

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

### Requirement: Hybrid geolocation capture

The system SHALL capture location as declared comuna/region/agroclimatic zone, plus GPS coordinates with accuracy in meters when the user consented to precise geolocation, and SHALL fall back to IP-based geolocation when GPS is unavailable or denied.

#### Scenario: GPS consented and available

- **WHEN** a user consented to precise geolocation and GPS is available
- **THEN** the event records latitude, longitude and accuracy in meters, together with comuna and region

#### Scenario: GPS denied or unavailable

- **WHEN** precise geolocation consent is missing or GPS is unavailable
- **THEN** the event records only declared comuna/region and IP-based geolocation, and SHALL NOT contain GPS coordinates

### Requirement: Dwell time and scroll depth tracking

The system SHALL measure dwell time in milliseconds and maximum scroll depth as a percentage for species sheets and calculators, and SHALL attach these metrics to the corresponding telemetry events.

#### Scenario: User reads a species sheet

- **WHEN** a user spends 45 seconds on a species sheet and scrolls to 80% of its height
- **THEN** the system records a `VIEW_FICHA` event with `dwell_time_ms` 45000 and `scroll_depth_percent` 80

### Requirement: Ad impression and click tracking

The system SHALL record ad impressions and clicks with the ad unit identifier and ad partner identifier, attributed to the viewing user, for every rendered ad slot.

#### Scenario: Ad impression

- **WHEN** an ad unit becomes visible to a consented user
- **THEN** the system records an `AD_INTERACTION` event named `AD_IMPRESSION` with the ad unit id and ad partner id

#### Scenario: Ad click

- **WHEN** a user clicks an ad unit
- **THEN** the system records an `AD_INTERACTION` event named `AD_CLICK` with the ad unit id and ad partner id

### Requirement: Telemetry consent gating

The system SHALL only capture telemetry for users with valid consent; events from users without consent SHALL be rejected or omitted, and no GPS data SHALL be captured without precise-geolocation consent.

#### Scenario: Consented user

- **WHEN** a user with valid consent performs an action
- **THEN** the system stores the telemetry event attributed to that user

#### Scenario: User without consent

- **WHEN** an anonymous or non-consented user performs an action
- **THEN** the system does not store a telemetry event for that user

### Requirement: Telemetry storage access control

Telemetry events SHALL be insertable by any client only with `user_id` null (device-scoped events) or equal to the authenticated user's own id (`auth.uid()`); rows with a foreign `user_id` SHALL be rejected by RLS. Events SHALL be readable only by administrators.

#### Scenario: Open insert, restricted read

- **WHEN** any client submits a telemetry event and an admin later queries telemetry
- **THEN** the insert succeeds for the client and only administrators can read stored events; regular users cannot read other users' telemetry

#### Scenario: Attribution spoofing is rejected

- **WHEN** a client submits a telemetry event with a `user_id` different from its own authenticated identity
- **THEN** the database rejects the row and the ingestion returns an error

### Requirement: Event payload flexibility

The system SHALL store arbitrary structured event context in a JSON payload and SHALL index it for analytical queries.

#### Scenario: Payload with custom context

- **WHEN** an event is stored with a JSON payload (e.g., calculated dose, fertilizer brand searched, input price)
- **THEN** the payload is preserved verbatim and is queryable through the analytical index
