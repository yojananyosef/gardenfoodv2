## MODIFIED Requirements

### Requirement: Comuna validation against the catalog
The system SHALL expose a validation function that verifies a `comuna` (and its `region`) exists in the catalog of **346** comunas — the official SUBDERE División Político Administrativa count (16 regiones / 56 provincias / 346 comunas, per BCN and INE) — and returns the matching agroclimatic zone, or signals invalid input. The catalog sizes of 208 (legacy docs) and 254 are superseded; 346 is the canonical count.

#### Scenario: Known comuna resolves a zone
- **WHEN** given a comuna present in the catalog together with its correct region
- **THEN** the function returns the corresponding `zona_agroclimatica` without error

#### Scenario: Unknown comuna is invalid
- **WHEN** given a comuna not present in the catalog
- **THEN** the function reports the input as invalid so callers can reject it

### Requirement: Agroclimatic zones and commune mapping
The system SHALL provide a data source with the 20 Chilean agroclimatic zones and the **346** official communes mapped to their region and agroclimatic zone (with `COMUNAS_ZONA` derived from the single `COMUNAS` list), and climate profile data per zone (temperature range, precipitation, frost risk). The public landing region/comuna selector SHALL consume the same canonical catalog so it always offers the complete set.

#### Scenario: Zone resolved from commune
- **WHEN** a user profile specifies a commune
- **THEN** the system resolves the corresponding agroclimatic zone and its climate profile for recommendations

#### Scenario: Unrecognized commune
- **WHEN** a commune does not match any known commune in the catalog
- **THEN** the system falls back to a default neutral zone (Santiago Norte id 7) without failing

#### Scenario: Landing selector offers the full catalog
- **WHEN** an anonymous visitor opens the landing zone selector
- **THEN** they can choose any of the 16 regions and any of the 346 official comunas, and the widget resolves tasks from the comuna's canonical zone
