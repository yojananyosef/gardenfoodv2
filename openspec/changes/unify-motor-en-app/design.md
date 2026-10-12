# Design

## Context

`components/especies/FichaEspecieView.tsx` es un componente **cliente** (`"use client"`). Para pintar la tabla de 12 meses reimplementa la fórmula en las líneas 195-220:

```ts
const suelo = base?.suelos.find((t) => t.clave === (sueloId ?? "M"));
const fv = suelo?.factor ?? 1;
const edad = base?.edades.find((e) => e.n === edadN);
const fLitros = edad?.factorLitros ?? 1;
const fDiasEdad = edad?.factorDias ?? 1;
const zonaClave = zonaRiegoDeZonaId(zonaId);
const zonaRiego = base?.zonas.find((z) => z.clave === zonaClave);
const fc = zonaRiego?.factorClima ?? 1;
const factorDias = (fv * fDiasEdad) / fc;
// …
const lMin = Math.round(m.litrosMin * fv * fLitros);   // sin copa, sin humedad
```

`lib/riego/calc.ts` es un módulo **puro sin imports de servidor**: recibe la base por parámetro y no importa nada de Supabase ni de `next/cache`. Por eso se puede llamar desde el cliente sin reestructurar la carga de datos. `EditarArbolDialog.tsx` ya lo hace, y por eso hay dos rutas que deberían dar lo mismo y no lo dan.

### Divergencia medida (72 combinaciones, misma base)

```
72 combinaciones | 38 con Δ litros | 12 con Δ días
```

| Factor | Lo aplica el motor | Lo aplica la ficha | Δ típico |
|---|---|---|---|
| Suelo | sí | sí | — |
| Edad | sí | sí | — |
| Zona (clima) | sí | sí | — |
| **Desfase de zona** | **sí** (`mesZona`) | **no** | hasta 21 L |
| **Humedad** | **sí** (`factorRiego`) | **no** | hasta 21 L |
| **Copa** | **sí** (`(copa/copaRef)²`) | **no** | — |
| **Reposo** | **sí** (`mantencionL`) | **no** | 30 L en nogal |

## Goals / Non-Goals

**Goals**

- Que la ficha use `calcularRiego` y deje de mantener una copia de la fórmula.
- Que los `?? 1` desaparezcan: si falta un dato, se dice.
- Que el cambio sea verificable con un test, no a ojo.

**Non-Goals**

- No se borran `lib/agronomy/{comunas,zonas,especies}.ts` ni `lib/riego/datos.ts`. Son los pasos A4/A5 del plan y dependen de la Fase 6.
- No se toca `zonaRiegoDeZonaId()`, que sigue siendo el puente con los `if` hardcodeados (defecto B6 del plan). La ficha sigue resolviendo la zona por esa función.
- No se toca el resto de la ficha: calendario, nutrición, sanidad, poda, cosecha, fenología, consejos.

## Decisions

### D1 · Calcular en el cliente llamando al motor, no pasar props desde el servidor

**Elegido:** la ficha sigue siendo cliente y llama a `calcularRiego` en un `useMemo` sobre los 12 meses, reusando el `base` que ya carga con `obtenerRiegoBase`.

**Alternativa considerada:** calcular en `page.tsx` (servidor) y pasar las filas como props. Es la opción que el plan recomienda, pero obliga a cambiar la carga de datos de la ficha y a decidir qué se renderiza en servidor y qué en cliente. Con un motor puro ya disponible, el diff chico es menor y no toca la arquitectura de renderizado.

**Consecuencia:** los 12 meses se calculan en cada render del componente cuando cambian los factores. `calcularRiego` es aritmética simple sobre un array de 12, así que el costo es despreciable, y React memoiza mientras los factores no cambien.

### D2 · `calcularRiego` devuelve un valor único, pero la ficha necesita el rango

`calcularRiego` devuelve `litros`, `litrosMin`, `litrosMax` y `cadaDias`. La ficha muestra un rango (lMin–lMax) y un rango de días (dMin–dMax). `cadaDias` es un promedio, no un rango.

**Elegido:** la ficha muestra el `litros` del motor como valor recomendado y conserva el rango de días calculándolo con la misma base que el motor, **no** con `diasMin`/`diasMax` crudos multiplicados.

**Por qué importa:** el componente actual multiplica `m.diasMin * factorDias` y `m.diasMax * factorDias`, mientras el motor hace `Math.round(((diasMin + diasMax) / 2) * suelo * edad / clima)`. Son operaciones distintas: una preserva el rango y la otra promedia. La ficha pasa a mostrar el mismo número que el resto de la app, y eso requiere usar la salida del motor.

### D3 · Los `?? 1` se quitan, pero no con `return null`

Quitar los `?? 1` tiene dos salidas posibles: devolver `null` (el motor) o mostrar un estado explícito.

**Elegido:** la ficha ya tiene un estado de error (`if (error) return …`) y uno de carga (`if (!base || cargando) return …`). Se añade un tercero: si falta suelo, edad o zona, se muestra un aviso de que ese dato no está disponible y **no se pinta la tabla de litros**.

**Por qué no `return null` silencioso:** la ficha tiene 9 tabs, y vaciar solo el de riego sin explicar nada deja al usuario pensando que el árbol no necesita agua. Un mensaje que diga qué dato falta es más honesto y es lo que el criterio del proyecto pide («un dato sin fuente verificada se queda vacío, no se completa»).

### D4 · Kiwi: el caso que obliga a mirar dos veces, y una corrección

Los niveles de humedad son estos, verificados contra `gf_riego_humedad`:

| Nivel | Nombre | `factor_riego` |
|---|---|---|
| 1 | 0-25% muy seco | **1.3** |
| 2 | 25-50% seco (punto de riego) | 1.0 |
| 3 | 50-75% húmedo | **0** |
| 4 | 75-100% muy húmedo | **0** |
| 5 | 100% capacidad de campo | **0** |

**Yo asumí mal al medir.** Escribí que kiwi con «humedad seca» daba 23-45 L en la ficha contra 0 en el motor. El nivel 1 es *muy seco* y sube el riego a 1.3×; el factor 0 está en los niveles 3-5, los **húmedos**, donde el motor dice «no regar hoy». La divergencia real es la contraria: la ficha da litros **de más** cuando el árbol ya está empapado, porque no mira `factorRiego`.

La cifra de 38 de 72 combinaciones con Δ litros sigue siendo correcta — la medí ejecutando ambas fórmulas, no suponiendo. Lo que estaba mal era mi explicación de un caso concreto.

**Consecuencia para la UI:** el mensaje de 0 L tiene que distinguir dos causas que se confunden a simple vista: **reposo** (el árbol está en reposo vegetativo y sí recibe volumen de mantenimiento, que no es 0) y **saturación** (`regarHoy === false`, el suelo está húmedo y no corresponde regar). `regarHoy` y `detalle` del motor dan material para distinguirlas sin inventar nada.

## Risks / Trade-offs

**[R1] · La ficha cambia números que el usuario ya vio** → Es el objetivo del change. La justificación es que el motor es el que valida 6.480 combinaciones contra el Excel maestro y la ficha no valida ninguna. Se registra en `PENDING.md` con el antes y el después medido.

**[R2] · `FichaEspecieView` es cliente y `calc.ts` importa tipos de `actions.ts`** → `calc.ts` importa `type { RiegoBasePayload }` de `./actions`, que es un archivo `"use server"`. Los imports de **tipo** se borran en el bundle, así que no arrastra el módulo de servidor. Hay que verificar que sigue compilando y que el bundle del cliente no crece con código de servidor.

**[R3] · Regresión en el resto de la ficha** → El diff se limita a la sección de riego. `pnpm typecheck`, `lint`, `build` y los 6.783 tests son la red.

**[R4] · Quedan duplicados fuera del camino del riego** → `lib/agronomy/*` y `datos.ts` siguen declarando constantes agronómicas. La regla del proyecto queda cumplida en el motor, no en todo el dominio. Anotado para el change de importación del Excel.

## Migration Plan

Sin migración ni despliegue de base.

1. Extraer el cálculo de la ficha a una función pura que llame a `calcularRiego`.
2. Quitar los `?? 1` y añadir el estado de dato faltante.
3. Test de paridad ficha-motor bajo los cuatro escenarios.
4. `typecheck`, `lint`, `build`, suite completa.
5. Deploy y verificación visual de la ficha.