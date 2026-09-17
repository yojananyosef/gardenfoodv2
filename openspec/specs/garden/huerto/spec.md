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

The system SHALL expose the tree inventory in the single /huerto view: as markers on the maps, as the legend with per-species counts and ficha links, and inside the per-tree edit dialog, so the inventory is never orphaned nor duplicated across a separate cultivos/inventory pair. There SHALL be no side panel: the map is full width with the counts («N especies · M árboles») in the canvas header.

#### Scenario: Inventory is reachable on the map

- **WHEN** an authenticated user opens the huerto canvas
- **THEN** the system renders each tree as a marker, the legend grouped by species with counts, and management controls in the tree dialog

#### Scenario: Inventory is reachable in the assistant

- **WHEN** el usuario abre el paso 2 del asistente modal
- **THEN** el sistema guía a plantar tocando el terreno («Agregar árboles» en cualquier tab) desde la fuente única del inventario

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

The system SHALL show below the map a single card for the active huerto (`gf_huertos`) with editable name, surface in m²/ha and a "Ver en grande" action; with more than one huerto the card SHALL offer a stepper («N de M» with previous/next) to cycle the active huerto without a vertical list; when none exist, it SHALL show an empty state inviting to delimit the first huerto on the map.

#### Scenario: Card lists delimited huertos

- **WHEN** a user with delimited huertos opens the huerto dashboard
- **THEN** the card lists each huerto with its name, center coordinates and surface, and offers a CTA to the profile map

#### Scenario: Empty state invites mapping

- **WHEN** a user has no delimited huertos
- **THEN** the card shows an empty state with a CTA to draw the huerto on the profile map

### Requirement: Plano del huerto con árboles marcados en el mapa

El sistema SHALL crear árboles ya posicionados tocando el terreno («Agregar árboles» con especie elegida, en el tab Terreno satélite, en la maqueta 2D y en la tierra 3D): cada toque dentro de un polígono crea una unidad individual (`cantidad 1`) con posición mediante el único endpoint de creación. Para filas legacy sin posición, el sistema SHALL ofrecer una única acción «Ubicar N pendientes en el mapa» visible solo cuando hay pendientes; el techo de 200 árboles por plano SHALL considerar el total (posicionados + nuevas).

#### Scenario: Sincronizar inventario con un huerto

- **WHEN** el usuario sincroniza el plano de un huerto teniendo filas de inventario (aunque compartan especie) en el alcance
- **THEN** el sistema crea una unidad por árbol con posición dentro del polígono y muestra la matriz en el plano

#### Scenario: Los marcados a mano se preservan

- **WHEN** el usuario ya marcó árboles a mano en el mapa y sincroniza inventario nuevo
- **THEN** los marcados conservan su posición exacta y las nuevas unidades se ubican evitando sus celdas

#### Scenario: Celdas fuera del polígono se reubican

- **WHEN** la matriz regular cae fuera del polígono (por ejemplo, en un terreno en L)
- **THEN** el sistema proyecta esas posiciones al interior del borde más cercano

#### Scenario: Techo de árboles por plano

- **WHEN** la expansión supera el cupo restante (200 menos los ya posicionados)
- **THEN** el sistema rechaza la sincronización con un mensaje accionable sin alterar el inventario

#### Scenario: Sincronización segura ante fallos

- **WHEN** la creación del plano falla parcialmente
- **THEN** el inventario original nunca se pierde (la creación precede al reemplazo) y el usuario puede volver a sincronizar

### Requirement: Vista 2D/3D del plano

El sistema SHALL mostrar el plano del huerto fiel al mapa: en 2D, el polígono dibujado sobre un plato con textura de tierra verdosa (generada proceduralmente, sin imágenes remotas) cuya proporción respeta el aspecto real en metros y cuya grilla de matriz está recortada al interior del polígono (clipPath), con un árbol dibujado por punto coloreado por especie, leyenda y conteos. El 2D SHALL ocupar un marco amplio con zoom (botones, rueda, 60–280%) y arrastre para mover el plano, con control para centrar. En 3D, el sistema SHALL renderizar una escena WebGL real (Three.js, carga diferida solo al activar 3D) de 3D puro procedural: plato de tierra marrón-verdosa y polígono extruido de tierra cultivada oliva alineados por la misma proyección métrica, sin capas de imagen satelital. Cada especie SHALL tener su propio porte 3D (tronco, copa y frutos: olivo grisáceo, cítricos con frutos, nogal/palto grandes, vid/kiwi en parrón, berries en arbusto, papayo en penacho, avellano multitronco), con sombras reales y controles orbitales (rotar/zoom, elevación acotada, botón Vista inicial). Sin WebGL SHALL ofrecer la vista 2D.

#### Scenario: Vista plana con plato sincronizado

- **WHEN** el usuario ve el plano en 2D
- **THEN** el plato adopta el aspecto real del bbox en metros y la grilla solo se dibuja dentro del polígono, sin verse como una segunda capa flotante

#### Scenario: Zoom y paneo en 2D

- **WHEN** el usuario usa la rueda, los botones +/− o arrastra el plano 2D
- **THEN** el plano escala (60–280%) o se desplaza sin perder la sincronía con los árboles, y el control de centrado restaura la vista

#### Scenario: Giro orbital de la vista en 3D

- **WHEN** el usuario arrastra el terreno en modo 3D (mouse o dedo)
- **THEN** la cámara orbita alrededor del plano (azimut libre, elevación acotada) con zoom por rueda/pinzamiento; el control «Vista inicial» restaura la perspectiva por defecto

#### Scenario: 3D puro sin capa satelital

- **WHEN** el usuario activa la vista 3D
- **THEN** el terreno es geometría procedural (plato marrón-verdoso + polígono oliva extruido con grilla de matriz) sin imágenes planas superpuestas que metan ruido

#### Scenario: Puntos como árboles coloreados por especie

- **WHEN** el plano tiene árboles de varias especies
- **THEN** en 2D cada punto se dibuja como un árbol con su tono verde estable por especie y en 3D cada especie muestra su propio porte (forma de copa, tronco y frutos: un olivo se distingue de un duraznero); la leyenda resume especies con conteos

### Requirement: Edición individual de cada árbol del plano

El sistema SHALL permitir editar cada árbol del plano individualmente (especie, fecha de plantación, observaciones) o eliminarlo; un árbol en plano SHALL conservar cantidad 1 y el sistema SHALL rechazar cambiar su cantidad desde el inventario.

#### Scenario: Editar un árbol desde la matriz

- **WHEN** el usuario toca el punto de un árbol y guarda cambios
- **THEN** el sistema persiste los cambios solo de esa unidad

#### Scenario: Eliminar un árbol desde la matriz

- **WHEN** el usuario elimina un árbol del plano
- **THEN** el árbol se borra definitivamente (no existe inventario fuera del plano)

#### Scenario: Cantidad protegida en el plano

- **WHEN** se intenta cambiar la cantidad de un árbol que está en un plano
- **THEN** el sistema rechaza el cambio con un mensaje que indica usar el plano

### Requirement: Summary of the day

La vista única /huerto SHALL organizar el día en pestañas (Mi huerto, Tareas, Clima): el bento de resumen SHALL evitar duplicar el conteo de inventario (debe leerse «N especies · M árboles» una sola vez, solo de árboles), y la guía SHALL estar siempre a un toque con «Abrir asistente» en la cabecera.

#### Scenario: Resumen bento no duplica conteos

- **WHEN** se muestra el resumen con el inventario de árboles
- **THEN** el conteo de especies únicas y de árboles aparece una sola vez, sin línea redundante ni bloque duplicado

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

### Requirement: Vista única Mi Huerto con asistente modal

La vista /huerto SHALL ser una sola: lienzo a ancho completo con pestañas Terreno (satélite, la vista principal), Posicionar árboles y Visualización 3D. El bento SHALL mostrar el conteo («N especies · M árboles»). No SHALL existir panel lateral ni toggle de modos. «Marcar árboles» (plantar tocando el terreno con especie elegida) SHALL estar disponible en los 3 tabs: en Terreno activa el modo marca; en Posicionar y 3D salta al satélite y lo activa (flujo único de plantado). La guía SHALL vivir como acción «Abrir asistente» junto a las pestañas Mi huerto/Tareas/Clima, que abre el asistente de 4 pasos en un modal sin cambiar de vista.

#### Scenario: Usuario nuevo abre /huerto

- **WHEN** un usuario sin huertos delimitados ni árboles abre /huerto por primera vez
- **THEN** el sistema muestra la vista única con el panel, el lienzo y la acción «Abrir asistente» visible en la cabecera

#### Scenario: Abrir asistente no cambia la vista

- **WHEN** el usuario pulsa «Abrir asistente»
- **THEN** el asistente se abre en un modal sobre la misma vista y al cerrarlo vuelve al panel y lienzo sin recargar datos

### Requirement: El asistente corre una sola vez como guía

El asistente de 4 pasos (Terreno → Árboles → Posicionar → Listo, con guardado por paso) SHALL marcarse como corrido al completarlo; no SHALL dispararse automáticamente al abrir /huerto. La acción «Abrir asistente» SHALL seguir disponible en la cabecera y SHALL retomar el pendiente (por ejemplo, Posicionar con árboles sin ubicar) sin repetir lo completado ni volver a marcar.

#### Scenario: El asistente no se repite solo

- **WHEN** el usuario terminó el asistente y abre /huerto de nuevo
- **THEN** el sistema muestra la vista única directamente, sin abrir el asistente

#### Scenario: Reanudar desde la cabecera

- **WHEN** el usuario pulsa «Abrir asistente» con árboles sin posicionar pendientes
- **THEN** el asistente se abre retomando el pendiente (por ejemplo, Posicionar con la cola de reparto) sin repetir la parte ya completada

### Requirement: Selector global de huerto

El selector global de huerto SHALL filtrar el panel, el lienzo y los contadores de la vista sin recargar la página; la elección SHALL persistir para toda la sesión. El mapa SHALL dibujar el polígono del huerto activo con un borde destacado distinto a los demás, SHALL encuadrarlo al abrir la vista cuando hay un activo recordado y SHALL seleccionar el huerto al tocar su polígono.

### Requirement: Puente único de árbol a ficha de especie

El detalle de un árbol (plano, mapa o ficha) SHALL incluir la acción «Ver ficha de <especie>» que abra la ficha pública aprobada (`/especies/<slug>`, slug en minúsculas derivado del `dbKey` vía `urlFichaEspecie`) en un sheet sobre la misma página, preservando el estado del mapa (zoom, polígono, modo marca) al cerrar. El sheet SHALL ofrecer un enlace secundario a la página completa de la ficha. La vista interna `/especie/especies/[especie]` SHALL quedar sin uso hasta su aprobación (no se enlaza desde ningún flujo). La ficha de árbol SHALL conservar solo el estado individual del árbol (posición, edad estimada, fecha de plantación, notas) sin duplicar los cuidados.

#### Scenario: Navegar de árbol a ficha de especie

- **WHEN** el usuario abre el detalle de «Durazno #12» y pulsa «Ver ficha de Durazno»
- **THEN** el sistema muestra la ficha de especie Durazno con las opciones de cuidado aplicable a los árboles del usuario de esa especie

### Requirement: Leyenda por especie con conteos y ficha

La leyenda del plano SHALL mostrar por cada especie su color, su conteo y un botón que abre su ficha en un sheet sobre la misma página, de modo que el estado del inventario se lee de un vistazo sin panel lateral y sin salir del mapa.

#### Scenario: Especie con varios ejemplares

- **WHEN** el plano tiene árboles de una especie
- **THEN** su chip muestra el nombre y el total (×N) y abre la ficha de la especie

### Requirement: Puente árbol → ficha de especie en edición del plano

La vista de edición de un árbol individual (matriz 2D y 3D del plano) SHALL ofrecer un enlace «Ver ficha de la especie» que abre la ficha de la especie correspondiente en el módulo Especies (puente E3), además del puente ya existente en la lista de inventario.

#### Scenario: Ficha desde el detalle 2D

- **WHEN** el usuario abre la edición de un árbol en la matriz 2D
- **THEN** se ofrece «Ver ficha de la especie» con destino `/especie/especies/<especie>`

#### Scenario: Ficha desde el detalle 3D

- **WHEN** el usuario abre la edición de un árbol desde la vista 3D
- **THEN** se ofrece el mismo puente a la ficha de especie
