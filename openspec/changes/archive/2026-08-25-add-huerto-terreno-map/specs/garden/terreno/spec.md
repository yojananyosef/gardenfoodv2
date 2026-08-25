## Purpose

Permite al usuario ver su ubicación sobre un mapa y delimitar los bordes de su terreno dibujando un polígono, persistiéndolo para usos agronómicos posteriores (superficie, zonificación). Todo sobre servicios gratuitos y sin límite de uso.

## ADDED Requirements

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
- **THEN** el sistema alterna entre teselas de OpenStreetMap (calles) y ESRI World Imagery (satélite) manteniendo el centro, zoom y polígono actual

### Requirement: Dibujo del polígono del terreno
El sistema SHALL permitir al usuario autenticado dibujar un polígono haciendo clic en los vértices de los bordes de su terreno, cerrándolo explícitamente para finalizar.

#### Scenario: Usuario dibuja un polígono
- **WHEN** el usuario activa la herramienta de dibujo y marca al menos 3 vértices y cierra la figura
- **THEN** el sistema renderiza el polígono completado sobre el mapa

#### Scenario: Vértices insuficientes no generan polígono
- **WHEN** el usuario intenta finalizar una figura con menos de 3 vértices
- **THEN** el sistema no crea el polígono ni guarda nada

#### Scenario: Cancelación del dibujo en curso
- **WHEN** el usuario cancela mientras traza
- **THEN** el sistema descarta los puntos parciales y restaura el estado anterior del mapa

### Requirement: Edición y borrado del terreno guardado
El sistema SHALL permitir editar los vértices de un polígono existente y eliminarlo por completo.

#### Scenario: Carga del polígono guardado
- **WHEN** el usuario abre el mapa y su perfil ya tiene un terreno guardado
- **THEN** el sistema muestra el polígono persistido sobre la capa base seleccionada

#### Scenario: Edición de vértices
- **WHEN** el usuario activa edición y arrastra o agrega vértices del polígono existente
- **THEN** el sistema refleja los cambios y habilita guardar la nueva geometría

#### Scenario: Borrado del polígono
- **WHEN** el usuario elimina el polígono y confirma guardar
- **THEN** el sistema borra el terreno almacenado del perfil

### Requirement: Persistencia del terreno como GeoJSON
El sistema SHALL persistir el polígono del terreno como GeoJSON asociado exclusivamente al usuario autenticado, validando la geometría antes de guardarla, y SHALL actualizar la superficie aproximada del huerto derivada del polígono.

#### Scenario: Guardado exitoso del terreno
- **WHEN** el usuario guarda un polígono válido de 3 o más posiciones
- **THEN** el sistema almacena el GeoJSON y la superficie calculada en m² en el registro del perfil de ese usuario, y confirma la operación

#### Scenario: Rechazo de geometría inválida
- **WHEN** el cliente o servidor recibe una geometría que no es un polígono GeoJSON válido (menos de 3 posiciones, anillo no cerrado, coordenadas fuera de rango)
- **THEN** el sistema rechaza el guardado e informa el error sin alterar datos previos

#### Scenario: Aislamiento por usuario
- **WHEN** un usuario consulta o guarda su terreno
- **THEN** solo puede leer y escribir el terreno de su propio perfil

#### Scenario: Superficie recalculada
- **WHEN** el usuario guarda o edita el polígono
- **THEN** el sistema muestra y persiste la superficie aproximada en m² correspondiente a la geometría guardada

### Requirement: Funcionamiento offline-friendly y gratuito
El sistema SHALL cargar el mapa y sus herramientas únicamente desde dependencias de código abierto gratuitas (Leaflet + plugin de dibujo) y teselas públicas gratuitas (OpenStreetMap, ESRI World Imagery), sin límites de uso impuestos por la aplicación ni claves privadas expuestas al cliente.

#### Scenario: Sin credenciales en el cliente
- **WHEN** el navegador carga el mapa
- **THEN** no se requiere ninguna clave de API ni token para renderizar teselas o usar las herramientas de dibujo

#### Scenario: Degradación sin conexión a teselas
- **WHEN** las teselas fallan al cargarse por red
- **THEN** el mapa sigue operativo para editar el polígono previamente dibujado y guardar cambios cuando la conectividad lo permita
