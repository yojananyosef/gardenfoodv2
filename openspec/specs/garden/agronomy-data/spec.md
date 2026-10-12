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

El motor de riego SHALL tener una suite automatizada que lo compare, combinación por combinación, contra los resultados precalculados de la calculadora de referencia del Excel maestro. La comparación SHALL cubrir litros y días por árbol para las condiciones de referencia: árbol adulto, copa de referencia, suelo Media y humedad en punto de riego. Toda superficie que muestre un volumen de riego al usuario, incluida la ficha de especie, SHALL obtener ese número del motor y SHALL NOT mantener una copia de la fórmula.

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

### Requirement: La zona resuelta distingue comuna ausente de comuna válida

La resolución de zona SHALL exponer si la comuna del usuario está efectivamente resuelta en el catálogo o si no hay comuna configurada, de modo que las pantallas dependientes de zona puedan distinguir ambos casos. El valor por defecto SHALL seguir existiendo para que la aplicación no falle, pero SHALL ser identificable por el consumidor en vez de presentarse como la zona real del usuario.

#### Scenario: Comuna válida se marca como resuelta

- **WHEN** el usuario tiene una comuna presente en el catálogo
- **THEN** la resolución entrega la zona correspondiente marcada como resuelta desde la comuna del usuario

#### Scenario: Comuna ausente se marca como no resuelta

- **WHEN** el usuario no tiene comuna configurada en su perfil
- **THEN** la resolución entrega la zona por defecto marcada como no resuelta desde la comuna del usuario, para que la interfaz pueda advertirlo

#### Scenario: Comuna desconocida en el catálogo

- **WHEN** el perfil tiene una comuna que no está en el catálogo
- **THEN** la resolución no falla, entrega la zona por defecto y la marca como no resuelta

### Requirement: Pronóstico meteorológico por día para la comuna del usuario

El sistema SHALL entregar un pronóstico meteorológico para los próximos días de la comuna configurada en el perfil del usuario, con temperatura máxima, temperatura mínima y probabilidad de precipitación por día y fecha. La fuente SHALL ser una que no requiera credencial de API para su uso previsto, y el sistema SHALL distinguir en la respuesta si los datos provienen del pronóstico o del perfil climático histórico de la zona.

#### Scenario: Pronóstico de los próximos días

- **WHEN** el usuario tiene comuna configurada y abre la pestaña Clima
- **THEN** el sistema muestra la máxima, la mínima y la probabilidad de lluvia de cada uno de los próximos días, con su fecha

#### Scenario: Pronóstico para la comuna del perfil

- **WHEN** el usuario cambia su comuna en el perfil
- **THEN** el pronóstico que se muestra corresponde a la nueva comuna

#### Scenario: Fuente del pronóstico identificable

- **WHEN** se muestran datos de pronóstico
- **THEN** la interfaz indica que son pronóstico; cuando solo hay perfil histórico disponible, lo indica como tal y no lo presenta como pronóstico

#### Scenario: Pronóstico no disponible

- **WHEN** la fuente de pronóstico no responde o no hay coordenadas para la comuna
- **THEN** el sistema sigue funcionando y muestra el perfil climático de la zona como respaldo, declarando que son promedios y no pronóstico

#### Scenario: El respaldo no rompe la pantalla principal

- **WHEN** la fuente de pronóstico falla durante la carga de la pantalla principal
- **THEN** la pantalla se renderiza igual, sin errores, con el perfil de la zona

### Requirement: Alertas climáticas predictivas y fechadas

Las alertas climáticas SHALL derivarse del pronóstico de los próximos días y SHALL incluir la fecha a la que se refieren, en lugar de dispararse por el mes del calendario ni describir eventos que ya ocurrieron. La severidad de cada alerta SHALL derivarse del valor previsto, no de un promedio anual.

#### Scenario: Helada prevista con fecha

- **WHEN** el pronóstico de los próximos días tiene una temperatura mínima por debajo del umbral de helada de la zona
- **THEN** el sistema muestra una alerta de riesgo de helada indicando qué día cae por debajo del umbral

#### Scenario: Lluvia prevista con fecha

- **WHEN** el pronóstico supera el umbral de probabilidad de precipitación en alguno de los próximos días
- **THEN** el sistema muestra una alerta de lluvia indicando el día y la probabilidad

#### Scenario: Alerta sin fecha se considera un defecto

- **WHEN** el sistema muestra una alerta climática
- **THEN** esta indica a qué día se refiere

#### Scenario: Sin coincidencias en el pronóstico

- **WHEN** ningún día del pronóstico alcanza ningún umbral
- **THEN** el sistema lo dice de forma explícita y no muestra alertas de relleno ni etiquetas de cobertura vacías

#### Scenario: La severidad responde al valor previsto

- **WHEN** la temperatura mínima prevista cae por debajo del umbral bajo
- **THEN** la severidad de la alerta de helada refleja ese valor y no un rango de días de helada promedio de la zona

### Requirement: Los numeros salen de la base y el texto editorial sale del codigo

El sistema SHALL tomar de las tablas `dim_*` y `fact_*` los **valores
estructurados** de los catalogos agronomicos (veredictos, litros, dias, dosis,
rangos de pH, factores), y SHALL mantener en el codigo el **texto editorial**
(presentaciones, explicaciones de un veredicto, imagenes, orden de presentacion
y vocabularios de una escala).

La razon es que el Excel maestro v3 es una fuente de **datos**, no de
**contenido**. Se verifico celda por celda en sus 47 hojas:

| Que se busca | Donde esta |
|---|---|
| `dim_especies`, `especies_bc`, `especies_ficha_bd20` | la base, completo |
| `fact_viabilidad_zona.viabilidad` | la base, 600 combinaciones |
| `fact_consejos.consejo` | la base, **211 textos distintos** |
| `imagen`, `descripcion` de especie | **en ninguna hoja** |
| `fact_viabilidad_zona.razon` | **la columna no existia** |

Donde hay prosa en los dos lados, no coincide: `fact_consejos` dice venir de
"Base 20 especies" y sus 211 textos tienen **1 solo en comun** con los 154 que
usa el codigo.

#### Scenario: Un valor numerico de catalogo no esta escrito en el codigo

- **WHEN** se necesita un veredicto, un volumen o un factor
- **THEN** sale de la tabla que lo tiene, con el cliente tipado contra
  `types/database.types.ts`

#### Scenario: Un texto editorial no se busca en la base

- **WHEN** se necesita una presentacion, una imagen o la razon de un veredicto
- **THEN** sale del modulo editorial del catalogo, y la tabla guarda la
  columna si existe para poder leerla sin depender del array, como
  `fact_viabilidad_zona.razon`, que se agrego en la migracion 0048

#### Scenario: Migrar un catalogo no cambia lo que ve el usuario

- **WHEN** se mueve un catalogo de un archivo a la base
- **THEN** un script compara el resultado nuevo contra el anterior campo por
  campo, y la diferencia tiene que ser cero o cada diferencia se explica antes
  de continuar

#### Scenario: Un vocabulario de la base contradice al que usa la app

- **WHEN** la escala de dificultad del Excel trae `Muy fácil` o `Fácil-Media` y
  el tipo del codigo solo admite cinco valores fijos
- **THEN** el codigo gana hasta que el Excel se normalice, y el valor del
  Excel queda disponible sin lanzar un error de tipos

### Requirement: Antes de migrar un catalogo se mide cuanto falta

El sistema SHALL comparar, antes de escribir la migracion, cuantas entradas
tiene el catalogo en el codigo contra cuantas tiene la tabla, y SHALL reportar
las que no coinciden en las dos direcciones.

Se hizo con los tres catalogos y el resultado cambio el plan:

| Catalogo | Codigo | Base | Hallazgo |
|---|---|---|---|
| especies | 30 | 30 | 29 diferencias de vocabulario en 270 comparaciones |
| viabilidad | 551 | 600 | **87 combinaciones ausentes** que el codigo nunca tuvo |
| consejos | 154 | 211 | **1 de 154 coincide** |

Las 87 de viabilidad no fallan: `lib/agronomy/index.ts` hace
`if (!viab) continue`, y una entrada ausente hace que la especie simplemente no
aparezca en las recomendaciones de esa zona.

#### Scenario: La tabla tiene mas combinaciones que el codigo

- **WHEN** al medir, la tabla tiene entradas que el archivo nunca tuvo
- **THEN** se reporta como faltante y NO se rellena automaticamente, porque
  cambiar que especies se recomiendan por zona es una decision de producto

#### Scenario: El codigo tiene mas combinaciones que la tabla

- **WHEN** al medir, hay entradas en el archivo que no existen en la base
- **THEN** se investiga por que antes de continuar, porque suele ser un `if`
  anidado o un `??` que se comia el caso
