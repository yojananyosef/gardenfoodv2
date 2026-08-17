# Garden Agronomy Data

## Purpose

Provides typed, static Chilean agronomic data (agroclimatic zones, communes, 30 fruit species and their monthly calendars) shared across the whole application as the single source of truth.

## ADDED Requirements

### Requirement: Agroclimatic zones and commune mapping

The system SHALL provide a data source with the 20 Chilean agroclimatic zones, the 208 communes mapped to their region and agroclimatic zone, and climate profile data per zone (temperature range, precipitation, frost risk).

#### Scenario: Zone resolved from commune

- **WHEN** a user profile specifies a commune
- **THEN** the system resolves the corresponding agroclimatic zone and its climate profile for recommendations

#### Scenario: Unrecognized commune

- **WHEN** a commune does not match any known commune in the catalog
- **THEN** the system falls back to a default neutral zone without failing

### Requirement: Species catalog

The system SHALL provide a catalog of 30 fruit species, each with a slug, common name, latin name, cultivation difficulty, and image reference, grouped by fruit family (carozo, pomácea, cítrico, baya, fruto seco, subtropical, otros).

#### Scenario: Browse full catalog

- **WHEN** a user opens the species catalog
- **THEN** the system lists all 30 species with their group and difficulty

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

The system SHALL provide a viability matrix of 30 species × 20 zones classifying each combination as `si`, `riesgo` or `no`, with an optional technical explanation.

#### Scenario: Species viability for a zone

- **WHEN** a user browses species for their agroclimatic zone
- **THEN** the system shows each species classified as recommended, at risk, or not recommended for that zone