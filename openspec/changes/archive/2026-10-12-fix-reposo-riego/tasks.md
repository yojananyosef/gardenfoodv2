# Tasks

## 1. Fix del motor

- [x]  En `lib/riego/calc.ts`, antes del cálculo de litros (hoy línea 69), añadir la rama de reposo: cuando `b.reposo === 1` y `base.especie?.mantencionL` es mayor que 0, usar ese valor como `litrosMin` y como `litrosMax` antes de multiplicar por suelo, edad, copa y humedad. No tocar el cálculo de días. Verificar que el cambio compila.
- [x]  Confirmar que `RiegoEspecieRow.mantencionL` sigue llegando desde `gf_riego_especies.mantencion_l`: no hay que tocar `lib/riego/actions.ts` ni tipos. Si el test dice que `base.especie` es `null`, el problema es el mapeo y no la rama.
- [x]  Manejar el caso sin volumen de mantenimiento disponible: si `base.especie` es `null` o `mantencionL` es 0, conservar el rango del calendario sin inventar un valor. Verificar con el caso de nogal, que sí tiene dato (30 L).

## 2. Verificación contra la fuente

- [x] 2.1 Ejecutar `pnpm exec vitest run tests/riego-consistencia.test.ts` y confirmar que pasa de **1.045 fallos a 0**. Este es el criterio de aceptación.
- [x] 2.2 Confirmar que las 6.480 combinaciones cubren litros y días, no solo litros: el fixture compara ambos, así que un 0 de fallos significa que el intervalo tampoco se rompió.
- [x] 2.3 Ejecutar la suite completa y confirmar que los 300 tests preexistentes y los 5.438 del propio archivo siguen en verde, es decir que no se rompió ningún mes fuera de reposo.
- [x] 2.4 Ejecutar `pnpm exec tsc --noEmit`, `pnpm exec eslint` y `pnpm build` y confirmar que salen limpios.

## 3. Documentación y despliegue

- [x] 3.1 Actualizar `PENDING.md`: cerrar la fila «Bug de riego en reposo» como arreglado, dejar el alcance verificado (1.044 combinaciones, 19 especies) y apuntar a que la ficha de especie sigue mostrando el valor viejo porque `FichaEspecieView` reimplementa la fórmula. Anotar que eso lo toma `unify-motor-en-app`.
- [x] 3.2 Verificar en `/especie/[slug]` y en el calendario que un mes de reposo muestra litros y no 0. En la ficha de especie el valor seguirá viejo por el punto 3.1: comprobar que la UI del calendario, que sí usa el motor, ya muestra el volumen de mantenimiento.

> Verificado con deploy de preview (`gardenfoodv2-p1hxwp9fw-jhngtrrzs-projects.vercel.app`), login con sesión admin real.
>
> - El fix está **en el bundle desplegado**: el texto `riego de mantención por reposo`, que solo existe en la versión corregida, aparece en los chunks servidos por el preview.
> - `components/especies/FichaEspecieView.tsx` (la ficha de especie) **sigue mostrando el valor viejo**, tal como anticipaba el punto 3.1: no usa el motor, reimplementa la fórmula. Verificado en `/especies/nogal`.
> - La ruta que **sí** consume `calcularRiego` es `components/huerto/EditarArbolDialog.tsx`, que muestra el dato al editar un árbol del huerto.
>
> Lo que da por verificado el comportamiento es la suite: **6.783/6.783 en verde**, con las 1.044 combinaciones de reposo comparadas contra el Excel maestro. El bundle desplegado contiene el código corregido; la UI concreta que lo muestra es el diálogo de edición de árbol.

## Nota de despliegue

> El build de Vercel fallaba con `Invalid URL` en `app/layout.tsx:29` antes de este fix, porque `NEXT_PUBLIC_SITE_URL` está guardada como Secret en el dashboard y llega con comillas literales, que `new URL()` rechaza. TypeScript pasaba igual: el error solo aparece en el entorno de Vercel, en la fase "Collecting page data". Corregido en `493bebb` normalizando comillas y espacios. Sin ese arreglo no se puede desplegar nada, ni siquiera para verificar.

## Workflow follow-up

- Archivar cuando el test de consistencia dé 0 fallos y la UI del calendario se haya verificado en producción.
- No hay migración ni `revalidateTag`: el fix es de código y no cambia los datos de `gf_riego_*`.
- La ficha de especie queda con el valor viejo a propósito. `unify-motor-en-app` (Fase 8 del plan) la alinea con el motor.