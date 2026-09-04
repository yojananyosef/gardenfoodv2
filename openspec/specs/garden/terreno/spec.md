# garden/terreno Specification

## Purpose
Permite al usuario ver su ubicación sobre un mapa y delimitar los bordes de sus huertos dibujando polígonos (uno o varios), persistiendo cada uno como huerto con nombre para usos agronómicos posteriores (superficie, coordenadas, zonificación). Todo sobre servicios gratuitos y sin límite de uso, con límite freemium de huertos por plan.

## Requirements

### Requirement: Visualización del mapa con ubicación del usuario
El sistema SHALL mostrar un mapa interactivo (calles y vista satelital conmutables) centrado en la ubicación del usuario, sin requerir claves de API ni servicios pagos.

#### Scenario: Mapa se centra en la geolocalización del navegador
- **WHEN** el usuario autoriza el permiso de geolocalización al abrir el mapa
- **THEN** el sistema centra el mapa en las coordenadas obtenidas y muestra un marcador aproximado

#### Scenario: Fallback sin permiso de geolocalización
- **WHEN** el usuario deniega el permiso o el navegador no soporta geolocalización
- **THEN** el sistema centra el mapa usando la comuna guardada del perfil si existe coordenada conocida, o un centro por defecto definido por la app

#### Scenario: Conmutación entre vista de calles y satelital
- **WHEN** el usuario cambia la capa base del mapa
- **THEN** el sistema alterna entre teselas de OpenStreetMap (calles) y ESRI World Imagery (satélite) manteniendo el centro, zoom y polígonos actuales

### Requirement: Dibujo del polígono del terreno
El sistema SHALL permitir al usuario autenticado dibujar uno o varios polígonos haciendo clic en los vértices de los bordes de cada huerto, cerrando explícitamente cada figura. Cada polígono cerrado SHALL persistirse como un huerto independiente con nombre asignado automáticamente y editable.

#### Scenario: Usuario dibuja un polígono
- **WHEN** el usuario activa la herramienta de dibujo y marca al menos 3 vértices y cierra la figura
- **THEN** el sistema renderiza el polígono completado sobre el mapa y lo guarda como un huerto con nombre ("Mi huerto" el primero, "Huerto N" los siguientes)

#### Scenario: Múltiples huertos en el mismo mapa
- **WHEN** el usuario ya tiene uno o más huertos guardados y activa la herramienta de dibujo nuevamente
- **THEN** el sistema permite dibujar otro polígono sin borrar los anteriores, y todos se muestran simultáneamente

#### Scenario: Vértices insuficientes no generan polígono
- **WHEN** el usuario intenta finalizar una figura con menos de 3 vértices
- **THEN** el sistema no crea el polígono ni guarda nada

#### Scenario: Cancelación del dibujo en curso
- **WHEN** el usuario cancela mientras traza
- **THEN** el sistema descarta los puntos parciales y restaura el estado anterior del mapa

### Requirement: Edición y borrado de huertos guardados
El sistema SHALL permitir editar los vértices de cualquier polígono existente, renombrar cada huerto y eliminarlo por completo, guardando cada cambio en cuanto ocurre.

#### Scenario: Carga de los huertos guardados
- **WHEN** el usuario abre el mapa y su perfil ya tiene huertos guardados
- **THEN** el sistema muestra todos los polígonos persistidos sobre la capa base seleccionada

#### Scenario: Edición de vértices
- **WHEN** el usuario activa edición y arrastra o agrega vértices de un polígono
- **THEN** el sistema guarda la nueva geometría de ese huerto y actualiza su superficie mostrada

#### Scenario: Renombrado del huerto
- **WHEN** el usuario edita el nombre de un huerto desde la lista bajo el mapa
- **THEN** el sistema persiste el nombre nuevo y lo refleja en la lista

#### Scenario: Borrado del huerto con confirmación
- **WHEN** el usuario elimina un polígono con la herramienta de borrado y confirma
- **THEN** el sistema elimina el huerto guardado y lo quita del mapa y de la lista

#### Scenario: Borrado cancelado restaura la capa
- **WHEN** el usuario cancela la confirmación de borrado
- **THEN** el sistema vuelve a mostrar el polígono en el mapa sin alterar los datos guardados

### Requirement: Persistencia de huertos como GeoJSON
El sistema SHALL persistir cada huerto como una fila con GeoJSON asociado exclusivamente al usuario autenticado (tabla `gf_huertos` con RLS), validando la geometría antes de guardarla, y SHALL mantener la superficie total del perfil como la suma de los huertos.

#### Scenario: Guardado exitoso del huerto
- **WHEN** el usuario cierra un polígono válido de 3 o más posiciones
- **THEN** el sistema almacena el GeoJSON y la superficie calculada en m² en una fila de ese usuario, sincroniza la suma en el perfil y confirma la operación

#### Scenario: Rechazo de geometría inválida
- **WHEN** el cliente o servidor recibe una geometría que no es un polígono GeoJSON válido (menos de 3 posiciones, anillo no cerrado, coordenadas fuera de rango)
- **THEN** el sistema rechaza el guardado e informa el error sin alterar datos previos

#### Scenario: Aislamiento por usuario
- **WHEN** un usuario consulta o guarda sus huertos
- **THEN** solo puede leer y escribir las filas de su propio `user_id`

#### Scenario: Superficie total recalculada
- **WHEN** el usuario crea, edita o elimina un huerto
- **THEN** el sistema muestra y persiste la superficie total en m² como suma de todos sus huertos

### Requirement: Coordenadas del centro de cada huerto
El sistema SHALL mostrar para cada huerto las coordenadas geográficas de su centro (latitud y longitud a 5 decimales) junto a su superficie, y SHALL permitir copiarlas al portapapeles.

#### Scenario: Coordenadas visibles por huerto
- **WHEN** el usuario tiene huertos guardados
- **THEN** cada huerto muestra su superficie en m²/ha y su centro con formato "-33.44890, -70.66930"

#### Scenario: Copia de coordenadas
- **WHEN** el usuario activa copiar en un huerto
- **THEN** el sistema copia las coordenadas al portapapeles y confirma la acción

### Requirement: Límite freemium de huertos
El sistema SHALL limitar el plan gratuito (`perfiles.plan = "gratuito"`) a 1 huerto, validado en el cliente antes de iniciar el dibujo y en la server action `crearHuerto`; los planes pagos y `admin` son ilimitados. Al alcanzar el límite, la UI SHALL mostrar un mensaje de upsell con CTA a `/pricing`.

#### Scenario: Usuario gratuito intenta un segundo huerto
- **WHEN** un usuario gratuito con 1 huerto activa la herramienta de dibujo
- **THEN** el sistema cancela el modo dibujo y muestra un toast de upsell con CTA a `/pricing`, sin crear datos

#### Scenario: Usuario pago crea varios huertos
- **WHEN** un usuario Huertero (o superior) dibuja más de un huerto
- **THEN** el sistema los crea sin restricción

### Requirement: Funcionamiento offline-friendly y gratuito
El sistema SHALL cargar el mapa y sus herramientas únicamente desde dependencias de código abierto gratuitas (Leaflet + plugin de dibujo) y teselas públicas gratuitas (OpenStreetMap, ESRI World Imagery), sin límites de uso impuestos por la aplicación ni claves privadas expuestas al cliente.

#### Scenario: Sin credenciales en el cliente
- **WHEN** el navegador carga el mapa
- **THEN** no se requiere ninguna clave de API ni token para renderizar teselas o usar las herramientas de dibujo

#### Scenario: Degradación sin conexión a teselas
- **WHEN** las teselas fallan al cargarse por red
- **THEN** el mapa sigue operativo para editar los polígonos previamente dibujados y guardar cambios cuando la conectividad lo permita

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
