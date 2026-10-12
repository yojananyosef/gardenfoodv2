# Spec Delta

## MODIFIED Requirements

### Requirement: Agroclimatic zones and commune mapping

The system SHALL provide a data source with the 20 Chilean agroclimatic zones and the **346** official communes mapped to their region and agroclimatic zone (with `COMUNAS_ZONA` derived from the single `COMUNAS` list), and climate profile data per zone (temperature range, precipitation, frost risk). The public landing region/comuna selector SHALL consume the same canonical catalog so it always offers the complete set.

La zona de riego de una comuna SHALL obtenerse de la relación que guarda el catálogo, no de una función que traduzca el número de zona con condicionales. Cuando el número de zona no alcanza a determinar la zona de riego —porque dentro de una misma zona hay comunas con distinto clima de riego— el sistema SHALL usar la relación por comuna y no una aproximación por zona.

Ningún factor agronómico de referencia —factor de suelo, rango de humedad, factor de zona, copa de referencia— SHALL estar escrito a mano en el código cuando exista en el catálogo.

#### Scenario: Zone resolved from commune
- **WHEN** a user profile specifies a commune
- **THEN** the system resolves the corresponding agroclimatic zone and its climate profile for recommendations

#### Scenario: Unrecognized commune
- **WHEN** a commune does not match any known commune in the catalog
- **THEN** the system falls back to a default neutral zone (Santiago Norte id 7) without failing

#### Scenario: Landing selector offers the full catalog
- **WHEN** an anonymous visitor opens the landing zone selector
- **THEN** they can choose any of the 16 regions and any of the 346 official comunas, and the widget resolves tasks from the comuna's canonical zone

#### Scenario: Una comuna del sur usa la zona de riego del catálogo
- **WHEN** el motor de riego calcula el riego de una especie para un usuario cuya comuna está registrada
- **THEN** usa la zona de riego que el catálogo asigna a esa comuna

#### Scenario: La resolución no depende de una función que adivine
- **WHEN** se busca en el código una función que traduzca un número de zona a una zona de riego con condicionales
- **THEN** no existe, porque la relación vive en el catálogo y no en el código

#### Scenario: Sin factores escritos a mano
- **WHEN** se busca en `lib/` una constante de suelo, humedad, edad o zona de riego
- **THEN** no aparece ninguna duplicando lo que ya guarda el catálogo

#### Scenario: El detalle del cálculo declara de dónde sale
- **WHEN** el motor devuelve su detalle en texto
- **THEN** nombra la zona de riego que usó, para que el número se pueda rastrear hasta la fila del catálogo