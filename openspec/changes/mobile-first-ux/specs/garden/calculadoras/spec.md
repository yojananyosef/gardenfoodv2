# Garden Calculadoras

## Purpose

Provides practical agronomic calculators (irrigation, fertilization, plant count, profitability) and a phytosanitary symptom diagnostic that matches observed symptoms against the technical library.

## ADDED Requirements

### Requirement: Irrigation calculator

The system SHALL compute water volume per irrigation and per week from surface area (m²), liters per m² per irrigation and irrigations per week.

#### Scenario: Compute irrigation volumes

- **WHEN** a user inputs surface, liters per m² and frequency
- **THEN** the system shows water per irrigation and per week in liters

### Requirement: Fertilization calculator

The system SHALL compute total fertilizer per application from plant count and grams per plant, returning the total in kilograms.

#### Scenario: Compute fertilizer total

- **WHEN** a user inputs plant count and grams per plant
- **THEN** the system shows the total fertilizer for the application in kg

### Requirement: Plant count calculator

The system SHALL estimate the number of plants that fit in an available area using the species' planting density, showing the suggested spacing for the selected species.

#### Scenario: Estimate plants for an area

- **WHEN** a user selects a species and inputs available area
- **THEN** the system shows the suggested spacing and the estimated number of plants

### Requirement: Profitability calculator

The system SHALL compute estimated income, costs and profit from total production (kg), price per kg and season costs, marking profit as positive or negative.

#### Scenario: Compute profitability

- **WHEN** a user inputs production, price and costs
- **THEN** the system shows income, costs and profit, colored to indicate gain or loss

### Requirement: Phytosanitary diagnostic

The system SHALL let the user select observed symptoms (yellow leaves, spots, wilting, small fruit, visible insects, white powder, premature fruit drop, root problems) and match them against the technical library to return likely species-specific causes ranked by match strength, each with a first organic action.

#### Scenario: Analyze selected symptoms

- **WHEN** a user selects one or more symptoms and requests analysis
- **THEN** the system returns the best-matching causes with severity, the observed symptom description and a first organic action, ranked by match count

#### Scenario: No matches found

- **WHEN** no library entries match the selected symptoms
- **THEN** the system informs the user that no clear match was found and suggests consulting a specialist

### Requirement: Calculators usable without a session

The system SHALL make the calculators and diagnostic functional without requiring authentication, so visitors can evaluate the product.

#### Scenario: Anonymous calculator use

- **WHEN** an unauthenticated visitor opens the calculators
- **THEN** all calculators and the diagnostic work without requiring sign-in