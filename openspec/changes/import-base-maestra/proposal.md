# Proposal

## Why

El Excel maestro v3 es la fuente de verdad del dominio agronómico y hoy casi nada de él está en Postgres. La app lee de catálogos **escritos a mano en TypeScript** que duplican lo que el Excel ya tiene, y hay dos defectos de fondo:

**1. Ocho de las tablas que este change importa ya existen en producción con los mismos datos.**

El plan (`PLAN-EJECUCION` 6.1) dice "importar sin romper, las tablas viejas `gf_riego_*` se dejan intactas". Ese enfoque, aplicado hoy, crearía **dos fuentes de verdad para los mismos datos**:

| Excel v3 | Ya existe como | Filas en ambos |
|---|---|---|
| `DIM_ESPECIES` | `gf_riego_especies` | 30 / 30 |
| `DIM_SUELOS` | `gf_riego_suelos` | 4 / 4 |
| `DIM_HUMEDAD` | `gf_riego_humedad` | 5 / 5 |
| `DIM_EDAD` | `gf_riego_edad` | 4 / 4 |
| `DIM_ETAPAS` | `gf_riego_kc` | 8 / 8 |
| `DIM_ZONAS_RIEGO` | `gf_riego_zonas` | 11 / 11 |
| `FACT_RIEGO_MES` | `gf_riego_mensual` | 360 / 360 |
| `FACT_RIEGO_ETAPA` | `gf_riego_etapas` | 210 / 210 |

Es exactamente el defecto que el plan entero existe para eliminar: el dato de dominio debe vivir en un solo lugar. Si una se actualiza y la otra no, nada lo avisa.

Verifiqué que el cruce es exacto: los 30 `alias_riego` del Excel coinciden uno a uno con los 30 `especie` de `gf_riego_especies`, y los 4 suelos coinciden valor por valor (incluido el `tecnico`/`nombres_usda` de la fila `F`, que fue el punto que había quedado abierto en `PENDING.md`).

**2. El Excel v3 tiene cinco hojas agronómicas que el plan no conocía.**

El plan se escribió sobre una versión anterior del archivo. Además de las 29 tablas previstas, el v3 trae:

| Hoja | Filas | Qué habilita |
|---|---|---|
| `ESPECIES_BC` | 30 | El texto de ficha que hoy vive hardcodeado en `lib/agronomy/fichas.ts` (10.360 líneas) |
| `ESPECIES_FICHA_BD20` | 30 | Idem, segunda fuente de ficha |
| `FACT_TAREAS_MES` | 240 | Las tareas mensuales por especie |
| `FACT_CLIMA_ZONA` | 20 | El clima por zona agroclimática, que hoy está en `lib/agronomy/zonas.ts` |
| `DIM_EDAD_NUTRICION` | 3 | Los tramos de edad para nutrición |

Quedan fuera `VENTA_CRUZADA`, `CURSOS` y `VARIABLES_IA`: son ventas y documentación de IA, no dominio agronómico.

**Resultado: 34 tablas, 4.874 filas.**

## What Changes

- **34 tablas nuevas** creadas desde el Excel v3 y pobladas: 14 `dim_*`, 2 `cat_*` y 18 `fact_*`.
- **`data/*.csv` como fuente canónica versionada**, una por tabla, generadas desde el Excel. Eso es lo que hace la base **regenerable**: si el proyecto Postgres se desempaqueta, se reconstruye desde los CSV sin el Excel.
- **Una migración SQL** generada desde esos CSV y aplicada vía MCP `apply_migration`.
- **`gf_riego_*` pasa a ser vista**, no tabla física. Los datos viven una sola vez, en `dim_*`/`fact_*`. La app **no cambia una línea**: sigue consultando los mismos nombres por PostgREST, que resuelve vistas igual que tablas.
- **El generador se autoverifica** antes de escribir nada: tipos inferidos por valor, PKs sin duplicados, FKs sin huérfanos, conteos contra `DICCIONARIO`.

### Lo que NO cambia

- **`gf_riego_*` sigue siendo la interfaz de la app.** Cambia de tabla a vista. El resto del cambio de readers es trabajo de las fases siguientes.
- **No se corrigen a mano los defectos del Excel.** Si una columna trae texto donde debería traer número, el generador la deja como texto y lo reporta.
- **No se toca la Fase 7** (crosswalk de alias y backfill de `especie_ref`), que va en su propio change.

## Capabilities

### New Capabilities

- `garden/base-maestra`: la base de datos guarda el dominio agronómico completo del Excel maestro, con una fuente canónica versionada en el repositorio y la posibilidad de reconstruir la base desde ella.

### Modified Capabilities

- `garden/agronomy-data`: los datos agronómicos de referencia dejan de estar duplicados entre `gf_riego_*` y las tablas del dominio. Hoy conviven dos copias de las mismas ocho tablas, lo que contradice la regla del proyecto de que el dato de dominio vive en un solo lugar.

## Impact

- **Migraciones**: una, con las 34 tablas, sus índices, sus políticas RLS de solo lectura, los datos, y el swap de `gf_riego_*` a vistas. Se aplica con MCP `apply_migration` contra `ayhpmsocohrorabvrmow`.
- **Tests**: los 6.780 existentes pasan **sin modificarlos**. Esa es la prueba fuerte: si una vista devuelve un valor distinto al de la tabla que reemplaza, el motor de riego y `riego-consistencia` lo detectan.
- **RLS**: las 34 tablas quedan con lectura pública y sin escritura, igual que las `gf_riego_*`. Ninguna FK depende hoy de esas ocho tablas, así que el swap no rompe cascadas.
- **Riesgo principal**: el instante del swap, donde se borran ocho tablas que la app lee. Se mitiga con tres pasos: importar, verificar fila por fila que cada tabla coincide con su equivalente `gf_riego_*`, y recién entonces crear las vistas. Todo en la misma migración, de modo que la tabla nunca queda sin existir en ningún momento observable.

  **Una salvedad que hay que verificar en el momento**: las políticas RLS se aplican a las tablas, no a las vistas. Una vista sin `security_invoker` se ejecuta con los permisos de quien la定义了 y **saltaría el RLS**. Como el contenido es público de todas formas no cambia la exposición, pero es una diferencia real de comportamiento y hay que comprobarla, no suponerla.
- **Lo que sigue fuera**: `lib/agronomy/{comunas,zonas,especies}.ts` y `lib/agronomy/fichas.ts` siguen teniendo los catálogos hardcodeados. Que existan las tablas no basta para que dejen de estar duplicados: eso es el paso A4/A5 del plan, y es trabajo de fases siguientes.
- **Trae tablas vacías que la app ya tiene preparadas**: `gf_fertilizacion_*` tiene cuatro tablas con 0 filas. Este change no las toca.