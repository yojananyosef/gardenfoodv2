# garden/agronomy-data Specification
## Purpose

Validates Chilean region/comuna input against the catalog of 346 official comunas and derives the correct agroclimatic zone so every location-dependent feature resolves accurately.

## Requirements

### Requirement: Comuna validation against the catalog
The system SHALL expose a validation function that verifies a `comuna` (and its `region`) exists in the catalog of **346** comunas — the official SUBDERE División Político Administrativa count (16 regiones / 56 provincias / 346 comunas, per BCN and INE) — and returns the matching agroclimatic zone, or signals invalid input. The catalog sizes of 208 (legacy docs) and 254 are superseded; 346 is the canonical count.

#### Scenario: Known comuna resolves a zone
- **WHEN** given a comuna present in the catalog together with its correct region
- **THEN** the function returns the corresponding `zona_agroclimatica` without error

#### Scenario: Unknown comuna is invalid
- **WHEN** given a comuna not present in the catalog
- **THEN** the function reports the input as invalid so callers can reject it

### Requirement: Zone derivation is used at registration and profile edit
Registration and profile-editing flows SHALL derive `zona_agroclimatica` exclusively from the validated comuna and SHALL NOT use a hardcoded fallback zone.

#### Scenario: No hardcoded zone fallback
- **WHEN** a location is saved during registration or profile edit
- **THEN** the stored zone comes from the catalog lookup, never from a constant string

### Requirement: Agroclimatic zones and commune mapping
The system SHALL provide a data source with the 20 Chilean agroclimatic zones and the **346** official communes mapped to their region and agroclimatic zone (with `COMUNAS_ZONA` derived from the single `COMUNAS` list), and climate profile data per zone (temperature range, precipitation, frost risk). The public landing region/comuna selector SHALL consume the same canonical catalog so it always offers the complete set.

#### Scenario: Zone resolved from commune
- **WHEN** a user profile specifies a commune
- **THEN** the system resolves the corresponding agroclimatic zone and its climate profile for recommendations

#### Scenario: Unrecognized commune
- **WHEN** a commune does not match any known commune in the catalog
- **THEN** the system falls back to a default neutral zone (Santiago Norte id 7) without failing

#### Scenario: Landing selector offers the full catalog
- **WHEN** an anonymous visitor opens the landing zone selector
- **THEN** they can choose any of the 16 regions and any of the 346 official comunas, and the widget resolves tasks from the comuna's canonical zone

### Requirement: Species catalog
The system SHALL provide a catalog of 30 fruit species, each with a slug, common name, latin name, cultivation difficulty, and **locally hosted image** reference (`/frutas/<slug>.webp`), grouped by fruit family (carozo, pomácea, cítrico, baya, fruto seco, subtropical, otros). Images SHALL NOT be fetched from `commons.wikimedia.org` at runtime to avoid HTTP 429.

#### Scenario: Browse full catalog
- **WHEN** a user opens the species catalog
- **THEN** the system lists all 30 species with their group and difficulty and renders the locally hosted image without external 429

#### Scenario: Open species detail
- **WHEN** a user selects a species
- **THEN** the system shows its technical sheet with monthly calendar, phenology, irrigation, nutrition, health, pruning and harvest information

### Requirement: Monthly agronomic calendars
The system SHALL provide a monthly calendar per species covering the 12 months, each month describing the growth stage, irrigation guidance, nutrition guidance, health guidance and seasonal alert.

#### Scenario: Task suggestions for the current month
- **WHEN** a user has an active crop of a species and requests task suggestions for the current month
- **THEN** the system returns the irrigation, nutrition and health tasks defined in that species' monthly calendar for the month, excluding months whose guidance marks the task as "none"

#### Scenario: Seasonal alert for a crop
- **WHEN** a user views alerts for the current month
- **THEN** the system surfaces the seasonal alert defined in the species' monthly calendar for crops the user has

### Requirement: Viability matrix
The system SHALL provide a viability matrix of 30 species × 20 zones classifying each combination as `si`, `riesgo` or `no`, with an optional technical explanation. The matrix SHALL be consumed by the recommendations view.

#### Scenario: Species viability for a zone
- **WHEN** a user browses species for their agroclimatic zone via recommendations
- **THEN** the system shows each species classified as recommended, at risk, or not recommended for that zone with its `razon`

### Requirement: Muestra gratuita del catálogo
The system SHALL expose `duraznero` as the free catalog sample (`ESPECIE_MUESTRA_GRATIS`) and a pure helper `esMuestraGratuis(slug)`. Anonymous visitors SHALL be able to open the sample's full technical ficha; every other species SHALL be presented as locked (visual lock + upsell CTA) while the underlying content remains server-rendered for SEO.

#### Scenario: Sample constant resolves
- **WHEN** any caller checks `esMuestraGratuis("duraznero")`
- **THEN** it returns `true`, and any other slug returns `false`

#### Scenario: Locked species keep SEO rendering
- **WHEN** a locked species page is requested
- **THEN** the response HTML contains the full ficha content regardless of the locked presentation

# Spec Delta


### Requirement: El motor de riego se verifica contra la calculadora de referencia

El motor de riego SHALL tener una suite automatizada que lo compare, combinación por combinación, contra los resultados precalculados de la calculadora de referencia del Excel maestro. La comparación SHALL cubrir litros y días por árbol para las condiciones de referencia: árbol adulto, copa de referencia, suelo Media y humedad en punto de riego.

#### Scenario: Una combinación correcta pasa

- **WHEN** se corre el motor con la especie, zona, mes y suelo de una fila del fixture
- **THEN** los litros y los días coinciden exactamente con los valores de esa fila

#### Scenario: Un error en el motor se detecta en su combinación

- **WHEN** el motor devuelve un valor distinto del esperado para alguna combinación
- **THEN** el test falla identificando la especie, la zona y el mes, sin necesidad de ejecución manual

### Requirement: El fixture de resultados es regenerable y trazable

El fixture de resultados SHALL estar versionado en el repositorio, ser regenerable desde el Excel maestro y SHALL verificarse a sí mismo recalculándose desde las tablas fuente antes de usarse como expectativa. Cada campo SHALL documentar de qué hoja y columna del Excel proviene, y con qué comando se regenera.

#### Scenario: El fixture es coherente con las tablas fuente

- **WHEN** se regenera el fixture y se recalcula cada fila desde las tablas de riego y especies
- **THEN** las 6.480 filas coinciden; si alguna no coincide, el fixture se reporta como no confiable en lugar de usarse



#### Scenario: El redondeo es half-up

- **WHEN** el cálculo produce un valor con exactamente .5
- **THEN** el redondeo sigue la convención de Excel y JavaScript (half-up), no la de Python (banker's rounding)

### Requirement: El fixture es una materialización del motor, no una fuente de dominio

La tabla de resultados precalculados del Excel SHALL NOT importarse a la base de datos como tabla de referencia, porque es la salida del motor y no su entrada. El fixture SHALL regenerarse desde el Excel maestro versionado y SHALL documentar de qué hoja y de qué columnas proviene cada campo, para que una corrección en el Excel sea rastreable hasta el test que falla.

#### Scenario: El Excel cambia pero las tablas fuente no

- **WHEN** el Excel maestro cambia un valor de riego y el fixture se regenera
- **THEN** la diferencia queda visible en el test contra el motor, en vez de aceptarse en silencio

#### Scenario: Procedencia del fixture documentada

- **WHEN** alguien abre el fixture para depurar un fallo
- **THEN** puede ver de qué hoja y columna del Excel proviene cada campo y con qué comando se regenera
