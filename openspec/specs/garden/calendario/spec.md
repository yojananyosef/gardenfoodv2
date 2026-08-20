# garden/calendario Specification

## Purpose
Provides a monthly calendar view of the user's scheduled agronomic tasks with day detail, task state management and per-month agronomic suggestions based on the user's crops.

## Requirements

### Requirement: Monthly task calendar

The system SHALL render a monthly grid calendar where each day shows a marker if it has scheduled tasks, with navigation between months and the current day highlighted.

#### Scenario: Navigate months

- **WHEN** a user navigates to the previous or next month
- **THEN** the calendar reloads showing the tasks of the newly selected month

#### Scenario: Day with tasks shows a marker

- **WHEN** a day has one or more scheduled tasks
- **THEN** that day displays a marker in the grid

#### Scenario: Current day highlighted

- **WHEN** the calendar shows the current month
- **THEN** today is visually highlighted

### Requirement: Day detail with tasks

The system SHALL show, for the selected day, the list of scheduled tasks with species and type (riego, nutrición, sanidad, personalizada), each with its state (pendiente, en proceso, completada) and controls to advance state or delete the task.

#### Scenario: Cycle task state

- **WHEN** a user taps a task's state control
- **THEN** the task advances pendiente → en proceso → completada → pendiente and persists

#### Scenario: Delete a task

- **WHEN** a user deletes a task
- **THEN** the task is removed from that day and the calendar updates

### Requirement: Add tasks

The system SHALL allow the user to add a free-text custom task to a selected day, persisting it with the selected date.

#### Scenario: Add custom task to a day

- **WHEN** a user writes a custom task for a selected day and confirms
- **THEN** the task is persisted with that date and appears in the day detail

### Requirement: Monthly agronomic suggestions

The system SHALL suggest, for the selected month, irrigation, nutrition and health tasks derived from the monthly calendars of the user's active crops, each addable with one tap and not duplicating tasks already scheduled for the day.

#### Scenario: Suggested task added to a day

- **WHEN** a user taps an agronomic suggestion for the selected month
- **THEN** the system creates the task for the selected day and marks that suggestion as already added for that day

#### Scenario: Suggestion already added is disabled

- **WHEN** a suggested task with the same origin is already scheduled for the selected day
- **THEN** the suggestion control is disabled to prevent duplicates
