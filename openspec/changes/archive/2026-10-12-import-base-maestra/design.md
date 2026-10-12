# Design

## Context

La app tiene sus datos agronómicos en tres lugares distintos y ninguno se puede regenerar:

| Dónde | Qué | Tamaño |
|---|---|---|
| Postgres `gf_riego_*` | riego: 8 tablas | 632 filas |
| TypeScript `lib/agronomy/*` | comunas, zonas, especies | 1.191 líneas |
| TypeScript `lib/agronomy/fichas.ts` | texto de ficha de 30 especies | 10.360 líneas |
| Excel maestro v3 | todo el dominio | 47 hojas, ~4.900 filas de datos |

Este change mueve el Excel a Postgres y resuelve la duplicación de las 8 tablas de Postgres.

## Goals / Non-Goals

**Goals**

- Las 34 tablas del dominio en Postgres, con PK y FK reales.
- `data/*.csv` versionados como fuente canónica, con la migración SQL generada desde ellos.
- Que la fórmula de riego siga funcionando sin tocar una línea de la app.
- Que los defectos del Excel se reporten, no se corrigan a mano.

**Non-Goals**

- Apuntar los loaders de la app a las tablas nuevas (pasos A4/A5 del plan).
- El crosswalk de alias y el backfill (Fase 7, change aparte).
- Partir `lib/agronomy/fichas.ts`.
- Rellenar las cuatro tablas `gf_fertilizacion_*`, que siguen vacías.

## Decisions

### D1 · Los tipos se infieren por valor, no por nombre

El nombre de la columna miente. Ejemplos reales del v3:

| Columna | Nombre sugiere | Valor real |
|---|---|---|
| `dim_especies.ph_ideal` | número | `6.0 a 7.0 (ligeramente ácido a neutro)` |
| `dim_especies.marco_plantacion` | número | `4.5 × 4.5` |
| `especies_bc.horas_frio` | número | `400-800` |
| `especies_bc.tiempo_hasta_produccion` | número | `2-3 años` |
| `dim_etapas.kc_referencial` | número | `-` (celda suelta) |
| `dim_especies.tiene_ficha_bd20` | texto | `Sí` |

Una regla por nombre convertiría esos rangos en `NULL` o en error. **Elegido:** recorrer todos los valores no vacíos de la columna; si todos son enteros → `smallint`/`integer`; si todos son números → `numeric`; si todos están en el conjunto booleano del Excel (`0`/`1`, `Sí`/`No`, `si`/`no`, `Verdadero`/`Falso`) → `boolean`; en cualquier otro caso → `text`.

**Consecuencia:** una columna con un solo valor raro se vuelve `text` y conserva todo. `CAT_FERT_TECNICO.solubilidad_g_l` tiene dos celdas con `Muy alta` entre 29 filas: sale `text` y el dato sobrevive. Perder un dato por una celda suelta sería peor que una columna menos tipada.

**El riesgo de esto es que una columna numérica con muchos valores nulos se vuelva `text`.** Se mitiga con un reporte: el generador imprime el tipo inferido de las ~470 columnas y avisa de las que quedaron en `text` con ≥ 80% de valores no numéricos. Esa revisión es parte de las tareas, no un efecto secundario.

### D2 · Los CSV son la fuente canónica, no el Excel

El plan dice que `data/*.csv` es lo que hace la base regenerable. Se sigue al pie de la letra y se reforça: **la migración SQL se genera desde los CSV, no desde el Excel.** Así el Excel es un insumo de una vez y el repo se reconstruye sin él.

```
GARDENFOOD_Base_Maestra_Frutales_v3.xlsx
        |  scripts/generar_base_maestra.py --import
        v
data/*.csv           34 archivos, commiteados, fuente canónica
        |  genera
        v
supabase/migrations/00NN_base_maestra.sql
        |  MCP apply_migration
        v
Postgres
```

### D3 · `gf_riego_*` se reemplaza por vistas, dentro de la misma migración

El orden dentro de la migración es fijo y no negociable:

1. Crear las 34 tablas.
2. Insertar los datos.
3. Verificar por comparación que cada tabla nueva coincide fila por fila con su `gf_riego_*` equivalente. Esto va en SQL y **aborta la migración** si no cuadra.
4. `drop table` de las 8, `create view` con los mismos nombres y columnas.

Todo en una sola migración: la tabla nunca está ausente en ningún momento observable. Una migración de swap aparte agregaría una ventana en la que la app no encuentra la tabla.

**El mapeo de las vistas no es un `select *`.** Los nombres de columna difieren:

| Vista | Origen | Nota |
|---|---|---|
| `gf_riego_mensual.especie` | `dim_especies.alias_riego` | el calendario guarda el slug, la app busca el alias |
| `gf_riego_suelos.tecnico` | `dim_suelos.nombres_usda` | |
| `gf_riego_suelos.agua_min_mm` | `dim_suelos.agua_min_mm_m` | |
| `gf_riego_etapas.codigo` | `dim_etapas.codigo_etapa` | |
| `gf_riego_kc.codigo` | `dim_etapas.codigo_etapa` | |
| `gf_riego_kc.descripcion` | `dim_etapas.lo_que_ve` | |

Cada vista se escribe a mano con el mapeo explícito. Un `select *` renombraría columnas y rompería `lib/riego/actions.ts` en tiempo de ejecución, que es un `.select("*")` seguido de acceso por propiedad.

### D4 · `security_invoker` en las vistas, y verificarlo

Una vista en Postgres se ejecuta con los privilegios de quien la definió (el dueño), **no** de quien consulta, salvo que se marque `security_invoker`. Eso significa que las políticas RLS de las tablas base **no se aplican** a través de la vista.

Como estas tablas son públicas por diseño y la vista reemplaza a tablas que ya eran públicas, la exposición real no cambia. Pero es una diferencia de comportamiento que no se puede dar por supuesta: **tarea explícita de verificar** que un cliente anónimo lee la vista igual que leía la tabla, y que sigue sin poder escribir.

### D5 · Las PKs y FKs se declaran explícitas, no se descubren

El Excel no declara claves. El generador lleva una tabla explícita de PK por tabla y una regla de FK: toda columna `*_id` cuyo nombre coincide con la PK de alguna tabla de dimensión es clave foránea. Con eso se Detectan los casos raro (`dim_comunas.zona_agro_propuesta_id`, que apunta a `dim_zonas_agro`) y **no** se inventan FKs donde el nombre es unlucky pero la relación es real (por ejemplo `dim_especies.suelo_preferido`, que es texto descriptivo y no apunta a `dim_suelos`).

La verificación de huérfanos es la que delata cualquier error aquí, y aborta antes de escribir.

### D6 · `API_RESPUESTAS` no se importa

Sigue siendo la salida de la calculadora del Excel, no una tabla de dominio. Va a `tests/fixtures/`, que es donde ya está, y el generador la sigue tratando aparte. Importarla sería Frozen un materializado del motor dentro de la base, que es lo contrario de tener una fuente única.

## Risks / Trade-offs

**[R1] · El swap de `gf_riego_*` es el momento más delicado.** → Las tres mitigaciones: verificar fila por fila antes del swap, hacerlo dentro de la migración (nunca hay una ventana sin tabla), y tener los 6.780 tests como red. Si un test falla, la migración ya se aplicó, pero el rollback es un `drop view` + restaurar, y los datos están intactos en las tablas nuevas.

**[R2] · Un tipo inferido equivocado rompe un cálculo.** → La red son los 6.780 tests de riego, que son los únicos que importan numéricamente. Las tablas de texto no tienen red, así que ahí la revisión manual del reporte de tipos es la defensa.

**[R3] · `data/*.csv` engorda el repositorio.** → Son ~4.900 filas. Aproximadamente 700 KB. Es el precio de que la base sea reconstruible, y es lo que el plan pide.

**[R4] · Quedan catálogos hardcodeados en `lib/agronomy/*`.** → Que las tablas existan no las convierte en la fuente. Eso es A4/A5 y es trabajo de fases siguientes, con su propia verificación.

**[R5] · El generador es un script largo en un solo archivo.** → Ya existe (`generar_base_maestra.py`, que genera el fixture). Se le agrega un segundo modo en vez de crear un script paralelo, para que la lógica de mapeo del Excel vivan en un solo lugar, como pide el plan.

## Migration Plan

Una sola migración, aplicada con MCP `apply_migration`:

1. Crear las 34 tablas con PK, FK, índices y RLS de solo lectura.
2. Insertar los 4.874 datos.
3. Verificar: conteos contra `DICCIONARIO`, PKs sin duplicados, FKs sin huérfanos, y coincidencia fila por fila contra las 8 `gf_riego_*`.
4. Reemplazar las 8 tablas por vistas.

Verificación posterior:

- Los 6.780 tests en verde sin haberlos tocado.
- Consulta real por API con sesión de administrador, comparando la respuesta antes y después.
- `anon` lee, `anon` no escribe.