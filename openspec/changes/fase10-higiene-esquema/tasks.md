# Tasks

Cada punto va en su propia migración, y cada migración se aplica por separado:
así un fallo deja el esquema en un estado conocido y no a medio camino.

## 10.3 Tablas sin lectores

- [x] 10.3.1 Dejar los chequeos como scripts versionados (`scripts/checar_tablas_muertas.mjs` y `scripts/comparar_kc_con_dim_etapas.mjs`), para que la afirmación "nadie las lee" sea reproducible y no un comentario.
- [x] 10.3.2 Volcar las 8 filas de `gf_riego_kc` a `data/gf_riego_kc_historico.csv`. Es una precaution: `dim_etapas` ya las tiene, pero el volcado permite recuperarlas sin backup si alguien discover que si se usaban.
- [x] 10.3.3 Migración `0040` con el `drop` de las 5, en una transacción, con `if exists`.
- [x] 10.3.4 Regenerar `types/database.types.ts` y confirmar que las 5 desaparecieron.
- [x] 10.3.5 Correr la suite completa y verificar que nada las menciona.

### El primer intento de la 0040 falló, y por qué vale la pena

`drop table if exists gf_riego_kc` devolvió `"gf_riego_kc" is not a table`. La
tabla **no** era una tabla: la migración 0039 la había convertido en **vista**,
junto con las otras 7 `gf_riego_*`. En Postgres `drop table` no borra una vista,
y `IF EXISTS` no ayuda porque el objeto existe: solo es que no es del tipo que
pedía el comando. La transacción revirtió sola, así que no hubo nada que
restaurar.

La causa de que no se viera antes es que `scripts/checar_tablas_muertas.mjs`
seleccionaba `relkind` pero no lo imprimía. Ahora imprime `tabla` o `vista` en
cada fila, que es el dato que decide qué comando de `drop` va.

Detalle de la vista, que explica la confusión del `CAL`:

```sql
select codigo_etapa as codigo, lo_que_ve as descripcion,
       (nullif(kc_referencial, '—'::text))::numeric as kc
  from dim_etapas t;
```

Ese `nullif` es justo lo que hace que `gf_riego_kc.kc` salga `NULL` para `CAL`
mientras `dim_etapas.kc_referencial` sigue siendo el texto `—`. No son datos
distintos: es la misma ausencia de dato, escrita como numeric y como text.

Las **7** vistas `gf_riego_*` que quedan **no se tocan**: la app las lee
(`lib/riego/actions.ts` consulta `gf_riego_suelos`, `gf_riego_zonas`,
`gf_riego_edad` y `gf_riego_humedad`). Verificado después de aplicar: siguen las 7.

### Verificación de 10.3

| | |
|---|---|
| Las 5 objetos | ya no existen |
| Las 7 vistas que la app usa | siguen las 7 |
| `types/database.types.ts` | regenerado: 52 tablas / 9 vistas → **48 tablas / 8 vistas** |
| `tsc` / `eslint` | 0 / 0 |
| Suite | 24 archivos, **6.804 tests** |
| `build` | correcto |

## 10.4 Claves foráneas que faltan

- [x] 10.4.1 Comprobar si las 4 referencias tienen huérfanos.
- [x] 10.4.2 **No hace falta migración: las 4 FKs ya existen.** Ver abajo.
- [x] 10.4.3 Confirmado que borrar una fila referenciada falla por FK.

### 10.4 quedó viejo: las FKs ya estaban

El plan pide agregar 4 claves foráneas a `fact_riego_mes` y `fact_riego_etapa`.
**Esas cuatro existen, y están validadas.** El punto se escribió antes de la
migración 0037, que creó esas tablas desde cero y las dejó con su integridad.

| Desde | Columna | Hacia | Estado |
|---|---|---|---|
| `fact_riego_mes` | `especie_id` | `dim_especies` | validada |
| `fact_riego_mes` | `mes_n` | `dim_meses` | validada |
| `fact_riego_etapa` | `especie_id` | `dim_especies` | validada |
| `fact_riego_etapa` | `codigo_etapa` | `dim_etapas` | validada |

Hay 3 FKs más que el plan no menciona, en las tablas de fertilización:
`fact_fert_organica.especie_id`, `fact_fert_programa.especie_id` y
`fact_fert_programa.macrozona_id`. **Ninguna tabla de riego o fertilización está
sin ninguna FK.**

Los huérfanos se contaron igual, por si acaso, y dan 0 en las cuatro: 360 filas
en `fact_riego_mes` y 210 en `fact_riego_etapa`, sin nulos y sin referencias
rotas. Los destinos son únicos: 30/30 `dim_especies.especie_id`, 12/12
`dim_meses.mes_n`, 8/8 `dim_etapas.codigo_etapa`.

Los chequeos quedan en `scripts/checar_fks_riego.mjs` y
`scripts/listar_fks_riego.mjs`. El primero dice si se puede agregar una FK y el
segundo lista las que hay de verdad, con nombre y columnas, para no confiar en
un `like` sobre el nombre de la restricción.

**Moraleja sobre el plan:** `PLAN-EJECUCION.md` se escribió antes del
`import-base-maestra`. Varios de sus puntos ya no describen el estado real. Por
eso cada punto se comprueba antes de hacerse, aunque parezca obvio.

## 10.5 Los dos vocabularios de edad

- [ ] 10.5.1 Listar los dos vocabularios completos y sus solapamientos. `gf_arboles.edad_clase` usa `recien`/`joven`/`inicial`/`adulto`; `gf_riego_edad.nombre` usa los rotulos largos («Recién plantado (0-1 año)»...). `dim_edad` existe y tiene 4 filas.
- [ ] 10.5.2 Anotar los `edad_clase` que no mapean a ninguna fila de `dim_edad` antes de cambiar nada.
- [ ] 10.5.3 Migración `0042` con la FK de `gf_arboles.edad_clase` a `dim_edad`. Si el mapeo no es 1:1, agregar una tabla de equivalencia en vez de forzar la FK.

## 10.2 Enums (menos los de pagos)

- [ ] 10.2.1 Verificar los valores reales de cada columna antes del cast, y anotarlos. Los del plan: `event_category` PRODUCT_USAGE/AD_INTERACTION/CMP_CONSENT/COMMERCE_INTENT, `event_name` con 9 valores, `screen` con 4, `payment_status` con 4.
- [ ] 10.2.2 Migración `0043` con los 4 `create type ... as enum` y los `alter column ... type ... using`.
- [ ] 10.2.3 Si algun valor real esta fuera del dominio, **no** ampliar el enum en silencio: reportarlo primero. Un enum es unaDecision de dominio, y ampliarlo para que el cast pase la convierte en decoracion.
- [ ] 10.2.4 `gf_subscription_plans.tier` queda fuera a proposito. Ver la seccion «Lo que no entra» del proposal.

## 10.1 Columnas desnormalizadas en la tabla de mayor volumen

- [ ] 10.1.1 Confirmar que solo `admin_overview_metrics` y `admin_insights_metrics` las leen, y que ninguna vista mas.
- [ ] 10.1.2 Cambiar esos dos RPCs para derivar la region desde `perfiles`/`dim_comunas` con join. **En la misma migracion que el `drop`**, no antes: dejarlos rotos entre migraciones rompe el panel de admin.
- [ ] 10.1.3 Migración `0044` con el `alter table gf_analytics_events drop column` de las 3.
- [ ] 10.1.4 Verificar que los dos RPCs devuelven lo mismo antes y despues, con los mismos numeros.

## Fuera de alcance, anotado

- `gf_subscription_plans.tier` y el enum de `plan`: se hacen con Flow.
- Punto 9.2 de la Fase 9: se hace con Flow.
- Los 4 errores de tipos de pagos que salio al conectar `types/database.types.ts`. Los otros 6 (admin, telemetria, huertos) se pueden cerrar ya, en otro change.

## Estado

10.3 completo: migracion 0040 aplicada y verificada. Siguiente: 10.4.