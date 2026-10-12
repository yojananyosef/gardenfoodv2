# garden/navigation Specification

## Purpose
Provides mobile-first navigation across the application: a bottom navigation bar on phones with large touch targets, and a traditional top header on larger screens, so the core modules are one thumb-tap away.

## Requirements

### Requirement: Bottom navigation on mobile

The system SHALL render a fixed bottom navigation bar on mobile viewports containing the primary destinations (Mi huerto, Calendario, Cosechas, Biblioteca) with touch targets of at least 48px height.

#### Scenario: Primary destinations visible on phone

- **WHEN** a user on a phone opens the dashboard
- **THEN** the bottom navigation bar shows all primary destinations with tap targets at least 48px tall

#### Scenario: Active destination is highlighted

- **WHEN** a user navigates to a destination
- **THEN** that destination is visually marked as active in the bottom navigation bar

### Requirement: Desktop header navigation

The system SHALL render a top header navigation on desktop viewports with the same primary destinations plus profile and sign-out actions.

#### Scenario: Primary destinations on desktop

- **WHEN** a user on a desktop opens the dashboard
- **THEN** the top header shows the primary destinations and the profile/sign-out actions

### Requirement: Mobile-first layout

The system SHALL layout dashboard pages so single-handed phone use is comfortable: content flows in a single column with adequate spacing, interactive controls are at least 48px tall, and no horizontal scrolling occurs on a 375px wide viewport.

#### Scenario: No horizontal overflow on phone

- **WHEN** any dashboard page renders on a 375px wide viewport
- **THEN** the page has no horizontal overflow and all interactive controls are at least 48px tall

### Requirement: Content not obscured by bottom bar

The system SHALL ensure bottom navigation does not cover page content: dashboard pages reserve space at the bottom on mobile so the last content block is reachable and scrollable.

#### Scenario: Last content reachable on mobile

- **WHEN** a user scrolls to the end of a dashboard page on a phone
- **THEN** the last content block is fully visible above the bottom navigation bar

### Requirement: El índice de especies es un destino principal

La barra de navegación SHALL incluir el índice de especies del usuario entre los destinos principales, para que sus árboles sean alcanzables desde cualquier pantalla sin depender de encontrarlos dentro de `/huerto`.

#### Scenario: Especies alcanzable desde la barra inferior

- **WHEN** un usuario en un teléfono está en cualquier pantalla del dashboard
- **THEN** la barra inferior incluye el índice de especies como destino, con tap target de al menos 48 px

#### Scenario: Destino activo resaltado

- **WHEN** el usuario está en el índice de especies
- **THEN** ese destino aparece marcado como activo en la barra de navegación

#### Scenario: Las etiquetas siguen siendo legibles con el destino nuevo

- **WHEN** la barra inferior incluye el destino nuevo
- **THEN** todas las etiquetas de destino siguen siendo legibles y caben en un viewport de 375 px sin cortarse ni desbordar en horizontal
