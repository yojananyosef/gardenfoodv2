# Tasks

## 1. Paridad medida antes de tocar nada

- [x] 1.1 Escribir `tests/ficha-riego-paridad.test.ts` que ejecute la reimplementación actual de `FichaEspecieView` (las líneas 195-220, copiadas tal cual) y `calcularRiego` sobre las mismas 72 combinaciones: 6 casos × 12 meses, cubriendo la referencia (Media/adulto/C1/punto de riego), humedad seca, suelo fino + zona N1, nogal en reposo, vid en reposo y kiwi joven con suelo grueso. Verificar que el test **detecta la divergencia actual** (38 con Δ litros, 12 con Δ días) antes de arreglar nada; si da cero, el harness está mal.

> `tests/ficha-riego-paridad.test.ts` con 4 tests en verde. El test de paridad compara la ficha unificada contra el motor en las 72 combinaciones y exige 0 diferencias; el segundo test documenta que la copia **antigua** divergía, para que el número 38/72 quede registrado como prueba de que el defecto existió y no se reintroduzca.

- [x] 1.2 Registrar la divergencia medida en `PENDING.md` con el detalle por factor: la ficha no aplica humedad, ni copa, ni reposo, ni el desfase de zona. Dejar constancia del caso kiwi, que es el más caro (ficha 23-45 L contra motor 0 L con humedad seca).

> ⚠️ **Me equivoqué en la hipótesis y el test lo detectó.** Escribí que kiwi con «humedad seca» daba 0 L en el motor. Al ejecutar el test falló con `expected 0 to be greater than 0`, así que consulté `gf_riego_humedad` en vez de insistir: el nivel 1 es **«0-25% muy seco» con factor 1.3**, y el factor **0** está en los niveles 3-5 (**húmedo**, muy húmedo, capacidad de campo). La divergencia real es la contraria a la que supuse: la ficha da litros de más cuando el suelo ya está empapado. La cifra 38/72 es correcta —la medí ejecutando ambas fórmulas— pero mi explicación del caso kiwi estaba al revés. Corregido en proposal, design (D4) y en el propio test.

## 2. La ficha usa el motor

- [x] 2.1 En `components/especies/FichaEspecieView.tsx`, sustituir el bloque de las líneas 195-220 por una función pura que itere los 12 meses y llame a `calcularRiego` por cada uno, pasando `dbKey`, mes, `zonaRiego: zonaClave`, suelo, edad, copa de referencia y humedad. El rango de litros sale de `litrosMin`/`litrosMax` del motor y los días de `cadaDias`. Verificar que la tabla de 12 meses sigue mostrando las mismas columnas.

> Hecho. Cada fila pasa a ser `{ ...mes, ...resultadoDelMotor, mantencionEnReposo }`. El render se ajustó a los nombres nuevos: `litros`, `litrosMin`, `litrosMax`, `cadaDias`. El texto que muestra los factores-adjusted leía `fv`, `fLitros` y `fc`, que ya no existen; ahora los lee de `suelo.factor`, `edad.factorLitros` y `zonaRiego.factorClima`, que son los mismos valores.

- [x] 2.2 Confirmar que `calc.ts` sigue siendo importable desde el componente cliente: su `import type { RiegoBasePayload } from "./actions"` apunta a un archivo `"use server"`, pero al ser import de tipo se borra en el bundle. Verificar con `pnpm build` que el bundle del cliente no arrastra el módulo de servidor y que el tamaño no crece de forma apreciable.

> `pnpm build` en verde con el motor importado desde un componente cliente. `calc.ts` es puro y no arrastra el módulo `"use server"`: el build lo confirma de la forma más dura posible, porque si hubiera SERVER→CLIENT rompe.

- [x] 2.3 Distinguir en pantalla los dos motivos de 0 L, que se confunden: **reposo** (el árbol está en reposo vegetativo y se da el volumen de mantenimiento, que no es 0) y **sequedad** (`regarHoy === false`, no corresponde regar hoy). Usar `regarHoy` y `detalle` del motor para que el usuario entienda cuál de los dos es, sin inventar texto nuevo.

> El detalle de la curva ahora dice «(reposo: riego de mantención)» cuando la fila venía en reposo. La causa de 0 L por saturación no aparece con la humedad fija de la ficha (nivel 2, factor 1), pero el dato `regarHoy` queda disponible en la fila por si se ofrece el selector.

## 3. Fuera los datos supuestos

- [x] 3.1 Quitar los cuatro `?? 1` (`suelo?.factor ?? 1`, `edad?.factorLitros ?? 1`, `edad?.factorDias ?? 1`, `zonaRiego?.factorClima ?? 1`). Si falta el dato, la ficha SHALL indicar qué falta en vez de asumir el promedio.

> Los cuatro eliminados. Ahora se comprueba la existencia (`faltaSuelo`, `faltaEdad`, `faltaZona`) sin asumir valor.

- [x] 3.2 Añadir el estado explícito de dato faltante, distinto del estado de error de red y del de carga: mensaje que diga qué dato no está disponible y **no** pintar la tabla de litros. Verificar que los otros 8 tabs de la ficha siguen visibles en ese estado.

> Hecho: mensaje que nombra los datos que faltan ("falta la textura del suelo, el tramo de edad"), con enlace a `/perfil`, y sin pintar tabla.

- [x] 3.3 Confirmar que no queda ninguna multiplicación de litros por factores fuera de `lib/riego/calc.ts`: `grep` sobre `components/` y `lib/` de `litrosMin *`, `litrosMax *` y `diasMin *`. Solo debe aparecer dentro del motor.

## 4. Verificación

- [x] 4.1 Invertir el test de 1.1: ahora la reimplementación debe coincidir con el motor en las 72 combinaciones, incluidas las que antes divergían. Confirmar que el test pasa y que el número de diferencias es 0.
- [x] 4.2 Ejecutar `pnpm exec vitest run` completo y confirmar que los 6.783 tests siguen en verde, incluido `riego-consistencia.test.ts` que no debe verse afectado.
- [x] 4.3 Ejecutar `pnpm exec tsc --noEmit`, `pnpm exec eslint` y `pnpm build`, y revisar que el bundle del cliente no creció de forma apreciable.
- [ ] 4.4 Desplegar preview y verificar en `/especies/nogal` que un mes de reposo muestra el volumen de mantenimiento, y en una especie con humedad seca que el número cambió respecto del anterior. Anotar los valores antes y después.

## Workflow follow-up

- Archivar cuando el test de paridad dé 0 diferencias y la ficha se haya verificado en preview.
- Los catálogos duplicados (`lib/agronomy/{comunas,zonas,especies}.ts`, `lib/riego/datos.ts`, 1.500+ líneas) y el puente `zonaRiegoDeZonaId()` quedan fuera de este change: dependen de la importación del Excel maestro (Fase 6 del plan). Anotado en `PENDING.md`.
- `lib/agronomy/fichas.ts` (10.360 líneas de texto de ficha) no se toca: es un monolito documentado en `PENDING.md` y partirlo es otro proyecto.