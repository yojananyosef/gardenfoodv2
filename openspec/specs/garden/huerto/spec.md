# garden/huerto Specification

## Purpose
Manages the user's huerto: active crops (`gf_cultivos`), tree inventory (`gf_arboles`) with frictionless creation and later editing, and the visual link to the map-delimited huertos (`gf_huertos`).

## Requirements

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

### Requirement: Tree inventory is reachable from the dashboard
The system SHALL expose the tree inventory through a navigable section of the dashboard (e.g. a tab or route under `/huerto`) so it is not orphaned.

#### Scenario: Inventory is reachable
- **WHEN** an authenticated user navigates to the trees section of the dashboard
- **THEN** the system renders the tree list and management controls

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

### Requirement: Terreno link card

The system SHALL show on the huerto dashboard a "Tu terreno" card listing the map-delimited huertos (`gf_huertos`) with name, surface in m²/ha and center coordinates, with a call-to-action to edit them on the profile map; when none exist, it SHALL show an empty state with a call-to-action to delimit the first huerto.

#### Scenario: Card lists delimited huertos

- **WHEN** a user with delimited huertos opens the huerto dashboard
- **THEN** the card lists each huerto with its name, center coordinates and surface, and offers a CTA to the profile map

#### Scenario: Empty state invites mapping

- **WHEN** a user has no delimited huertos
- **THEN** the card shows an empty state with a CTA to draw the huerto on the profile map

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

### Requirement: Free tier crop limits
The system SHALL limit the free tier (`perfiles.plan = "gratuito"`) to 3 active crops (`gf_cultivos`) and 1 tree (`gf_arboles`), enforced in the server actions (`agregarCultivo`, `agregarArbol`) via pure helpers `puedeAgregarCultivo` / `puedeAgregarArbol` from `lib/payments/plans.ts`. Paid tiers and `admin` are unlimited. When the limit is reached the action SHALL reject with an upsell message and the huerto UI SHALL show usage counters and an upsell CTA to `/pricing`.

#### Scenario: Free user reaches the crop limit
- **WHEN** a free user with 3 active crops tries to add a fourth
- **THEN** the action rejects with an upsell message and the UI shows the `3/3` counter with a CTA to `/pricing`

#### Scenario: Free user within limits
- **WHEN** a free user with 1 crop adds a second
- **THEN** the crop is created normally and the counter shows `2/3`

#### Scenario: Paid user is unlimited
- **WHEN** a Huertero (or higher) user adds crops beyond the free limit
- **THEN** the action accepts without restriction
