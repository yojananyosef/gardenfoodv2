# garden/cosechas Specification

## Purpose
Provides a harvest logbook (bitácora) where users record production per species with notes, see accumulated statistics and unlock achievement badges.

## Requirements

### Requirement: Harvest logbook entries

The system SHALL allow the user to create and delete harvest log entries recording the species, optional production in kilograms and an optional note, persisted per user with a timestamp.

#### Scenario: Add a harvest entry

- **WHEN** a user records a harvest with species, kilograms and/or a note
- **THEN** the system persists the entry and shows it at the top of the history

#### Scenario: Delete a harvest entry

- **WHEN** a user deletes a harvest entry
- **THEN** the entry is removed from the history

### Requirement: Harvest statistics

The system SHALL show aggregated statistics over the logbook: number of entries, accumulated production in kg, distinct species tracked, and unlocked achievements count.

#### Scenario: Statistics reflect logbook

- **WHEN** a user views the cosechas module
- **THEN** the system shows entry count, accumulated kg, distinct species and achievements unlocked

### Requirement: Achievements

The system SHALL unlock achievements based on logbook activity: first entry, ten entries, at least three distinct species, and first recorded production.

#### Scenario: Unlock first-entry achievement

- **WHEN** a user has at least one logbook entry
- **THEN** the first-entry achievement is marked unlocked

#### Scenario: Locked achievements are shown as locked

- **WHEN** a user has not yet met an achievement's condition
- **THEN** that achievement is displayed visually locked with its condition text

### Requirement: Tier-gated achievements and production analytics
The system SHALL gate cosechas features by tier: achievements (`logros`) SHALL render only for paid tiers (Huertero or higher) and `admin`; production analytics (kg per species charts, season comparisons, export) SHALL render only for Cosecha or higher and `admin`. Gated blocks SHALL be omitted server-side and replaced by an upsell CTA to `/pricing`; premium data SHALL not be computed when access is denied. Harvest logging itself SHALL remain available to the free tier.

#### Scenario: Free user logs a harvest without achievements
- **WHEN** a free user adds a harvest record
- **THEN** the record is saved, but achievements and analytics blocks are not rendered and an upsell CTA is shown instead

#### Scenario: Huertero user sees achievements
- **WHEN** a Huertero user opens `/cosechas`
- **THEN** achievements render, but production analytics show the upsell CTA

#### Scenario: Cosecha user sees full analytics
- **WHEN** a Cosecha (or Full) user opens `/cosechas`
- **THEN** achievements and production analytics render without upsell
