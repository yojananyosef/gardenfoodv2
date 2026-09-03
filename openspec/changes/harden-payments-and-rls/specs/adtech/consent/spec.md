## MODIFIED Requirements

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
