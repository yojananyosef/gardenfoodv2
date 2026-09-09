# Consent Specification

## Purpose

Manages legal consent for advertising, telemetry and data sharing following an IAB TCF-style model: granular per-purpose/per-partner consent, 390-day validity, local token persistence and a persuasive onboarding flow with a full preferences panel.

## Requirements

### Requirement: Granular consent registration

The system SHALL record consent per purpose and per ad-partner for each user, including consent for personalized ads, precise geolocation, third-party sharing and device linking. Each consent record SHALL store the consent string, the consent timestamp, an expiry timestamp of 390 days from grant, and the IP address and User-Agent of the device at consent time. Consent writes SHALL be server-mediated through `POST /api/v1/cmp/consent` using the service role; the anon key SHALL have no direct row access to consent records, including anonymous device-scoped rows.

#### Scenario: User grants full consent during onboarding

- **WHEN** a new user completes the registration flow and accepts all consent purposes
- **THEN** the system stores a consent record with all purpose flags set to true, a consent string, a consent timestamp and an expiry timestamp 390 days later

#### Scenario: User refuses precise geolocation

- **WHEN** a user grants consent for personalized ads but refuses precise geolocation
- **THEN** the system stores a consent record with `consent_precise_geo` false and all other accepted flags true, and telemetry SHALL NOT capture GPS coordinates for that user

#### Scenario: Consent record captures technical context

- **WHEN** a consent record is created
- **THEN** the system stores the IP address and User-Agent observed at consent time

#### Scenario: Anonymous consent rows are not directly accessible

- **WHEN** a client holding only the anon key queries or mutates `gf_user_consents` rows with `user_id` null
- **THEN** the database returns no rows and rejects writes; consent for anonymous devices changes only through the server route

### Requirement: Consent expiry and renewal

Consent SHALL expire 390 days after being granted. After expiry, the system SHALL treat all purposes as denied until the user grants consent again, and the user SHALL be prompted to renew consent before any telemetry or advertising activity resumes.

#### Scenario: Consent expires

- **WHEN** 390 days have passed since the consent timestamp
- **THEN** the system treats the user as non-consented, stops telemetry capture, and shows the consent prompt on the next visit

#### Scenario: User renews consent

- **WHEN** a user with expired consent grants consent again
- **THEN** the system creates a new consent record with a fresh 390-day expiry

### Requirement: Legitimate interest opposition

The system SHALL allow users to oppose legitimate-interest-based data processing and SHALL record that opposition in the consent record.

#### Scenario: User opposes legitimate interest

- **WHEN** a user toggles the legitimate-interest opposition option in the preferences panel
- **THEN** the system stores `legitimate_interest_opposed` true and excludes the user's data from legitimate-interest-based processing

### Requirement: Local consent token persistence

The system SHALL persist the consent status locally on the device (secure cookie and localStorage) with the same 390-day validity as the server record, so returning visitors are not asked again before expiry.

#### Scenario: Returning visitor before expiry

- **WHEN** a user who previously granted consent returns to the app before the 390-day expiry
- **THEN** the app recognizes the stored consent token and does not show the consent prompt

#### Scenario: Consent token cleared locally

- **WHEN** the local consent token is removed or expired
- **THEN** the app shows the consent prompt on the next visit

### Requirement: Persuasive onboarding consent flow

The registration flow SHALL present a consent modal with a visually dominant primary button "Consentir y Comenzar" that grants all purposes, and a discreet secondary option "Gestionar opciones" that opens the detailed preferences panel. The modal SHALL include motivational welcome copy tying consent to personalized gardening recommendations.

#### Scenario: User consents via primary button

- **WHEN** a user clicks "Consentir y Comenzar"
- **THEN** all consent purposes are granted and the user proceeds into the app without further steps

#### Scenario: User manages options

- **WHEN** a user clicks "Gestionar opciones"
- **THEN** the detailed preferences panel opens with per-purpose and per-partner switches, and no purpose is granted until the user confirms

#### Scenario: User confirms partial consent

- **WHEN** a user toggles a subset of purposes in the preferences panel and confirms
- **THEN** the system records exactly the toggled purposes and the user proceeds into the app

### Requirement: Consent preferences panel

The system SHALL provide a preferences panel where users can review and change each consent purpose at any time, and where changes take effect immediately for future telemetry and advertising.

#### Scenario: User revokes a purpose later

- **WHEN** a user revokes personalized-ads consent in the preferences panel after onboarding
- **THEN** the system updates the consent record, stops personalized ad serving for that user and persists the change

#### Scenario: Consent API saves updates

- **WHEN** the client saves consent changes through the consent API
- **THEN** the server validates the payload and upserts the consent record for the authenticated user and device

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

### Requirement: Onboarding consent allows rejecting all purposes
The onboarding consent modal SHALL be dismissible and SHALL provide a "Rechazar todo" option that records every purpose as denied and lets the user enter the app without granting any consent.

#### Scenario: User rejects all
- **WHEN** a user clicks "Rechazar todo" in the consent modal
- **THEN** the system stores a consent record with all purpose flags false, does not capture telemetry or serve personalized ads, and the user proceeds into the app

#### Scenario: Modal can be closed without consenting
- **WHEN** a user closes or dismisses the consent modal without selecting "Consentir y Comenzar"
- **THEN** the system treats all purposes as denied (no hardcoded grant) and the user is not forced to consent to continue

### Requirement: Copy clean-room en el CMP

El sistema SHALL describir la preferencia "Compartir con socios comerciales" en el CMP con el modelo real: participar en conteos agregados de segmentos y en la entrega de publicidad contra segmentos — nunca venta ni entrega de datos personales a la marca. El toggle SHALL seguir OFF por defecto.

#### Scenario: Titular lee la preferencia
- **WHEN** un titular ve la descripción de "Compartir con socios comerciales" en el CMP
- **THEN** la descripción aclara que no se venden ni entregan datos personales, solo estadísticas agregadas de grupos grandes
