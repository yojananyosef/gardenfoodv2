# garden/huerto Specification

## Purpose
Manages the user's individual fruit-tree inventory (`gf_arboles`) with server-side actions and UI, completing the "Árboles" module that the legacy product had but V2 left orphaned.

## Requirements

### Requirement: Users manage their tree inventory
The system SHALL let authenticated users create, list, update and delete individual tree records (`especie`, `variedad`, `edad`, `notas`) in `gf_arboles`, with row-level isolation per user.

#### Scenario: User adds a tree
- **WHEN** an authenticated user adds a tree with species, variety, age and notes
- **THEN** the system inserts a `gf_arboles` row owned by that user and shows it in their inventory

#### Scenario: User only sees their own trees
- **WHEN** a user opens the tree inventory
- **THEN** the system lists only `gf_arboles` rows where `user_id` matches the authenticated user

### Requirement: Tree inventory is reachable from the dashboard
The system SHALL expose the tree inventory through a navigable section of the dashboard (e.g. a tab or route under `/huerto`) so it is not orphaned.

#### Scenario: Inventory is reachable
- **WHEN** an authenticated user navigates to the trees section of the dashboard
- **THEN** the system renders the tree list and management controls
