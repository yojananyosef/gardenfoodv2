# Audiences Specification

## Purpose

Automatically builds commercial audience profiles from telemetry — segments, purchasing-power tiers, phenology stage and crop interest — and exposes them to administrators as sellable B2B audience cohorts.

## Requirements

### Requirement: Automatic audience profile creation

The system SHALL derive a commercial audience profile per consented user from their telemetry and usage data, including commercial segments, purchasing-power tier (`low`, `medium`, `high`, `commercial`), last active phenology stage, primary interest crop, and cumulative ad impressions and clicks.

#### Scenario: Profile built from telemetry

- **WHEN** a consented user views citrus species sheets, searches organic fertilizer and quotes inputs
- **THEN** the system assigns segments such as `busca_fertilizante_organico` and `interes_citricos`, a purchasing-power tier, the active phenology stage and the primary interest crop

#### Scenario: Counters accumulate

- **WHEN** a user's ad units are viewed and clicked over time
- **THEN** the profile's cumulative ad impression and click counters increase accordingly

### Requirement: Cohort assignment rules engine

The system SHALL assign segments and tiers through a configurable rules engine in `lib/telemetry/audiences.ts` that evaluates telemetry signals (dwell time, scroll depth, commerce intent, crop interests, geolocation) and updates profiles on a periodic basis.

#### Scenario: High-attention buyer signals

- **WHEN** a user consistently shows high dwell time and deep scroll on fertilizer sheets and repeatedly quotes fertilizer inputs
- **THEN** the rules engine assigns a high purchasing-power tier and a `comprador_fertilizantes` segment

#### Scenario: Phenology-stage tagging

- **WHEN** a user has an active crop in the flowering stage and views flowering-care content
- **THEN** the profile records `etapa_floracion` as the last active phenology stage

#### Scenario: Periodic refresh

- **WHEN** the scheduled refresh runs
- **THEN** the rules engine re-evaluates each active user's signals and updates the profile fields and counters

### Requirement: Profiles only for consented users

The system SHALL only build and keep audience profiles for users with valid consent for profiling and data sharing.

#### Scenario: No consent, no profile

- **WHEN** a user has no valid consent record
- **THEN** the system does not create or populate an audience profile for that user

### Requirement: Admin audience explorer

Administrators SHALL be able to browse, filter and count audience cohorts (by segment, tier, region/comuna, phenology stage and crop) in an admin dashboard, for use as the B2B data-brokerage product.

#### Scenario: Filter cohorts by segment and region

- **WHEN** an admin filters the audience explorer by a commercial segment and a region
- **THEN** the dashboard shows matching profiles with user counts and segment composition

#### Scenario: Access restricted to admins

- **WHEN** a non-admin user opens the audience explorer
- **THEN** the system denies access and shows no audience data

### Requirement: Audience profile access control

Audience profiles SHALL be managed (created, updated, read) only by the system's automated rules engine and by administrators; individual users SHALL NOT read or modify their own commercial profile.

#### Scenario: Admin manages profiles

- **WHEN** an administrator queries or updates audience profiles
- **THEN** the operation succeeds through admin-level policies

#### Scenario: User denied profile access

- **WHEN** a regular user attempts to read audience profile data
- **THEN** the system denies the operation