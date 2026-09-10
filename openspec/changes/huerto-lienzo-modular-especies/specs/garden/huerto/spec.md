# Delta spec: garden/huerto

## MODIFIED Requirements

### Requirement: Terreno link card

The system SHALL provide on the huerto dashboard a huerto canvas («lienzo») in modular mode with three tabs: «Terreno (satélite)», «Posicionar árboles» and «Visualización 3D». The satellite tab SHALL embed the same polygon map used by the profile (draw, edit vertices, delete/count huertos, satellite imagery), so terrain maintenance happens inside /huerto without navigating to the profile page. The profile page SHALL keep its own map page (single shared canvas component); iterating between huerto and profile is no longer required for polygon editing. A summary of delimited huertos (name, surface, coordinates) SHALL remain visible, and the guided daily view SHALL NOT include the canvas (the guided assistant keeps its terreno step, matching design C).

#### Scenario: Satélite embebido en modular

- **WHEN** a user in modular mode opens the huerto dashboard
- **THEN** the canvas shows the satellite tab with the polygon map loaded (draw tools available) without navigating away

#### Scenario: Dibujar/editar sin salir de huerto

- **WHEN** the user draws a new polygon or edits/deletes an existing huerto from the satellite tab
- **THEN** the huerto, its summary and its polygon persist exactly as from the profile page, and huerto surface/coordinates update

#### Scenario: Tabs de lienzo

- **WHEN** the user switches between «Terreno (satélite)», «Posicionar árboles» and «Visualización 3D»
- **THEN** the canvas swaps between map, positioning matrix and 3D view without leaving the dashboard, keeping the active huerto (R5 selector) in scope

#### Scenario: Perfil conserva su página

- **WHEN** the user opens the profile page
- **THEN** the full map (with community features) still works there, driven by the same shared canvas, with no behavior loss

#### Scenario: Guiado sin lienzo

- **WHEN** the user is in guided daily view (not the assistant)
- **THEN** no embed the canvas — the map lives in the assistant's Terreno step (Propuesta C)

## ADDED Requirements

### Requirement: Estado por especie en inventario agrupado

El inventario de árboles agrupado por especie SHALL mostrar por cada especie un badge de estado: «completo» cuando todos sus ejemplares están posicionados en plano, «en curso» cuando quedan ejemplares sin ubicar, y la suma de ejemplares en plano vs. sin ubicar como detalle visible.

#### Scenario: Especie con ejemplares sin ubicar

- **WHEN** una especie tiene al menos un ejemplar sin posición
- **THEN** su fila muestra el badge «en curso» junto al detalle «N en plano · M sin ubicar»

#### Scenario: Especie completa

- **WHEN** todos los ejemplares de una especie están posicionados
- **THEN** su fila muestra el badge «completo»

### Requirement: Chip mensual en la vista guiada

La cabecera de la vista guiada (día a día, no el asistente) SHALL mostrar un chip con la recomendación agronómica clave del mes activo para la zona del usuario, además de la zona y la fecha; si no hay recomendación aplicable, el chip no se muestra.

#### Scenario: Mes con recomendación

- **WHEN** el usuario entra a la vista guiada con zona configurada y hay recomendación para el mes
- **THEN** el header muestra un chip tipo «sept: [recomendación]» junto a la huerta y la fecha

#### Scenario: Sin recomendación ni zona

- **WHEN** no hay recomendación para el mes o el usuario no tiene zona
- **THEN** el header omite el chip sin romper el layout

### Requirement: Puente árbol → ficha de especie en edición del plano

La vista de edición de un árbol individual (matriz 2D y 3D del plano) SHALL ofrecer un enlace «Ver ficha de la especie» que abre la ficha de la especie correspondiente en el módulo Especies (puente E3), además del puente ya existente en la lista de inventario.

#### Scenario: Ficha desde el detalle 2D

- **WHEN** el usuario abre la edición de un árbol en la matriz 2D
- **THEN** se ofrece «Ver ficha de la especie» con destino `/especie/especies/<especie>`

#### Scenario: Ficha desde el detalle 3D

- **WHEN** el usuario abre la edición de un árbol desde la vista 3D
- **THEN** se ofrece el mismo puente a la ficha de especie

## MODIFIED Requirements

### Requirement: Summary of the day

La vista guiada «¿Qué sigue hoy?» SHALL listar: (a) la tarjeta de pendientes de posicionamiento con CTA «Posicionar N pendientes» y «Más tarde», (b) la tarjeta de tareas de la semana con marcado rápido, (c) el resumen por especie con enlace a cada ficha, y (d) la única puerta de vuelta al asistente vía modo modular. El bento de resumen SHALL evitar duplicar el conteo de inventario (debe leerse «N especies · M árboles» una sola vez).

#### Scenario: Resumen bento no duplica conteos

- **WHEN** se muestra el resumen del día con cultivos e inventario
- **THEN** el conteo de especies únicas (cultivos ∪ árboles) y de árboles aparece una sola vez, sin línea redundante de «+M inventario»

#### Scenario: Dashboard shows daily summary

- **WHEN** a user opens the huerto dashboard
- **THEN** the system shows cards for active crops, today's tasks and seasonal alerts based on the user's crops and current month

#### Scenario: Empty huerto state

- **WHEN** a user has no active crops
- **THEN** the dashboard shows an empty state guiding them to add their first species
