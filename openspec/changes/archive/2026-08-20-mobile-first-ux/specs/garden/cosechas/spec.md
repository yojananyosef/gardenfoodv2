# Garden Cosechas

## Purpose

Provides a harvest logbook (bitácora) where users record production per species with notes, see accumulated statistics and unlock achievement badges.

## ADDED Requirements

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