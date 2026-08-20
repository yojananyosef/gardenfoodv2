## MODIFIED Requirements

### Requirement: Comuna validation against the catalog
The system SHALL expose a validation function that verifies a `comuna` (and its `region`) exists in the catalog of **254** comunas and returns the matching agroclimatic zone, or signals invalid input. The catalog size of 208 in legacy docs is superseded; 254 is the canonical 2026 count.

#### Scenario: Known comuna resolves a zone
- **WHEN** given a comuna present in the catalog together with its correct region
- **THEN** the function returns the corresponding `zona_agroclimatica` without error

#### Scenario: Unknown comuna is invalid
- **WHEN** given a comuna not present in the catalog
- **THEN** the function reports the input as invalid so callers can reject it

### Requirement: Zone derivation is used at registration and profile edit
Registration and profile-editing flows SHALL derive `zona_agroclimatica` exclusively from the validated comuna and SHALL NOT use a hardcoded fallback zone.

#### Scenario: No hardcoded zone fallback
- **WHEN** a location is saved during registration or profile edit
- **THEN** the stored zone comes from the catalog lookup, never from a constant string

### Requirement: Agroclimatic zones and commune mapping
The system SHALL provide a data source with the 20 Chilean agroclimatic zones, the **254** communes mapped to their region and agroclimatic zone, and climate profile data per zone (temperature range, precipitation, frost risk).

#### Scenario: Zone resolved from commune
- **WHEN** a user profile specifies a commune
- **THEN** the system resolves the corresponding agroclimatic zone and its climate profile for recommendations

#### Scenario: Unrecognized commune
- **WHEN** a commune does not match any known commune in the catalog
- **THEN** the system falls back to a default neutral zone (Santiago Norte id 7) without failing

### Requirement: Species catalog
The system SHALL provide a catalog of 30 fruit species, each with a slug, common name, latin name, cultivation difficulty, and **locally hosted image** reference (`/frutas/<slug>.webp`), grouped by fruit family (carozo, pomácea, cítrico, baya, fruto seco, subtropical, otros). Images SHALL NOT be fetched from `commons.wikimedia.org` at runtime to avoid HTTP 429.

#### Scenario: Browse full catalog
- **WHEN** a user opens the species catalog
- **THEN** the system lists all 30 species with their group and difficulty and renders the locally hosted image without external 429

#### Scenario: Open species detail
- **WHEN** a user selects a species
- **THEN** the system shows its technical sheet with monthly calendar, phenology, irrigation, nutrition, health, pruning and harvest information

### Requirement: Monthly agronomic calendars
The system SHALL provide a monthly calendar per species covering the 12 months, each month describing the growth stage, irrigation guidance, nutrition guidance, health guidance and seasonal alert.

#### Scenario: Task suggestions for the current month
- **WHEN** a user has an active crop of a species and requests task suggestions for the current month
- **THEN** the system returns the irrigation, nutrition and health tasks defined in that species' monthly calendar for the month, excluding months whose guidance marks the task as "none"

#### Scenario: Seasonal alert for a crop
- **WHEN** a user views alerts for the current month
- **THEN** the system surfaces the seasonal alert defined in the species' monthly calendar for crops the user has

### Requirement: Viability matrix
The system SHALL provide a viability matrix of 30 species × 20 zones classifying each combination as `si`, `riesgo` or `no`, with an optional technical explanation. The matrix SHALL be consumed by the recommendations view.

#### Scenario: Species viability for a zone
- **WHEN** a user browses species for their agroclimatic zone via recommendations
- **THEN** the system shows each species classified as recommended, at risk, or not recommended for that zone with its `razon`

