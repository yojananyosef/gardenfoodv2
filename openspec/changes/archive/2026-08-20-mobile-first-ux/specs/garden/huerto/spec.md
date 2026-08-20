# Garden Huerto

## Purpose

Manages the user's active crops (cultivos) and provides a daily dashboard summarizing today's scheduled tasks and current seasonal alerts, with native ad placement.

## ADDED Requirements

### Requirement: Manage active crops

The system SHALL allow the user to add and remove active crops (species they grow), where each crop references a species from the catalog, and persist them per user.

#### Scenario: Add a crop

- **WHEN** a user adds a species to their huerto
- **THEN** the system persists the crop for that user and shows it in the huerto dashboard

#### Scenario: Duplicate crop prevented

- **WHEN** a user adds a species they already have
- **THEN** the system rejects the duplicate and does not create a second crop for the same species

#### Scenario: Remove a crop

- **WHEN** a user removes a crop
- **THEN** the system deletes the crop and it disappears from the dashboard

### Requirement: Summary of the day

The system SHALL show, on the huerto dashboard, a summary with the number of active crops, the scheduled tasks for today, and the current seasonal alerts, each presented as distinct cards.

#### Scenario: Dashboard shows daily summary

- **WHEN** a user opens the huerto dashboard
- **THEN** the system shows cards for active crops, today's tasks and seasonal alerts based on the user's crops and current month

#### Scenario: Empty huerto state

- **WHEN** a user has no active crops
- **THEN** the dashboard shows an empty state guiding them to add their first species

### Requirement: Daily task cards

The system SHALL render the tasks scheduled for today as interactive cards that the user can mark done directly from the dashboard.

#### Scenario: Task completed from dashboard

- **WHEN** a user marks a today's task as done on the dashboard card
- **THEN** the task transitions to completed and the dashboard updates immediately

### Requirement: Seasonal alerts by commune

The system SHALL compute seasonal alerts for the user's active crops using the current month's agronomic calendar, and present them associated with the user's agroclimatic zone derived from their profile commune.

#### Scenario: Alerts for crops this month

- **WHEN** a user has crops with a seasonal alert defined for the current month
- **THEN** the system surfaces those alerts grouped by species on the dashboard

### Requirement: Native advertising in feed

The system SHALL inject sponsored content into the huerto feed when active sponsorships exist for the huerto screen, placed between content blocks without interfering with the primary actions.

#### Scenario: Sponsored card shown when available

- **WHEN** there is an active sponsorship for the huerto screen
- **THEN** the system renders it as a native card within the huerto feed