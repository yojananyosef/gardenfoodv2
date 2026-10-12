# Proposal

## Why

La Fase 10 del plan (`PLAN-EJECUCION.md` §10) es higiene de esquema: tablas que
nadie lee, columnas duplicadas en la tabla de mayor volumen, `text` donde
correspondería un enum, y claves foráneas que no existen. Ninguna de esas cinco
cosas rompe la app hoy. Todas van a estorbar en el trabajo que sigue.

Se hace ahora por dos razones concretas:

**1. Es la única fase que no necesita ninguna decisión del usuario.** La Fase 9
tiene escrito "no borres nada sin preguntar" en su punto 9.2, y el punto 9.2
además se solapa con la migración de Mercado Pago a Flow. La Fase 10 no pide
nada: cada punto se verifica contra los datos reales antes de tocar nada.

**2. Despeja el camino de lo demás.** Los catálogos que faltan apuntar (A5 del
plan) y los tipos generados de `types/database.types.ts` se apoyan en un esquema
que hoy tiene integridad declarada a medias.

## Alcance

Cinco puntos, en orden de riesgo creciente:

| # | Qué | Riesgo |
|---|---|---|
| 10.3 | Borrar 5 tablas sin lectores | ~cero |
| 10.4 | Agregar 4 claves foráneas que faltan | bajo |
| 10.5 | Unificar los dos vocabularios de edad | bajo |
| 10.2 | Crear 4 enums (menos los de pagos) | medio |
| 10.1 | Sacar `comuna`/`region`/`zona_agroclimatica` de `gf_analytics_events` | medio |

## Lo que NO entra, y por qué

**`gf_subscription_plans.tier` (parte de 10.2).** Flow va a reescribir esa capa.
Los tiers están además mal hoy: `cosecha`/`huertero`/`full` no coinciden con lo
que el código espera en `perfiles.plan`. Crear el enum ahora es crear el dominio
equivocado dos veces.

**El punto 9.2 de la Fase 9** (suscripción como fuente única) y **el enum de
`plan`**. Mismo motivo: se reescriben con Flow.

**Los 4 errores de tipos de pagos** que aparecieron al conectar
`types/database.types.ts` a los clientes. Es código que se va a reemplazar.

## Verificación hecha antes de proponer

El plan dice que `gf_riego_kc` y las 4 `gf_fertilizacion_*` son write-only y que
`dim_etapas` reemplaza a `gf_riego_kc`. **No se dio por bueno**: se comprobó.

- **Ningún lector**: `grep` sobre `app/`, `lib/`, `components/`, `hooks/`,
  `tests/` y `scripts/` no encuentra ni una mención de las 5 tablas.
- **Ninguna dependencia en la base**: ni vistas, ni funciones, ni claves foráneas,
  ni triggers las mencionan (`scripts/checar_tablas_muertas.mjs`).
- **El contenido de `gf_riego_kc` está completo en `dim_etapas`**: las 8 etapas
  coinciden una a una en Kc **y** en descripción
  (`scripts/comparar_kc_con_dim_etapas.mjs`).

Una salvedad que apareció en esa comparación y que conviene no perder: para la
etapa `CAL`, `gf_riego_kc.kc` es `NULL` y `dim_etapas.kc_referencial` es el
texto `—`. Es la misma ausencia de dato escrita de dos maneras — la columna
vieja es `numeric` y no admite el guion, la nueva es `text` y lo conserva — pero
si alguien compara las dos tablas con `=` a secas va a ver 8 diferencias en vez
de 0. `dim_etapas` tiene **más** información, no menos.

## Impacto en los usuarios

Ninguno. Ninguna de las 5 tablas tiene lectores, y los 8 valores de `gf_riego_kc`
existen íntegros en `dim_etapas`. El punto 10.1 sí reescribe dos RPCs de admin,
pero solo para dejar de leer columnas que se pueden derivar.