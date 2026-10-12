# Spec Delta

## ADDED Requirements

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
