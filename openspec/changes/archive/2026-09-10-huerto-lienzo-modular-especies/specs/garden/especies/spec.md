# Delta spec: garden/especies

## ADDED Requirements

### Requirement: Buscador en el índice de especies

El índice de especies SHALL ofrecer un buscador que filtra las tarjetas por nombre de especie (o sinónimo común) en tiempo real, sin recargar la página; con texto vacío se muestran todas.

#### Scenario: Filtrar por texto

- **WHEN** el usuario escribe «dur» en el buscador
- **THEN** quedan visibles solo las tarjetas cuyo nombre/specie coincide (Durazno) y el resto se ocultan

#### Scenario: Sin coincidencias

- **WHEN** el texto no coincide con ninguna especie
- **THEN** el índice muestra un estado vacío con opción de limpiar el filtro

### Requirement: Tarjeta-puente al asistente

El índice de especies SHALL incluir una tarjeta destacada de estilo dashed «¿Qué árbol tienes en casa?» con CTA al flujo de alta por tarjetas (asistente del huerto, paso Árboles), sirviendo de único puente between módulo Especies y alta (R2), sin duplicar lógica de creación.

#### Scenario: Puente al asistente

- **WHEN** el usuario activa la tarjeta dashed
- **THEN** se abre el asistente del huerto en el paso de alta de árboles/cultivos (tarjetas de fruta)
