# Spec Delta

## MODIFIED Requirements

### Requirement: Vista única Mi Huerto con asistente modal

La vista /huerto SHALL ser una sola: lienzo a ancho completo con pestañas Terreno (satélite, la vista principal), Posicionar árboles y Visualización 3D. El lienzo SHALL ser el primer bloque de la vista, por encima de los bloques de resumen y de tareas, y el selector de especie activa SHALL estar inmediatamente debajo, a ancho completo y siempre visible. El bento SHALL mostrar el conteo («N especies · M árboles») después del lienzo. No SHALL existir panel lateral ni toggle de modos. «Marcar árboles» (plantar tocando el terreno con especie elegida) SHALL estar disponible en los 3 tabs: en Terreno activa el modo marca; en Posicionar y 3D salta al satélite y lo activa (flujo único de plantado). La guía SHALL vivir como acción «Abrir asistente» en la cabecera, que abre el asistente de 4 pasos en un modal sin cambiar de vista.

#### Scenario: Usuario nuevo abre /huerto

- **WHEN** un usuario sin huertos delimitados ni árboles abre /huerto por primera vez
- **THEN** el sistema muestra el lienzo a ancho completo como primer bloque, el selector de especie activa debajo, y la acción «Abrir asistente» visible en la cabecera

#### Scenario: Abrir asistente no cambia la vista

- **WHEN** el usuario pulsa «Abrir asistente»
- **THEN** el asistente se abre en un modal sobre la misma vista y al cerrarlo vuelve al lienzo sin recargar datos

#### Scenario: El lienzo no está escondido tras una pestaña

- **WHEN** el usuario abre /huerto
- **THEN** el mapa se ve sin necesidad de cambiar de pestaña

### Requirement: Summary of the day

La vista única /huerto SHALL organizar el día en bloques con Cultivos y Tareas después del lienzo y del selector de especie: el bento de resumen SHALL evitar duplicar el conteo de inventario (debe leerse «N especies · M árboles» una sola vez, solo de árboles), y la guía SHALL estar siempre a un toque con «Abrir asistente» en la cabecera.

#### Scenario: Resumen bento no duplica conteos

- **WHEN** se muestra el resumen con el inventario de árboles
- **THEN** el conteo de especies únicas y de árboles aparece una sola vez, sin línea redundante ni bloque duplicado

#### Scenario: Dashboard shows daily summary

- **WHEN** a user opens the huerto dashboard
- **THEN** the system shows cards for active crops, today's tasks and seasonal alerts based on the user's crops and current month

#### Scenario: Empty huerto state

- **WHEN** a user has no active crops
- **THEN** the dashboard shows an empty state guiding them to add their first species

## ADDED Requirements

### Requirement: Acceso directo a los árboles del usuario

La pantalla principal SHALL ofrecer un acceso de un toque al inventario de árboles del usuario. El bloque que muestra el conteo de especies y árboles SHALL ser accionable y SHALL llevar al índice de especies, y el selector de especie activa SHALL estar disponible sin necesidad de entrar en modo de plantado.

#### Scenario: El conteo de árboles lleva al inventario

- **WHEN** el usuario pulsa el bloque con «N especies · M árboles»
- **THEN** llega al índice de especies donde ve todas sus especies y sus ejemplares

#### Scenario: El selector de especie está siempre disponible

- **WHEN** el usuario está en /huerto sin estar en modo de plantado
- **THEN** el selector de especie activa está visible y operable con un target táctil de al menos 48 px

#### Scenario: Elegir una especie es un toque desde la pantalla principal

- **WHEN** el usuario quiere empezar a trabajar con una especie concreta
- **THEN** puede seleccionarla directamente desde la pantalla principal sin recorrer la pantalla ni entrar en un asistente

### Requirement: Proporción entre tamaño de cuadro y tamaño de letra

Los bloques de resumen de /huerto SHALL mantener una proporción legible entre el tamaño de sus cifras y el de sus etiquetas, de modo que ninguna etiqueta quede ilegiblemente pequeña frente a un cuadro grande.

#### Scenario: Las etiquetas del resumen son legibles

- **WHEN** se muestra el bloque de Cultivos o el de Hoy en /huerto
- **THEN** sus etiquetas se leen sin esfuerzo y la diferencia de tamaño con la cifra no es disproportionada

### Requirement: Menos texto explicativo en la vista por defecto

La pantalla principal SHALL reducir el texto explicativo de sus bloques por defecto, dejando el detalle disponible bajo demanda en lugar de mostrado siempre.

#### Scenario: Los hints largos no ocupan la vista

- **WHEN** el usuario abre /huerto en su estado por defecto
- **THEN** los textos de ayuda del mapa y de las cards no ocupan varios bloques de la pantalla y quedan disponibles al pedirlo