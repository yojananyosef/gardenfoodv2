# Design

## Context

`tests/riego-consistencia.test.ts` (creado en `add-tests-motor-riego`, archivado) mide el alcance exacto del bug: **1.045 fallos**, de los cuales 1.044 son combinaciones con `reposo = 1` y 1 es el caso explícito de nogal.

Eso ya dice mucho sobre el fix:

- **Fallan por litros, no por días.** El mensaje de cada aserción compara ambos, y solo se quejan los litros. Confirma que el Paso 5 (días) ya es correcto y no hay que tocarlo.
- **No hay ningún fallo fuera de reposo.** Las 5.436 combinaciones sin reposo pasan. Cualquier cambio en el cálculo normal sería una regresión, y el test lo detectaría.

La fila del calendario trae `reposo: 1` y `litrosMin: 0`. El volumen de mantenimiento vive en la ficha de la especie: `RiegoEspecieRow.mantencionL`, ya declarado en `lib/riego/actions.ts:84` y ya mapeado desde `gf_riego_especies.mantencion_l` en `actions.ts:215`. **No hay que tocar tipos, loaders ni la base.**

`REGLAS_APP` Paso 4 del Excel maestro define la regla:

> Si reposo = 1 → litros_min = litros_max = riego_mantencion_l

## Goals / Non-Goals

**Goals**

- Que las 6.480 combinaciones del fixture pasen en litros y días.
- Un cambio mínimo en el motor: una rama, sin tocar tipos ni esquema.

**Non-Goals**

- No se unifica `FichaEspecieView` con el motor. Sigue reimplementando la fórmula y seguirá mostrando el valor viejo en la ficha de especie hasta `unify-motor-en-app`.
- No se toca el factor de días.
- No se cambia el formato de `RiegoResultado`.

## Decisions

### D1 · La rama va sobre el rango del calendario, no sobre el factor

**Elegido:** cuando `b.reposo === 1`, sustituir `b.litrosMin` y `b.litrosMax` por `base.especie?.mantencionL` **antes** de multiplicar por los factores.

**Alternativa considerada:** multiplicar el resultado por un factor cuando hay reposo. Descartada: el rango del calendario es 0, así que cualquier multiplicación seguiría dando 0. Hay que sustituir la base, no ajustar el resultado.

**Por qué sustituir ambos extremos y no solo el medio:** `litrosMin` y `litrosMax` se exponen en el resultado y llegan a la UI. Si solo se corrigiera el promedio, la tarjeta mostraría el volumen correcto con un rango incoherente (0–0). La regla del Excel dice que en reposo `litros_min = litros_max = riego_mantencion_l`.

### D2 · Sin mantenimiento disponible, se conserva el comportamiento actual

Si `base.especie` es `null` o `mantencionL` es 0, se usa el rango del calendario tal cual. No se inventa un valor: la regla del proyecto es que un dato sin fuente verificada se queda vacío, no se completa. Con el rango 0 el resultado es 0, que es el comportamiento actual y no un invento.

### D3 · El cambio se valida solo con el test existente

**Elegido:** `pnpm exec vitest run tests/riego-consistencia.test.ts` debe pasar de 1.045 fallos a 0.

No hace falta un criterio de aceptación nuevo: el fixture ya contiene las 6.480 expectativas, incluidas las 1.044 de reposo. Añadir otro test sería redundante y daría dos fuentes de verdad para la misma regla.

**Riesgo que esto cubre:** que el fix "arregle" el reposo rompiendo meses normales. Si alguien ampliaría la condición más de lo debido, las 5.436 combinaciones sin reposo empiezan a fallar.

## Risks / Trade-offs

**[R1] · Se cambia un número que el usuario ve, en 19 especies** → El valor nuevo no es una decisión del código: es lo que dice `REGLAS_APP` del Excel maestro y lo que devuelven las 1.044 combinaciones precalculadas. La verificación es contra esa fuente, no contra una preferencia.

**[R2] · La ficha de especie seguirá mostrando el valor viejo** → `components/especies/FichaEspecieView.tsx` reimplementa la fórmula y no consulta el reposo. Este change no lo arregla a propósito: tocar el componente cliente es un diff mayor con sus propios riesgos, y mezclarlo dejaría imposible atribuir un fallo. Queda anotado en `PENDING.md` y lo toma `unify-motor-en-app`.

**[R3] · El defecto se vuelve visible en invierno** → 19 de 30 especies tienen meses de reposo, así que el usuario lo verá en la temporada fría. No es cosmético: es la mitad del año para esas especies.

**[R4] · La cache de 7 días** → La regla no cambia datos, solo código, así que no hay invalidación de cache que hacer. El valor de `mantencion_l` ya venía en el payload.

## Migration Plan

Sin migración. Es un cambio de código.

1. Editar `lib/riego/calc.ts`.
2. Correr el test de consistencia: debe pasar de 1.045 a 0.
3. `typecheck`, `lint` y `build`.
4. Deploy. No hay `revalidateTag` que forzar: no cambian los datos.