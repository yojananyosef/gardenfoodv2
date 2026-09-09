# garden/huerto — delta spec

## ADDED Requirements

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

## MODIFIED Requirements

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
