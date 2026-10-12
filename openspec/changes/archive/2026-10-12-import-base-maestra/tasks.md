# Tasks

## 1. El generador lee el Excel y se autoverifica

- [x] 1.1 Declarar en `scripts/generar_base_maestra.py` el mapa de 34 hojas → tablas, con sus claves primarias explícitas. Las 29 del plan más `FACT_CLIMA_ZONA`, `DIM_EDAD_NUTRICION`, `FACT_TAREAS_MES`, `ESPECIES_FICHA_BD20` y `ESPECIES_BC`.
- [x] 1.2 Implementar la inferencia de tipos **por valor** (D1): recorrer los valores no vacíos de cada columna y decidir `smallint` / `integer` / `numeric` / `boolean` / `text`. El conjunto booleano del Excel es `0`/`1`, `Sí`/`No`, `si`/`no`, `Verdadero`/`Falso`. Los vacíos no cuentan como evidencia.
- [x] 1.3 Añadir el modo `--import`, separado del modo fixture que ya existe. Debe escribir `data/<tabla>.csv` para las 34 tablas, en orden determinista, con cabecera de comentarios que diga de qué hoja salió.
- [x] 1.4 Imprimir el tipo inferido de **todas** las columnas a un archivo de reporte, y señalar las que quedaron en `text` con ≥ 80% de valores no numéricos. Revisar ese reporte a mano antes de generar la migración: es la única defensa para las columnas de texto, que los tests no cubren.
- [x] 1.5 Verificaciones que abortan antes de escribir si algo no cuadra: PKs sin duplicados, conteos contra la hoja `DICCIONARIO` del Excel, FKs sin huérfanos.
- [x] 1.6 Correr el generador dos veces sobre el mismo Excel y comprobar que los CSV son idénticos byte a byte (determinismo).

## 2. La migración SQL

- [x] 2.1 Generar las migraciones desde los CSV: `create table` con PK y FK, índices sobre las FKs, y RLS de solo lectura (`for select to anon, authenticated using (true)`, sin políticas de escritura).
- [x] 2.2 Los `insert` deben venir de los CSV versionados, no del Excel, y en orden determinista.
- [x] 2.3 Escribir a mano las 8 vistas del swap (D3) con el mapeo explícito de columnas, incluida la que traduce el slug de `fact_riego_mes` al `alias_riego` de `dim_especies`.
- [x] 2.4 Meter en la misma migración la verificación previa al swap: comparar fila por fila las 8 tablas nuevas contra las 8 `gf_riego_*` y abortar si difieren.
- [x] 2.5 Marcar las vistas con `security_invoker` (D4).
- [x] 2.6 Cerrar el canal de aplicación: la migración de datos son 996 KB y no entra por el MCP `apply_migration`. Se usa `scripts/aplicar_migraciones.mjs`, que abre una transacción por migración y registra la fila en `supabase_migrations.schema_migrations` con versión timestamp, igual que la herramienta. **Nunca `supabase db push`**: el remoto versiona con timestamp y el repo con `NNNN_`, así que push reintentaría las 36 migraciones ya aplicadas. El script empareja por nombre, no por versión.

## 3. Aplicar y verificar

- [x] 3.1 Aplicar las tres migraciones (`0037` esquema, `0038` datos, `0039` swap).
- [x] 3.2 Confirmar los 34 conteos contra el Excel y que las 8 vistas devuelven exactamente lo mismo que las tablas que reemplazaron.
- [x] 3.3 Verificar el RLS de verdad, forzando el rol: un cliente anónimo lee las vistas, y no puede escribir en las tablas.
- [x] 3.4 Correr la suite completa sin haber modificado ningún test. Los 6.780 tienen que pasar tal cual: si un test falla, una vista devuelve algo distinto de lo que devolvía su tabla.
- [x] 3.5 Consultar por API con sesión de administrador real y comparar la respuesta de la base de riego antes y después del swap.

## 4. Documentar

- [x] 4.1 Actualizar `PENDING.md`: qué se importó, qué sigue hardcodeado (`lib/agronomy/*`, `fichas.ts`) y qué queda para A4/A5.
- [x] 4.2 Registrar las columnas que quedaron en `text` por contener valores mixtos, en especial `CAT_FERT_TECNICO.solubilidad_g_l` y `DIM_ETAPAS.kc_referencial`. **Reportadas, no corregidas a mano** (ver `PENDING.md`, regla del proyecto).
- [x] 4.3 Dejar en el repo el comando exacto para regenerar los CSV y la migración, y qué archivo de Excel espera.


## Resultado de aplicar

**34/34 conteos cuadran, 4.874 filas exactas.**

**RLS verificado forzando el rol.** El MCP corre como postgres con ypassrls, asi que sin set local role anon dentro del mismo DO todo pasaria y el test diria "ok" sin probar nada:

``
anon LEE gf_riego_mensual: 360 filas
anon LEE dim_comunas: 346 filas
anon LEE fact_fert_programa: 786 filas
anon LEE y FILTRA la vista: Nogal -> 1
anon LEE filtrado: Nogal mes 6 -> 1 fila(s), reposo=1     <-- el fix del reposo intacto
ok: anon NO escribe en dim_suelos -> violates row-level security policy
ok: anon NO escribe en la vista  -> violates row-level security policy
``

Que la escritura contra la **vista** tambien falle confirma que security_invoker hace su trabajo: sin el, la vista se ejecutaria con los permisos del dueno y saltaria el RLS.

**Snapshot por PostgREST con la anon key** (la misma via que usa lib/riego/actions.ts): **624/624 filas identicas** a las que devolvian las tablas viejas, comparadas como conjunto. Difieren solo en el orden, porque el JOIN de la vista no conserva el orden fisico; el app hace .order("mes") explicito y no le afecta. El fixture se ordena en el script, no con ORDER BY en la vista: el orden lo decide quien consulta.

**En la UI**, preview con sesion real, los 12 meses de nogal dan exactamente los mismos valores que antes del swap, con los tres de reposo en 35 L y no en 0 L: enero 144 L/7 d, marzo 92 L/10 d, mayo 57 L/17 d, **junio, julio y agosto 35 L/23 d**, noviembre 115 L/10 d. /huerto carga con sesion real (3 avisos, 28 arboles, 4 huertos) y /admin sin error.

**6.787/6.787 tests en verde**, sin haber modificado ninguno.

## Lo que la verificacion encontro

Las cuatro diferencias que la verificacion previa al swap detecto. Ninguna habria dado error visible: la app habria mostrado numeros distintos o se habria roto en silencio.

| # | Diferencia | Que habria pasado |
|---|---|---|
| 1 | gf_riego_mensual.reposo es integer (0/1) y act_riego_mes.reposo es oolean | calc.ts compara eposo === 1. Con 	rue la comparacion es falsa y **el arreglo del reposo se rompia sin dar error** |
| 2 | gf_riego_especies.especie guarda el dbKey (Arandano, Avellano Europeo), no el nombre humano de dim_especies (con tilde, y sin el "Europeo") | Lo mapee a la columna equivocada; 8 filas no cuadraban |
| 3 | coincide_exacta es oolean de dos estados, pero el Excel tiene tres: Si (189), Aproximada (21) y No | Postgres no podia ni comparar: EXCEPT types boolean and text cannot be matched. La tabla vieja conflacionaba Aproximada con No; la nueva conserva la distincion y la vista reproduce el viejo |
| 4 | gf_riego_kc.kc es 
umeric con NULL para CAL y el Excel usa el guion largo como centinela de "sin dato" | 
ullif devuelve esa misma NULL sin tirar el centinela |

## Errores propios durante la aplicacion

Todos los atrapo Postgres o la propia autoverificacion del generador:

| Error | Como se detecto |
|---|---|
| primary key en cada columna de una PK compuesta | multiple primary keys are not allowed. Va como constraint de tabla |
| Celda vacia del Excel como '' en columna numerica | invalid input syntax for type integer: "". Vacio es NULL |
| Celda vacia como '' en columna FK | violo dim_comunas_zona_riego_id_fkey. Un vacio no es una referencia |
| dim_comunas insertada antes que dim_zonas_riego | violo la misma FK. Agrupar por prefijo no respeta dependencias; ahora el orden es topologico |
| DIMENSIONES_PK usado al reves (es tabla->columna, se leia columna->tabla) | KeyError: 'especie_id' |
| Espacio en " estacion" dentro de una PK | 2.975 falsos duplicados, reportados por la autoverificacion |
| erificar_pk comparaba cada columna por separado | Una parte de una PK compuesta se repite legitimo; hay que comparar la tupla |
| El pooler de sesion (5432) no responde desde esta maquina | Cambiado al de transaccion (6543) |
| El script proponia aplicar 13 migraciones, 10 ya aplicadas | Diez migraciones viejas estan en el remoto renombradas y sin prefijo numerico. El script ya no deduce que falta |
## Workflow follow-up

- Archivar cuando los 34 conteos cuadren, la suite esté verde sin tocar tests, y el RLS esté verificado por rol forzado.
- **Fase 7 va en change aparte**: el crosswalk `dim_especies_alias` y el backfill de `especie_ref` tocan tablas de usuario (`gf_arboles`, `gf_analytics_events`) y merecen su propia verificación.
- **A4/A5 quedan para fases siguientes**: que las tablas existan no hace que `lib/agronomy/*` deje de estar hardcodeado. Apuntar los loaders es otro change, y es donde se aprovechan estas tablas para eliminar los 1.500+ de líneas duplicadas.
- Las 3 celdas sueltas del Excel (`DIM_ETAPAS.kc_referential`, `CAT_FERT_TECNICO.solubilidad_g_l`) siguen siendo defecto del Excel. Se importan tal cual y se reportan.