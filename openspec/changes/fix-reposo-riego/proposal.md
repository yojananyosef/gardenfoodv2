# Proposal

## Why

Cuando un frutal está en reposo vegetativo, la app le dice al usuario **«0 L cada 20 días»**. No es una decisión agronómica: es un error. `REGLAS_APP` Paso 4 del Excel maestro dice, literalmente:

> Si reposo = 1 → litros_min = litros_max = riego_mantencion_l (así lo hace la calculadora original del Excel de suelo y riego, celdas B50, B51 y B59: «SÍ, pero solo un riego de mantención»). **La app hoy devuelve 0 L en esos meses: es un error de la app, no de la regla.**

`lib/riego/calc.ts:69` multiplica `b.litrosMin`, que la base tiene en 0 durante el reposo, y nunca consulta `riego_mantencion_l`.

**Alcance medido** con `tests/riego-consistencia.test.ts` (creado en `add-tests-motor-riego`): **1.044 de 6.480 combinaciones**, en 19 de 30 especies. Las otras 5.436 coinciden al litro, así que el reposo es la única divergencia entre el motor y la fuente.

| Especie | Meses en reposo | `mantencion_l` | Lo que ve el usuario |
|---|---|---|---|
| Vid | Mar-Ago | 11 L | **0 L** |
| Nogal | Jun-Ago | 30 L | **0 L** |
| Kiwi | Jun-Ago | 30 L | **0 L** |
| Manzano | Jun-Ago | 19 L | **0 L** |
| Cerezo | Abr-Jul | 15 L | **0 L** |
| Frutilla | Jun-Jul | 2 L | **0 L** |

Nadie lo reportó porque los meses de reposo traen `dias = 20`, y «0 L cada 20 días» parece una decisión tomada a propósito.

## What Changes

- **`lib/riego/calc.ts` consulta `mantencion_l` cuando la fila del calendario está en reposo**, y usa ese volumen en lugar del rango (que es 0). Es el único archivo de runtime que cambia.
- **El factor de días no se toca.** `REGLAS_APP` Paso 4 solo sustituye el volumen, y el Paso 5 sigue usando `(dias_min + dias_max) / 2` del calendario. Los 1.044 tests que fallan hoy lo confirman: fallan por litros, y los días ya coinciden.
- **Se añade `mantencionL` al tipo de la base** solo si ya existe: `RiegoEspecieRow.mantencionL` ya está declarado y ya se mapea desde `gf_riego_especies.mantencion_l` en `actions.ts:215`. No hace falta tocar tipos ni loaders.
- **`components/especies/FichaEspecieView.tsx` no se toca en este change.** Reimplementa la fórmula en el cliente y tampoco aplica el reposo, pero cambiarlo es un diff mayor y le corresponde a `unify-motor-en-app`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/calculadoras`: el requisito vigente describe el cálculo de riego sin mencionar el reposo. Se le añade el comportamiento: cuando el mes está en reposo vegetativo, el volumen es el de mantenimiento y no el rango del calendario.

## Impact

- **Runtime**: un solo archivo, `lib/riego/calc.ts`, una rama en el cálculo de litros.
- **Tests**: `tests/riego-consistencia.test.ts` pasa de 1.045 fallos a 0. Ese es el criterio de aceptación, y es verificable sin interpretación: las 1.044 combinaciones de reposo más el caso explícito de nogal.
- **Sin migraciones**: `riego_mantencion_l` ya está en `gf_riego_especies` y ya se carga. No hay que tocar la base.
- **Sin cambios de API ni de contrato**: la forma de `RiegoResultado` no cambia; cambia el valor de dos números.
- **Riesgo**: el cambio es correcto por definición contra la fuente, pero altera un número que el usuario ve. Si la regla de reposo se invirtiera, el efecto seríaVisible en 19 especies durante medio año. Por eso la verificación es contra los 1.044 casos del Excel y no a ojo.
- **Deuda que este change NO cierra**: `FichaEspecieView` seguirá mostrando el valor viejo en la ficha de especie hasta que se unifique con el motor. Queda anotado en `PENDING.md`.