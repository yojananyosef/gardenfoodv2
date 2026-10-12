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

- [x] 10.5.1 Listar los dos vocabularios completos y sus solapamientos. **Eran tres, no dos** — ver abajo.
- [x] 10.5.2 Anotar los valores sin mapear antes de cambiar nada: **no hay datos**. Los 150 árboles tienen la columna en NULL.
- [x] 10.5.3 Migración `0041`: `gf_arboles.edad_n` + FK a `dim_edad`, y se tira `edad_clase`.

### Eran tres vocabularios, y el tercero no estaba en ninguna tabla

| Dónde | Valores |
|---|---|
| `dim_edad.edad_n` | `1`–`4` — canónico, del Excel |
| `dim_edad.edad` | `"Recién plantado (0-1 año)"`… — el rótulo largo |
| `gf_arboles.edad_clase` | `"recien"`, `"joven"`, `"inicial"`, `"adulto"` |

Y un cuarto, invisible para la base: **dos mapas escritos a mano** en
`components/huerto/EditarArbolDialog.tsx` que traducían en ambos sentidos entre
el número y el código. Ese era el único que nadie podía ver mirando el esquema.

Lo que fijó el diseño: **el selector del diálogo ya usaba 1..4**, porque leía
`gf_riego_edad`. Solo el almacenamiento pasaba por los códigos, y ahí estaban los
mapas. Guardar `edad_n` los deja de necesitar.

`EdadArbol` quedó como `number`, no como `1 | 2 | 3 | 4`. La columna es integer
y PostgREST devuelve `number`, así que el union obligaba a castear en cada
lectura para no mentir. El rango lo garantizan el `z.number().int().min(1).max(4)`
del action y la FK, que están validadas.

## Me equivoqué de orden y tumbé /huerto

**Esto es lo importante de la 10.5, y no la migración.**

La `0041` hizo tres cosas en una transacción: agregar `edad_n`, rellenarla y
**tirar `edad_clase`**. Tirarla ahí fue el error. Producción corría el código
viejo, que hace:

```
lib/huerto/data.ts:99   select "... created_at, edad_clase, copa_m, ..."
```

Con la columna ausente, PostgREST devolvió error, `getArboles` volvió vacío y
**`/huerto` pasó de 28 árboles a 0**. Ninguna de las páginas tiró error 500: la
app respondió bien con una lista vacía, que es peor.

La `0042` devolvió la columna y `/huerto` volvió a 28 en minutos. Después:
desplegar el código nuevo (`mro5jpz33`), verificar con 28 árboles, y recién
entonces la `0043` borra la columna de verdad.

**La regla que sale de esto:** un cambio de esquema que rompe código en
producción **no se parte en dos migraciones**. O se despliega el código antes de
migrar, o el cambio va junto. La tarea 10.1 lo decía explícito para los RPC de
admin ("en la misma migración, no antes") y yo escribí esa tarea, y después no lo
apliqué a mi propio caso.

El orden correcto para cualquier `drop column` es:

1. Agregar lo nuevo, sin quitar lo viejo.
2. Cambiar el código para leer lo nuevo.
3. Desplegar y verificar en producción.
4. Recién entonces, quitar lo viejo.

### Verificación de 10.5

| | |
|---|---|
| `gf_arboles` | `edad_n (integer)` + `gf_arboles_edad_n_fkey` validada |
| `edad_clase` | ya no existe |
| Árboles | 150, todos en `NULL` como estaban |
| Producción | `/huerto` 28 árboles, `/perfil`, `/calendario` y `/cosechas` sin falla |
| `tsc` / `eslint` / tests / build | 0 / 0 / 6.804 / correcto |

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