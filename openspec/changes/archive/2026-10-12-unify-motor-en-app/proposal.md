# Proposal

## Why

`components/especies/FichaEspecieView.tsx` reimplementa la fórmula de riego en vez de llamar a `lib/riego/calc.ts`. Medí la divergencia sobre 72 combinaciones reales (varias especies × suelos × edades × zonas × humedades), ejecutando ambas fórmulas lado a lado contra la misma base:

```
72 combinaciones comparadas | 38 con diferencia en litros | 12 con diferencia en días
```

**53% de las combinaciones muestran un número distinto** al que ve el resto de la app. El plan estimaba «16 L de diferencia con suelo seco», pero el alcance real es mayor y tiene dos causas distintas:

| Causa | Ejemplo | Δ |
|---|---|---|
| La ficha **no aplica humedad** | Duraznero mes 1, humedad seca (nivel 1) | ficha 70 L / motor 91 L (**+21**) |
| La ficha **no aplica el reposo** (ya arreglado en el motor) | Nogal mes 6 | ficha **0 L** / motor 30 L |
| La ficha **no aplica el desfase de zona** | Duraznero mes 4, zona N1 | ficha 41 L / motor 20 L (**−21**) |
| La ficha **ignora la humedad saturada** | Kiwi, niveles 3-5 (`factor_riego = 0`) | ficha 23-45 L / motor **0 L** |

El caso de Kiwi es el más caro: con el suelo húmedo (niveles 3-5, donde el motor dice «no regar hoy») la ficha **recomienda regar igual**. El usuario ve una recomendación de riego que el resto de la app considera contraindicada.

Nadie lo notó porque en la configuración por defecto (suelo Media, adulto, zona templada, punto de riego) las dos fórmulas coinciden. La divergencia solo aparece con suelo fino, zonas áridas o humedad distinta del punto de riego, es decir exactamente donde el consejo tiene más valor.

## What Changes

- **La tabla de 12 meses de la ficha se calcula llamando a `calcularRiego`** en un bucle sobre los 12 meses, con los mismos factores que usa el diálogo de edición de árbol (`EditarArbolDialog`), que ya consume el motor. Se elimina la reimplementación de las líneas 195-220.
- **Se eliminan los `?? 1` que adivinan.** Donde hoy hay `suelo?.factor ?? 1`, `edad?.factorLitros ?? 1`, `edad?.factorDias ?? 1` y `zonaRiego?.factorClima ?? 1`, la ficha pasa a decir que el dato no está disponible en vez de asumir el promedio y mostrarlo como real. A 30 líneas de distancia, `calc.ts` ya hace lo contrario: devuelve `null` si falta la base.
- **La ficha pasa a respetar el reposo y la humedad**, porque los hereda del motor.
- **No se tocan** `lib/agronomy/{comunas,zonas,especies}.ts`, `lib/riego/datos.ts` ni el `zonaRiegoDeZonaId()`: son los pasos A4 y A5 del plan y dependen de la Fase 6 (importar el Excel maestro), que es un change aparte.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/especies`: la ficha de especie SHALL calcular el riego con el mismo motor que el resto de la aplicación, y SHALL NOT mostrar un volumen supuesto cuando falta un dato de suelo, edad, zona o humedad. Hoy la spec no dice de dónde sale el número que ve el usuario en la ficha, así que la divergencia no era un incumplimiento detectable.
- `garden/calculadoras`: se refuerza el requisito de que el cálculo de riego tenga una sola implementación. La ficha de especie es hoy un segundo motor, lo que contradice la regla del proyecto de que el dato de dominio vive en un solo lugar.

## Impact

- **Runtime**: un archivo, `components/especies/FichaEspecieView.tsx`, en la sección de riego (líneas 195-220). El resto del componente (calendario, nutrición, sanidad, poda, cosecha, fenología) no se toca.
- **Tests**: `tests/riego-consistencia.test.ts` sigue verde (no lo toca) y se añade cobertura de la ficha: que sus 12 meses coincidan con el motor bajo humedad seca, suelo fino, zona árida y reposo.
- **Sin migraciones, sin cambios de base, sin API.**
- **Riesgo**: la ficha cambia números que el usuario ya vio. El cambio es correcto por definición contra el motor, que es el que valida 6.480 combinaciones contra el Excel maestro, pero el usuario puede entenderlo como una regresión si no se explica. Se documenta en `PENDING.md` y en el propio texto de la ficha.
- **Lo que NO cambia**: el resto de catálogos duplicados (1.500+ líneas) sigue ahí. La regla del proyecto queda cumplida en el camino del riego, no en todo el dominio. Queda anotado para el change de importación del Excel.