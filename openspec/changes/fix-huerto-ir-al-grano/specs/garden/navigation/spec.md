# Spec Delta

## ADDED Requirements

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