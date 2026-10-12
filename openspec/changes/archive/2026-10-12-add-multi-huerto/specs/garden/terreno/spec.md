## Purpose

Permite al usuario ver su ubicación sobre un mapa y delimitar los bordes de sus huertos dibujando polígonos (uno o varios), persistiendo cada uno como huerto con nombre para usos agronómicos posteriores (superficie, coordenadas, zonificación). Todo sobre servicios gratuitos y sin límite de uso, con límite freemium de huertos por plan.

## MODIFIED Requirements

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

## ADDED Requirements

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
