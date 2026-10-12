# Spec Delta

## MODIFIED Requirements

### Requirement: El motor de riego se verifica contra la calculadora de referencia

El motor de riego SHALL tener una suite automatizada que lo compare, combinación por combinación, contra los resultados precalculados de la calculadora de referencia del Excel maestro. La comparación SHALL cubrir litros y días por árbol para las condiciones de referencia: árbol adulto, copa de referencia, suelo Media y humedad en punto de riego. Toda superficie que muestre un volumen de riego al usuario, incluida la ficha de especie, SHALL obtener ese número del motor y SHALL NOT mantener una copia de la fórmula.

#### Scenario: Una combinación correcta pasa

- **WHEN** se corre el motor con la especie, zona, mes y suelo de una fila del fixture
- **THEN** los litros y los días coinciden exactamente con los valores de esa fila

#### Scenario: Un error en el motor se detecta en su combinación

- **WHEN** el motor devuelve un valor distinto del esperado para alguna combinación
- **THEN** el test falla identificando la especie, la zona y el mes, sin necesidad de ejecución manual

#### Scenario: No hay una segunda implementación de la fórmula

- **WHEN** se busca en el código del cliente una multiplicación de litros por factores de suelo, edad, copa o humedad fuera del motor
- **THEN** no aparece ninguna, porque la ficha de especie consume el motor

#### Scenario: La ficha y el motor coinciden bajo factores no por defecto

- **WHEN** se compara la ficha de especie con el motor bajo humedad seca, suelo fino, zona con desfase y mes de reposo
- **THEN** los litros y los días coinciden en los cuatro escenarios, y antes de este cambio divergían en 38 de 72 combinaciones