# Spec Delta

## ADDED Requirements

### Requirement: La base de datos guarda el dominio agronómico del Excel maestro

La base de datos SHALL almacenar el dominio agronómico completo del Excel maestro en tablas `dim_*`, `cat_*` y `fact_*`, una por hoja de datos del Excel. Cada tabla SHALL tener una clave primaria declarada y las claves foráneas SHALL ser reales, de modo que una fila que referencia una especie o una zona no pueda existir si esa especie o esa zona no existe.

Los datos SHALL ser legibles por el público y SHALL NOT ser escribibles desde la aplicación: las tablas de referencia son de solo lectura.

#### Scenario: Las tablas del dominio están cargadas

- **WHEN** se consulta el conteo de cada tabla del dominio
- **THEN** coincide con el conteo declarado en el diccionario de datos del Excel maestro

#### Scenario: Ninguna fila referencia algo inexistente

- **WHEN** se buscan filas cuya especie, zona o mes no existe en su tabla de dimensión
- **THEN** no hay ninguna, en ninguna de las tablas de hechos

#### Scenario: Un dato sin fuente verificada no se completa

- **WHEN** una celda del Excel está vacía o trae un texto donde el resto de la columna trae números
- **THEN** la columna conserva el tipo que representa lo que hay, y el vacío queda vacío; el importador no inventa un valor

### Requirement: El dominio es regenerable desde el repositorio

El dominio agronómico SHALL tener una fuente canónica versionada en el repositorio, en archivos de datos planos, uno por tabla. La migración SQL SHALL generarse desde esos archivos versionados y no desde el Excel maestro, de modo que la base de datos pueda reconstruirse completa sin el Excel.

#### Scenario: El generador se ejecuta dos veces y da lo mismo

- **WHEN** se regeneran los archivos de datos y la migración desde el mismo Excel
- **THEN** el resultado es idéntico, porque el orden de las filas y el formato de los valores son deterministas

#### Scenario: La base se reconstruye sin el Excel

- **WHEN** la base de datos se elimina y se corre la migración generada
- **THEN** queda con los mismos conteos y los mismos valores, porque la migración se generó desde los archivos versionados

### Requirement: El importador se verifica antes de escribir

El importador SHALL verificar su propia salida antes de escribir nada: tipos coherentes con los valores, claves primarias sin duplicados, claves foráneas sin huérfanos y conteos contra el diccionario de datos del Excel. Si alguna verificación falla, SHALL reportarla y SHALL NOT escribir archivos ni migración.

#### Scenario: Una verificación falla y no se escribe nada

- **WHEN** el Excel tiene una clave foránea que no resuelve
- **THEN** el importador informa el problema y no deja archivos a medias

#### Scenario: Las columnas sospechosas se reportan para revisión

- **WHEN** una columna queda tipada como texto pese a tener aspecto numérico
- **THEN** el importador la señala en un reporte para que una persona la revise, porque ninguna prueba automática cubre el contenido de texto

### Requirement: Un dato de dominio no se almacena en dos lugares

Un mismo conjunto de datos agronómicos SHALL estar almacenado en un solo lugar. Cuando una tabla existente y una tabla nueva contengan los mismos datos, la tabla existente SHALL pasar a ser una vista sobre la nueva, conservando su nombre y sus columnas para que sus lectores sigan funcionando.

Una vista que exponga datos de referencia SHALL tener el mismo comportamiento de lectura que la tabla que reemplaza.

#### Scenario: No hay dos copias del mismo dato

- **WHEN** se busca una tabla física que duplique el contenido de otra
- **THEN** no hay ninguna: la segunda es una vista

#### Scenario: Los lectores existentes siguen funcionando

- **WHEN** la aplicación consulta el nombre viejo de una tabla
- **THEN** recibe las mismas filas, con las mismas columnas y los mismos valores que recibía antes del cambio

#### Scenario: La vista no cambia el comportamiento de lectura

- **WHEN** un cliente anónimo o autenticado consulta la vista
- **THEN** obtiene el mismo resultado que si la tabla física existiera, incluido el acceso anónimo de solo lectura