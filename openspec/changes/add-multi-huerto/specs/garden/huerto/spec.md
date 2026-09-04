## Purpose

Manages the user's huerto: active crops (`gf_cultivos`), tree inventory (`gf_arboles`) with frictionless creation and later editing, and the visual link to the map-delimited huertos (`gf_huertos`).

## MODIFIED Requirements

### Requirement: Manage active crops

The system SHALL allow the user to add and remove active crops (species they grow), where each crop references a species from the catalog, and persist them per user. Creating a crop SHALL NOT require entering a plant count: the crop is created with cantidad 1 and the count SHALL be editable afterwards from the crop list.

#### Scenario: Add a crop without entering a count

- **WHEN** a user adds a species to their huerto
- **THEN** the system persists the crop for that user with cantidad 1 (no count input shown) and shows it in the huerto dashboard

#### Scenario: Edit the crop count later

- **WHEN** a user adjusts the count of an existing crop with the +/− stepper or by entering an exact number (1–1000)
- **THEN** the system persists the new count and the list reflects it immediately

#### Scenario: Duplicate crop prevented

- **WHEN** a user adds a species they already have
- **THEN** the system rejects the duplicate and does not create a second crop for the same species

#### Scenario: Remove a crop

- **WHEN** a user removes a crop
- **THEN** the system deletes the crop and it disappears from the dashboard

### Requirement: Users manage their tree inventory
The system SHALL let authenticated users create, list, update and delete individual tree records (`especie`, `fecha_plantacion`, `observaciones`, `cantidad`) in `gf_arboles`, with row-level isolation per user. Creating a tree SHALL NOT require entering a plant count: it is created with cantidad 1 and the count SHALL be editable afterwards; partial updates SHALL NOT clear fields that were not sent.

#### Scenario: User adds a tree without a count
- **WHEN** an authenticated user adds a tree with species (and optional planting date and notes)
- **THEN** the system inserts a `gf_arboles` row owned by that user with cantidad 1 and shows it in their inventory

#### Scenario: User edits only the count of a tree
- **WHEN** a user adjusts the count of a tree that has planting date and notes
- **THEN** the system updates only `cantidad` and keeps the planting date and notes intact

#### Scenario: User only sees their own trees
- **WHEN** a user opens the tree inventory
- **THEN** the system lists only `gf_arboles` rows where `user_id` matches the authenticated user

## ADDED Requirements

### Requirement: Terreno link card
The system SHALL show on the huerto dashboard a "Tu terreno" card listing the map-delimited huertos (`gf_huertos`) with name, surface in m²/ha and center coordinates, with a call-to-action to edit them on the profile map; when none exist, it SHALL show an empty state with a call-to-action to delimit the first huerto.

#### Scenario: Card lists delimited huertos
- **WHEN** a user with delimited huertos opens the huerto dashboard
- **THEN** the card lists each huerto with its name, center coordinates and surface, and offers a CTA to the profile map

#### Scenario: Empty state invites mapping
- **WHEN** a user has no delimited huertos
- **THEN** the card shows an empty state with a CTA to draw the huerto on the profile map
