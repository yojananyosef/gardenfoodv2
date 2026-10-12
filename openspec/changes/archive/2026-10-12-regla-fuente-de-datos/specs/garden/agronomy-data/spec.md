## ADDED Requirements

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