# Design

## Context

`API_RESPUESTAS` del Excel maestro v3 tiene **6.480 filas** (30 especies × 11 zonas de riego × 6 macrozonas × 12 meses, con cobertura parcial) y 56 columnas. En la versión v3 trae **fórmulas vivas**: 52 columnas con fórmula en cada una de las 6.480 filas, más 4 columnas de clave que son literales.

Cada fila trae, además del resultado, las columnas `h_*` que documentan su propio cálculo:

| Columna | Qué es |
|---|---|
| `h_mes_programa_n` | Mes del programa de riego tras aplicar el desfase de la zona |
| `h_factor_clima` | `factor_clima` de la zona, ya resuelto |
| `h_fila_riego_mes` | Fila de `FACT_RIEGO_MES` que se usó |
| `h_litros_base` | Volumen base antes de multiplicar por suelo |
| `h_dias_base` | Días base antes de dividir por clima |

Eso permite que el fixture sea **autoverificable**: cada fila declara de dónde salió y con qué factores, así que se puede recalcular sin confiar en el valor cacheado.

**Verificación previa hecha al escribir este change** (script aparte, sobre el Excel v3):

```
filas comparadas            : 6480
litros_media distintos      : 0 (0.0%)
dias_media distintos        : 0 (0.0%)
filas reposo=1              : 1044
  de ellas, litros correctos: 1044/1044
```

El fixture no tiene filas stale. Se puede usar como expectativa.

## Goals / Non-Goals

**Goals**

- Que cualquier cambio futuro de `calc.ts` se pueda verificar contra 6.480 combinaciones de forma automática.
- Que el fixture sea regenerable y auditable, no un blob copiado a mano.
- Que el bug de reposo quede medido antes de arreglarlo.

**Non-Goals**

- No se arregla el reposo. Este change solo lo deja visible.
- No se importa `API_RESPUESTAS` a Postgres.
- No se cambia `calc.ts` ni ningún archivo de runtime.
- No se cubre la ruta de etapa observada (`etapaCodigo`), que usa `FACT_RIEGO_ETAPA` y tiene su propio juego de combinaciones.

## Decisions

### D1 · El fixture se verifica recalculándose, no confiando en la caché

**Elegido:** antes de generar el CSV, el generador recalcula cada fila desde `FACT_RIEGO_MES` + `dim_especies` + `dim_zonas_riego` y compara con el valor cacheado. Si alguna difiere, el generador falla con el detalle en vez de emitir un fixture dudoso.

**Por qué importa:** el Excel guarda el último valor calculado. Si alguien edita `FACT_RIEGO_MES` y guarda sin recalcular, `API_RESPUESTAS` queda stale y el test compararía el motor contra un valor viejo, dando una falsa garantía. Verificar en el punto de generación convierte ese riesgo en un fallo ruidoso.

**Alternativa considerada:** confiar en que las 336.960 fórmulas se recalculan al abrir. Descartada: no podemos asumir que quien editó el Excel abrió y guardó con recálculo forzado.

### D2 · El CSV lleva las columnas `h_*` de trazabilidad

El fixture no solo guarda el resultado: guarda `h_mes_programa_n`, `h_factor_clima`, `h_fila_riego_mes`, `h_litros_base` y `h_dias_base`. Cuando un test falla, el mensaje puede decir "duraznero · N1 · mes 2: esperaba 35 L con base 52,5 y clima 1,3" en vez de solo el número.

**Coste:** el CSV es más ancho (~6.480 × 12 columnas en vez de × 8). Aceptado: el archivo sigue siendo pequeño y el diagnóstico vale más.

### D3 · `calcularRiego` se alimenta de la base real, no de un mock

El test carga la base de riego desde las mismas fuentes que usa la app (`gf_riego_*` vía el mismo mapeo de `lib/riego/actions.ts`) y llama a `calcularRiego` de verdad. No se reimplementa la fórmula dentro del test.

**Por qué:** un test que reimplementa la fórmula verifica que el test está de acuerdo consigo mismo. El valor está en que el motor real, sin tocar, reproduzca los números del Excel.

**Consecuencia:** el test necesita la base disponible sin red. `calc.ts` es puro y recibe la base por parámetro, así que basta con construir el payload en memoria a partir de un snapshot versionado de las tablas `gf_riego_*`, que es lo que hace el seed `0032`.

### D4 · La clave del fixture es `especie_id|zona_riego_id|macrozona_id|mes_n`

Es la clave que el propio Excel usa en su columna `clave`. No incluye suelo porque cada fila cubre los cuatro suelos en columnas separadas; el test usa la de Media, que es la condición de referencia de la que habla `REGLAS_APP`.

### D5 · Agrupar por especie en lugar de un `it()` por fila

6.480 `it()` individuales tardan minutos y producen un reporte ilegible. El test agrupa por especie (30 bloques) y, dentro de cada bloque, itera los meses. Un fallo muestra `especie · mes · esperado vs obtenido` y el bloque entero se marca fallido.

**Alternativa considerada:** `it.each` con las 6.480 filas, que es lo que propone el plan original. Descartada por rendimiento y ruido: el objetivo es que el fallo sea legible en CI.

### D6 · Sin red, sin DB

El test es puro. Carga un snapshot y nada más. Si un test de este módulo necesita red, es una señal de que el motor dejó de ser puro, que es justamente lo que se quiere preservar.

## Risks / Trade-offs

**[R1] · El fixture se vuelve stale respecto al código** → Se versiona junto al test, así que cualquier cambio en `calc.ts` o en las tablas `gf_riego_*` que no actualice el fixture muestra el diff en el review. El test falla mientras el fixture y el motor no coincidan, que es el comportamiento buscado.

**[R2] · El snapshot de `gf_riego_*` no coincide con producción** → El snapshot se genera desde el mismo seed `0032` que está en producción, y se verifica su conteo contra el esperado (623 filas en las 8 tablas de riego). Si alguien cambia el seed, el snapshot cambia y el test lo señala.

**[R3] · 1.044 filas en reposo van a fallar** → **Es el resultado esperado y el punto del change.** `calc.ts:69` multiplica `b.litrosMin`, que vale 0 en reposo, y nunca consulta `riego_mantencion_l`. El test debe fallar en esas filas y el mensaje debe decir que la app devuelve 0 L donde el Excel da el volumen de mantenimiento. Documentar ese fallo es lo que convierte el bug en algo accionable.

**[R4] · El redondeo produce falsos positivos** → Excel y JS redondean half-up; Python redondea a pares. El generador usa `ROUND_HALF_UP` explícito. El test compara enteros ya redondeados por `Math.round`, que coincide con Excel. Verificado en la comprobación previa: 0 diferencias de 6.480.

## Migration Plan

No hay migración ni despliegue. El resultado es un CSV versionado y un archivo de test.

Orden: (1) generador + fixture, (2) verificación del fixture en el propio generador, (3) test contra el motor, (4) documentar en `PENDING.md` el recuento real de fallos para que el fix del reposo parta de un número conocido.