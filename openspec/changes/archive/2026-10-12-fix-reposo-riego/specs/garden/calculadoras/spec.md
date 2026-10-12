# Spec Delta

## ADDED Requirements

### Requirement: El riego en reposo usa el volumen de mantenimiento

Cuando el mes consultado cae en reposo vegetativo para la especie, el sistema SHALL usar el volumen de mantenimiento de la especie (`riego_mantencion_l`) como volumen base, y SHALL NOT usar el rango del calendario, que es cero en esos meses. La frecuencia SHALL seguir viniendo del calendario: el reposo sustituye el volumen, no el intervalo.

#### Scenario: Mes en reposo devuelve el volumen de mantenimiento
- **WHEN** se calcula el riego de una especie en un mes marcado como reposo, con suelo Media, árbol adulto, copa de referencia y humedad en punto de riego
- **THEN** el sistema devuelve el volumen de mantenimiento de esa especie y no cero

#### Scenario: Nogal en junio
- **WHEN** se calcula el riego de nogal en junio, suelo Media, árbol adulto
- **THEN** el sistema devuelve 30 L, que es su volumen de mantenimiento, y no 0 L

#### Scenario: El intervalo no cambia con el reposo
- **WHEN** se compara el resultado de un mes en reposo con el del mismo mes fuera de reposo
- **THEN** los días entre riegos coinciden, porque el reposo solo sustituye el volumen

#### Scenario: Fuera de reposo el cálculo no cambia
- **WHEN** se calcula el riego de una especie en un mes que no está en reposo
- **THEN** el resultado es idéntico al de antes del fix, usando el rango del calendario

#### Scenario: El motor sigue reproduciendo la calculadora del Excel
- **WHEN** se corre la comparación del motor contra los 6.480 resultados precalculados de la calculadora de referencia del Excel maestro
- **THEN** las 6.480 combinaciones coinciden en litros y días