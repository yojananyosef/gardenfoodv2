## ADDED Requirements

### Requirement: Onboarding consent allows rejecting all purposes
The onboarding consent modal SHALL be dismissible and SHALL provide a "Rechazar todo" option that records every purpose as denied and lets the user enter the app without granting any consent.

#### Scenario: User rejects all
- **WHEN** a user clicks "Rechazar todo" in the consent modal
- **THEN** the system stores a consent record with all purpose flags false, does not capture telemetry or serve personalized ads, and the user proceeds into the app

#### Scenario: Modal can be closed without consenting
- **WHEN** a user closes or dismisses the consent modal without selecting "Consentir y Comenzar"
- **THEN** the system treats all purposes as denied (no hardcoded grant) and the user is not forced to consent to continue
