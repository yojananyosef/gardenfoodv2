# Tasks

## 1. El generador lee el Excel y se autoverifica

- [ ] 1.1 Declarar en `scripts/generar_base_maestra.py` el mapa de 34 hojas → tablas, con sus claves primarias explícitas. Las 29 del plan más `FACT_CLIMA_ZONA`, `DIM_EDAD_NUTRICION`, `FACT_TAREAS_MES`, `ESPECIES_FICHA_BD20` y `ESPECIES_BC`.
- [ ] 1.2 Implementar la inferencia de tipos **por valor** (D1): recorrer los valores no vacíos de cada columna y decidir `smallint` / `integer` / `numeric` / `boolean` / `text`. El conjunto booleano del Excel es `0`/`1`, `Sí`/`No`, `si`/`no`, `Verdadero`/`Falso`. Los vacíos no cuentan como evidencia.
- [ ] 1.3 Añadir el modo `--import`, separado del modo fixture que ya existe. Debe escribir `data/<tabla>.csv` para las 34 tablas, en orden determinista, con cabecera de comentarios que diga de qué hoja salió.
- [ ] 1.4 Imprimir el tipo inferido de **todas** las columnas a un archivo de reporte, y señalar las que quedaron en `text` con ≥ 80% de valores no numéricos. Revisar ese reporte a mano antes de generar la migración: es la única defensa para las columnas de texto, que los tests no cubren.
- [ ] 1.5 Verificaciones que abortan antes de escribir si algo no cuadra: PKs sin duplicados, conteos contra la hoja `DICCIONARIO` del Excel, FKs sin huérfanos.
- [ ] 1.6 Correr el generador dos veces sobre el mismo Excel y comprobar que los CSV son idénticos byte a byte (determinismo).

## 2. La migración SQL

- [ ] 2.1 Generar `supabase/migrations/0037_base_maestra.sql` desde los CSV: `create table` con PK y FK, índices sobre las FKs, y RLS de solo lectura (`for select to anon, authenticated using (true)`, sin políticas de escritura).
- [ ] 2.2 Los `insert` deben venir de los CSV versionados, no del Excel, y en orden determinista.
- [ ] 2.3 Escribir a mano las 8 vistas del swap (D3) con el mapeo explícito de columnas, incluida la que traduce el slug de `fact_riego_mes` al `alias_riego` de `dim_especies`.
- [ ] 2.4 Meter en la misma migración la verificación previa al swap: comparar fila por fila las 8 tablas nuevas contra las 8 `gf_riego_*` y abortar si difieren.
- [ ] 2.5 Marcar las vistas con `security_invoker` (D4).

## 3. Aplicar y verificar

- [ ] 3.1 Aplicar con MCP `apply_migration` contra `ayhpmsocohrorabvrmow`. Nunca `supabase db push`.
- [ ] 3.2 Confirmar los 34 conteos contra el Excel y que las 8 vistas devuelven exactamente lo mismo que las tablas que reemplazaron.
- [ ] 3.3 Verificar el RLS de verdad, forzando el rol: un cliente anónimo lee las vistas, y no puede escribir en las tablas.
- [ ] 3.4 Correr la suite completa sin haber modificado ningún test. Los 6.780 tienen que pasar tal cual: si un test falla, una vista devuelve algo distinto de lo que devolvía su tabla.
- [ ] 3.5 Consultar por API con sesión de administrador real y comparar la respuesta de la base de riego antes y después del swap.

## 4. Documentar

- [ ] 4.1 Actualizar `PENDING.md`: qué se importó, qué sigue hardcodeado (`lib/agronomy/*`, `fichas.ts`) y qué queda para A4/A5.
- [ ] 4.2 Registrar las columnas que quedaron en `text` por contener valores mixtos, en especial `CAT_FERT_TECNICO.solubilidad_g_l` y `DIM_ETAPAS.kc_referencial`. **Reportadas, no corregidas a mano** (ver `PENDING.md`, regla del proyecto).
- [ ] 4.3 Dejar en el repo el comando exacto para regenerar los CSV y la migración, y qué archivo de Excel espera.

## Workflow follow-up

- Archivar cuando los 34 conteos cuadren, la suite esté verde sin tocar tests, y el RLS esté verificado por rol forzado.
- **Fase 7 va en change aparte**: el crosswalk `dim_especies_alias` y el backfill de `especie_ref` tocan tablas de usuario (`gf_arboles`, `gf_analytics_events`) y merecen su propia verificación.
- **A4/A5 quedan para fases siguientes**: que las tablas existan no hace que `lib/agronomy/*` deje de estar hardcodeado. Apuntar los loaders es otro change, y es donde se aprovechan estas tablas para eliminar los 1.500+ de líneas duplicadas.
- Las 3 celdas sueltas del Excel (`DIM_ETAPAS.kc_referential`, `CAT_FERT_TECNICO.solubilidad_g_l`) siguen siendo defecto del Excel. Se importan tal cual y se reportan.