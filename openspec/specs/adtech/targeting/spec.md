## Purpose

Dirigir los patrocinios de `gf_sponsorships` según la audiencia del usuario (`gf_user_audiences`)
y su consentimiento de personalización (`gf_user_consents`), con fallback a inventario genérico
cuando no hay coincidencia o no hay consentimiento.

## ADDED Requirements

### Requirement: Targeted sponsorship delivery
The system SHALL return, for a given user, only the sponsorships whose `targeting` matches the user's audience segment, falling back to non-targeted sponsorships.

#### Scenario: User matches a targeted sponsorship
- **WHEN** a user with `commercial_segments` including `busca_fertilizante_organico` requests the sponsored slots on a screen
- **THEN** the system includes the sponsorship targeted at that segment ahead of generic ones

#### Scenario: No match falls back to generic
- **WHEN** no targeted sponsorship matches the user's audience
- **THEN** the system returns the active non-targeted sponsorships

### Requirement: Respect personalization consent
The system SHALL only apply audience targeting when the user has granted personalization consent; otherwise it returns only non-targeted sponsorships.

#### Scenario: User without consent
- **WHEN** a user has not consented to personalization in `gf_user_consents`
- **THEN** the system ignores `targeting` and returns only non-targeted sponsorships

### Requirement: Admin configures targeting
The system SHALL let an admin assign a `targeting` filter (segments, purchasing-power tier, interest crop) to a sponsorship.

#### Scenario: Admin sets targeting
- **WHEN** an admin creates or edits a sponsorship with a targeting filter
- **THEN** the system stores the `targeting` jsonb and uses it for delivery
