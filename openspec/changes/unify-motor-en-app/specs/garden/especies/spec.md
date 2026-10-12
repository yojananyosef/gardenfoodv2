# Spec Delta

## ADDED Requirements

### Requirement: La ficha de especie calcula el riego con el motor único

La ficha de especie SHALL calcular los litros y los días de cada mes llamando al motor de riego de la aplicación, y SHALL NOT reimplementar la fórmula. La ficha SHALL aplicar los mismos factores que el resto de la aplicación: suelo, edad, zona de riego con su desfase, copa, humedad y volumen de mantenimiento en reposo.

#### Scenario: La ficha coincide con el motor en la configuración por defecto
- **WHEN** se abre la ficha de una especie con suelo Media, árbol adulto, zona de riego templada y humedad en punto de riego
- **THEN** los 12 meses muestran los mismos litros y días que devuelve el motor para esas condiciones

#### Scenario: La ficha respeta la humedad
- **WHEN** se abre la ficha de una especie con humedad seca
- **THEN** los litros mostrados incluyen el factor de humedad, y son mayores que con humedad en punto de riego

#### Scenario: La ficha respeta el volumen de mantenimiento
- **WHEN** se abre la ficha de una especie en un mes de reposo vegetativo
- **THEN** el mes muestra el volumen de mantenimiento de la especie y no cero

#### Scenario: La ficha respeta el desfase de la zona
- **WHEN** se abre la ficha de una especie para una zona de riego con desfase de temporada
- **THEN** los meses mostrados están corridos según el desfase de esa zona

### Requirement: La ficha no supone datos que no tiene

Cuando falte el dato de suelo, edad, zona o humedad, la ficha de especie SHALL indicar que ese dato no está disponible y SHALL NOT asumir el valor promedio ni mostrarlo como real.

#### Scenario: Falta el dato de suelo
- **WHEN** la base de riego no trae la clase de suelo seleccionada
- **THEN** la ficha indica que falta el dato de suelo en lugar de calcular con factor 1

#### Scenario: Falta el dato de zona
- **WHEN** la base de riego no trae la zona de riego de la comuna del usuario
- **THEN** la ficha indica que falta el dato de zona en lugar de calcular con clima 1

#### Scenario: Sin datos supuestos
- **WHEN** se inspecciona la ficha
- **THEN** no contiene valores por defecto asumidos para suelo, edad, zona o humedad