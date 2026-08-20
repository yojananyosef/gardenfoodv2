# garden/agronomy-data Specification

## Purpose
Validates Chilean region/comuna input against the catalog of 245 comunas and derives the correct agroclimatic zone so every location-dependent feature resolves accurately.

## Requirements

### Requirement: Comuna validation against the catalog
The system SHALL expose a validation function that verifies a `comuna` (and its `region`) exists in the catalog of 245 comunas and returns the matching agroclimatic zone, or signals invalid input.

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
