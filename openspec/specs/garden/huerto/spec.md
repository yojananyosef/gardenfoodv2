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

The system SHALL expose the tree inventory through both view modes of /huerto: as the species list of the left panel (with counts per species, position state and drag support) in `modular` mode, and inside the step 2 «Árboles» of the asistente (alta por tarjeta) plus the species summary of «¿qué sigue?» in `guiado` mode, so the inventory is never orphaned nor duplicated across a separate cultivos/inventory pair.

#### Scenario: Inventory is reachable in modular mode

- **WHEN** an authenticated user in modular mode opens the huerto panel
- **THEN** the system renders the tree list grouped by species with per-species counts and management controls

#### Scenario: Inventory is reachable in guided mode

- **WHEN** the user in guided mode opens step 2 of the asistente or the «¿qué sigue?» summary
- **THEN** the system shows the same tree data (species, counts, pending placement) from the single inventory source

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

### Requirement: Plano del huerto con matriz de árboles

El sistema SHALL permitir sincronizar el inventario de árboles con un huerto delimitado en el mapa: cada fila con `cantidad N` sin posición se expande en N árboles individuales (`cantidad 1`) distribuidos en una matriz regular dentro del polígono. Los árboles ya posicionados (marcados a mano en el mapa) SHALL permanecer intactos: la sincronización solo completa la matriz de filas sin posición, evitando sus celdas, y el techo de 200 árboles por plano SHALL considerar el total (posicionados + nuevas).

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

El sistema SHALL permitir editar cada árbol del plano individualmente (especie, fecha de plantación, observaciones), quitarlo del plano o eliminarlo; un árbol en plano SHALL conservar cantidad 1 y el sistema SHALL rechazar cambiar su cantidad desde el inventario.

#### Scenario: Editar un árbol desde la matriz

- **WHEN** el usuario toca el punto de un árbol y guarda cambios
- **THEN** el sistema persiste los cambios solo de esa unidad

#### Scenario: Quitar del plano

- **WHEN** el usuario quita un árbol del plano
- **THEN** el árbol vuelve al inventario sin posición y sin huerto asignado

#### Scenario: Cantidad protegida en el plano

- **WHEN** se intenta cambiar la cantidad de un árbol que está en un plano
- **THEN** el sistema rechaza el cambio con un mensaje que indica usar el plano

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

### Requirement: Modos de la vista Mi Huerto con toggle persistente

La vista /huerto SHALL ofrecer dos modos: `guiado` (asistente y luego la pantalla «¿qué sigue?») y `modular` (panel de cultivos + lienzo central con pestañas Terreno, Posicionar árboles y Visualización 3D). El cambio de modo SHALL ser instantáneo y sin recargar los datos del huerto, SHALL estar disponible desde la cabecera en escritorio y de forma compacta en móvil en ambos modos, y la preferencia SHALL persistir por usuario entre sesiones. El modo inicial SHALL ser `guiado` para usuarios sin terreno dibujado y sin cultivos, y `modular` para los que ya tienen árboles (con su preferencia grabada manda sobre el default).

#### Scenario: Usuario nuevo entra en modo guiado

- **WHEN** un usuario sin huertos delimitados ni cultivos abre /huerto por primera vez
- **THEN** el sistema muestra el modo guiado con el asistente de 4 pasos disponible y el toggle visible

#### Scenario: Toggle instantáneo que persiste

- **WHEN** el usuario cambia de Guiado a Modular (o viceversa) con el toggle
- **THEN** la vista cambia al otro modo sin recargar datos (mismo huerto elegido en el selector) y la preferencia queda guardada para su próxima sesión

#### Scenario: Preferencia del usuario manda sobre el default

- **WHEN** un usuario con 24 árboles ya grabó su preferencia en Modular y abre /huerto
- **THEN** el sistema abre directamente en Modular, no en el asistente

#### Scenario: Toggle compacto en móvil

- **WHEN** el usuario abre /huerto en móvil
- **THEN** el toggle Guiado/Modular cabe en la cabecera sin desplazar el contenido principal

### Requirement: El asistente guiado corre una sola vez

El asistente de 4 pasos (Terreno → Árboles → Posicionar → Listo, con guardado por paso) SHALL presentarse automáticamente en modo guiado solo la primera vez, completándolo el usuario o decidiendo «Más tarde» en cualquiera de sus pasos. Terminado o pospuesto el asistente, /huerto SHALL abrir en la pantalla «¿qué sigue?» y no SHALL volver a dispararse el asistente de forma automática; en modo modular queda accesible de forma manual (acción «Abrir asistente») con el progreso pendiente.

#### Scenario: El asistente no se repite

- **WHEN** el usuario termina el asistente (o lo pospone) y abre /huerto de nuevo en modo guiado
- **THEN** el sistema muestra la pantalla «¿qué sigue?» y no el paso 1 del asistente

#### Scenario: Reanudar desde el modo modular

- **WHEN** el usuario en modo modular pulsa «Abrir asistente» con árboles sin posicionar pendientes
- **THEN** el asistente se abre retomando el pendiente (por ejemplo, Posicionar con la cola de reparto) sin repetir la parte ya completada

### Requirement: Pantalla «¿qué sigue?» del modo guiado

La pantalla de inicio del modo guiado, una vez que el asistente no está pendiente, SHALL presentar un resumen accionable del huerto elegido: árboles sin posicionar con CTA «Posicionar N pendientes», tareas de la semana para la zona con marca de hecha, un alto por especie con su estado del mes (enlazando a la ficha de especie) y los datos de resumen (especies únicas y árboles totales). Todas las entradas SHALL respetar el huerto del selector global.

#### Scenario: Pendientes de posicionamiento

- **WHEN** el usuario con 15 duraznos sin ubicao abre la pantalla «¿qué sigue?»
- **THEN** el sistema muestra la fila con «15 árboles por posicionar» y el CTA para el reparto guiado, y la acción «Más tarde» la descarta sin perder el pendiente

#### Scenario: Resumen y enlace por especie

- **WHEN** la pantalla calcula el resumen del día
- **THEN** muestra especies únicas y árboles totales del huerto activo y, por cada especie en curso, un bloque con el estado del mes enlazado a la ficha de especie

### Requirement: Selector global aplica a ambos modos

El selector global de huerto SHALL filtrar el panel, el lienzo, la pantalla «¿qué sigue?» y los contadores en ambos modos sin recargar la página; la elección SHALL persistir para toda la sesión en cualquier modo y SHALL mantenerse estable al cruzar el toggle.

#### Scenario: Cambio de huerto conserva datos elegidos al alternar modo

- **WHEN** el usuario cambia el selectador global a «Huerto 2» y luego alterna Guiado/Modular
- **THEN** las dos vistas muestran los datos del Huerto 2 sin recarga ni cambio de selección

### Requirement: Puente único de árbol a ficha de especie

El detalle de un árbol (plano, mapa o ficha) SHALL incluir la acción «Ver ficha de <especie>» que navegue a la ficha de especie del módulo Especies. La ficha de árbol SHALL conservar solo el estado individual del árbol (posición, edad estimada, fecha de plantación, notas) sin duplicar los cuidados.

#### Scenario: Navegar de árbol a ficha de especie

- **WHEN** el usuario abre el detalle de «Durazno #12» y pulsa «Ver ficha de Durazno»
- **THEN** el sistema muestra la ficha de especie Durazno con las opciones de cuidado aplicable a los árboles del usuario de esa especie

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
