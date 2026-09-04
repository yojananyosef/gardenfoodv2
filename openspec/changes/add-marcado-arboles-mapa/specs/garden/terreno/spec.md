## ADDED Requirements

### Requirement: Marcado de árboles sobre el mapa
El sistema SHALL permitir al usuario contar sus árboles directamente sobre el mapa satelital: en modo "Marcar árboles", cada tap dentro de un polígono delimitado SHALL registrar un árbol individual (cantidad 1) asignado al huerto que contiene el punto, con posición normalizada derivada de lat/lng; los marcadores de árboles SHALL permanecer visibles y ser editables (especie, fecha, observaciones, quitar, eliminar) tocándolos. El límite del plan gratuito SHALL aplicar al marcado (validación server-side y upsell en el 2º árbol).

#### Scenario: Conteo por taps con especie activa
- **WHEN** el usuario activa el modo de marcado, elige una especie y toca N puntos dentro de un polígono
- **THEN** el sistema crea N árboles individuales en esas posiciones exactas, con marcadores visibles al instante

#### Scenario: Tap dentro del polígono correcto
- **WHEN** el usuario tiene varios huertos y toca un punto
- **THEN** el árbol se asigna al polígono que lo contiene (hit-test sobre la geometría actual en pantalla)

#### Scenario: Tap fuera de un polígono
- **WHEN** el usuario marca un punto fuera de todo polígono
- **THEN** el sistema no registra nada e informa que debe marcar dentro de un huerto delimitado

#### Scenario: Edición desde el marcador
- **WHEN** el usuario toca un marcador existente
- **THEN** el sistema abre la edición individual del árbol (misma que el plano)

#### Scenario: Límite gratuito en el marcado
- **WHEN** un usuario gratuito con 1 árbol intenta marcar el segundo
- **THEN** el sistema rechaza con mensaje de upsell a Huertero sin crear datos

### Requirement: Visión satelital eficiente
El sistema SHALL mantener el mapa satelital operativo a zoom profundo: la capa Esri World Imagery SHALL detectar dinámicamente el máximo nivel de zoom nativo disponible para la zona consultada (API tilemap de Esri) y reescalar el último nivel existente en lugar de mostrar tiles "Map data not yet available", y SHALL ofrecer una capa satelital global de respaldo gratuita (Sentinel-2 cloudless de EOX, sin claves).

#### Scenario: Zona rural sin zoom 19
- **WHEN** el usuario hace zoom a nivel 19 en una zona donde Esri solo tiene imágenes hasta 18
- **THEN** el sistema ajusta el zoom nativo a 18 y muestra la imagen reescalada (borrosa pero visible), sin tiles grises

#### Scenario: Capa global de respaldo
- **WHEN** el usuario elige "Sentinel-2 (global)" en el control de capas
- **THEN** el mapa carga la mosaico anual de Sentinel-2 de EOX (gratuito, sin clave, hasta zoom nativo 14) con su atribución
