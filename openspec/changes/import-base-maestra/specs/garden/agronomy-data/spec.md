# Spec Delta

## MODIFIED Requirements

### Requirement: Species catalog

The system SHALL provide a catalog of 30 fruit species, each with a slug, common name, latin name, cultivation difficulty, and **locally hosted image** reference (`/frutas/<slug>.webp`), grouped by fruit family (carozo, pomácea, cítrico, baya, fruto seco, subtropical, otros). Images SHALL NOT be fetched from `commons.wikimedia.org` at runtime to avoid HTTP 429.

El catálogo SHALL estar almacenado en una tabla `dim_especies` con una fila por especie, y su identificador estable SHALL ser el mismo que usan las tablas de hechos del dominio. Cada especie SHALL exponer el alias con el que la calculadora de riego la busca, de modo que el calendario y el motor hablen el mismo nombre en vez de depender de un nombre escrito a mano en el código. El catálogo SHALL ser de solo lectura: la aplicación no lo escribe.

#### Scenario: Browse full catalog
- **WHEN** a user opens the species catalog
- **THEN** the system lists all 30 species with their group and difficulty and renders the locally hosted image without external 429

#### Scenario: Open species detail
- **WHEN** a user selects a species
- **THEN** the system shows its technical sheet with monthly calendar, phenology, irrigation, nutrition, health, pruning and harvest information

#### Scenario: Una especie del Excel existe en la tabla
- **WHEN** se busca una especie por su identificador estable
- **THEN** está, con su nombre, su alias de riego y su volumen de mantenimiento

#### Scenario: El alias de la tabla es el que usa el motor
- **WHEN** el motor de riego busca el calendario de una especie por su alias
- **THEN** el alias corresponde a una fila de `dim_especies`, y no a un nombre escrito a mano en el código

#### Scenario: La aplicación no puede escribir en el catálogo
- **WHEN** un cliente anónimo o autenticado intenta insertar o modificar una especie
- **THEN** la operación es rechazada

### Requirement: Monthly agronomic calendars

The system SHALL provide a monthly calendar per species covering the 12 months, each month describing the growth stage, irrigation guidance, nutrition guidance, health guidance and seasonal alert.

El calendario mensual de riego SHALL estar almacenado en una tabla de hechos con una fila por especie y mes, referenciando la tabla de especies y la tabla de meses. Los valores de rango de litros y de días por mes SHALL conservarse como rango, no colapsados a un promedio. El indicador de reposo SHALL estar presente en la fila, de modo que un mes de reposo sea consultable como tal y no se confunda con un mes sin riego.

#### Scenario: Task suggestions for the current month
- **WHEN** a user has an active crop of a species and requests task suggestions for the current month
- **THEN** the system returns the irrigation, nutrition and health tasks defined in that species' monthly calendar for the month, excluding months whose guidance marks the task as "none"

#### Scenario: Seasonal alert for a crop
- **WHEN** a user views alerts for the current month
- **THEN** the system surfaces the seasonal alert defined in the species' monthly calendar for crops the user has

#### Scenario: Hay una fila por especie y mes
- **WHEN** se cuenta el calendario de riego
- **THEN** hay exactamente una fila por cada combinación de especie y mes

#### Scenario: El rango se conserva
- **WHEN** se lee un mes
- **THEN** vienen el mínimo y el máximo de litros y de días, no solo el promedio

#### Scenario: Un mes de reposo es consultable como tal
- **WHEN** se lee una fila en reposo vegetativo
- **THEN** el indicador de reposo está presente y es verdadero, y el volumen es el de mantenimiento