# Spec Delta

## MODIFIED Requirements

### Requirement: Seasonal alerts by commune

The system SHALL compute seasonal alerts for the user's active crops using the current month's agronomic calendar, and present them associated with the user's agroclimatic zone derived from their profile commune. The alerts shown on the Clima tab SHALL be the predictive, dated weather alerts derived from the forecast for the user's commune; the seasonal calendar alerts remain for the crop-level task suggestions.

#### Scenario: Alerts for crops this month

- **WHEN** a user has crops with a seasonal alert defined for the current month
- **THEN** the system surfaces those alerts grouped by species on the dashboard

#### Scenario: Clima tab shows the forecast

- **WHEN** a user opens the Clima tab on /huerto
- **THEN** the system shows the forecast for the next days for the user's commune, together with any dated alerts derived from it

#### Scenario: No false coverage indicators

- **WHEN** no alert threshold is reached in the forecast
- **THEN** the tab says so and does not display fixed labels implying that alert types are covered regardless of the data

## ADDED Requirements

### Requirement: Coverage indicators reflect real data

The system SHALL NOT display fixed decorative indicators for weather event types on the Clima tab. Any indicator for a weather event type SHALL appear only when the underlying data contains that type of event.

#### Scenario: Indicator appears only with data

- **WHEN** the forecast yields no rain alert
- **THEN** no rain indicator is shown

#### Scenario: Indicator appears with data

- **WHEN** the forecast yields a rain alert
- **THEN** the rain indicator is shown alongside that alert