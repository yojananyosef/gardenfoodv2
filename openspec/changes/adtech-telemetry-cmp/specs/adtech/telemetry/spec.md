## Purpose

Captures high-volume user behavior telemetry — device identity, hybrid geolocation, dwell time, scroll depth and commerce intent — through non-blocking client ingestion, powering advertising attribution and audience profiling.

## ADDED Requirements

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

The system SHALL attach a persistent device identifier and technical metadata — operating system, browser, screen resolution, connection type, IP address and User-Agent — to telemetry events for multi-device identity.

#### Scenario: Event includes device metadata

- **WHEN** a telemetry event is captured
- **THEN** the event includes the persistent device id and a device metadata object with OS, browser, screen resolution and connection type

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

Telemetry events SHALL be insertable by any client but readable only by administrators.

#### Scenario: Open insert, restricted read

- **WHEN** any client submits a telemetry event and an admin later queries telemetry
- **THEN** the insert succeeds for the client and only administrators can read stored events; regular users cannot read other users' telemetry

### Requirement: Event payload flexibility

The system SHALL store arbitrary structured event context in a JSON payload and SHALL index it for analytical queries.

#### Scenario: Payload with custom context

- **WHEN** an event is stored with a JSON payload (e.g., calculated dose, fertilizer brand searched, input price)
- **THEN** the payload is preserved verbatim and is queryable through the analytical index