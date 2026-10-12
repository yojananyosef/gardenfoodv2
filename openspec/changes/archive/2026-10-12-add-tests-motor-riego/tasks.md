# Tasks

## 1. Generador y fixture

- [x] 1.1 Escribir `scripts/generar_base_maestra.py` siguiendo el patrón de `scripts/generar_riego_seed.py` (lectura de XLSX como ZIP+XML, sin `openpyxl`). Debe leer la hoja `API_RESPUESTAS` y emitir `data/riego_api_respuestas.csv` con una fila por combinación y las columnas: `clave`, `especie_id`, `especie_alias`, `zona_riego_id`, `macrozona_id`, `mes_n`, `mes_programa_n`, `reposo`, `litros_media`, `dias_media`, `litros_gruesa`, `dias_gruesa`, `litros_mod_gruesa`, `dias_mod_gruesa`, `litros_fina`, `dias_fina`, `litros_base`, `dias_base`, `factor_clima`. Verificar que el archivo sale con 6.480 filas de datos más la de encabezado.

> El lector XLSX reutilizable quedó en `scripts/xlsx_read.py` (ZIP + XML, sin `openpyxl`), importado por el generador. Emite 6.480 filas de datos.
- [x] 1.2 **Autoverificar el fixture en el generador antes de escribirlo.** Recalcular cada fila desde `FACT_RIEGO_MES` (clave compuesta `especie_id|mes_n`, NO solo `especie_id`, que sobrescribe 11 de 12 meses) + `dim_especies.riego_mantencion_l` + `dim_zonas_riego.factor_clima` y `desfase_meses`, aplicando el desfase `mes_programa = MOD(mes_n - 1 - desfase, 12) + 1` y la regla de reposo. Comparar con los valores cacheados y **fallar ruidosamente** si alguna fila no cuadra, en vez de emitir un fixture dudoso. Usar `Decimal.quantize(ROUND_HALF_UP)`, nunca el `round()` de Python. Verificar que el generador reporta 0 diferencias de 6.480.

> Ejecutado: `filas leidas 6480 / emitidas 6480 / sin fila de riego 0 / diferencias vs recalculo 0`. El generador **no escribe el CSV** si hay diferencias o filas sin resolver, y en ese caso imprime las claves afectadas.

> La clave compuestasaved este change. Indexar `FACT_RIEGO_MES` solo por `especie_id` deja un único mes por especie y produce ~4.300 falsos positivos (67%), porque la comprehension sobreescribe 11 de 12 filas. La señal de que el modelo estaba mal fue que las 1.044 filas de reposo*daban* 0 diferencias: improbable, y motivo suficiente para desconfiar del resultado en lugar de culpar al Excel.
- [x] 1.3 Confirmar en la salida del generador el desglose de filas en reposo (1.044 de 6.480, 19 de 30 especies) y que sus litros coinciden con `riego_mantencion_l`, como comprobación específica de que la regla de reposo está bien leída.

> `filas con reposo = 1: 1044` y `de ellas, litros OK: 1044/1044`.

## 2. Test contra el motor

- [x] 2.1 Crear el snapshot de las tablas `gf_riego_*` que usa la app: `tests/fixtures/riego_base.json` con suelos, zonas, edades, niveles, especies (incluida `mantencion_l`), calendario mensual y etapas. Debe generarse desde producción y coincidir con el mapeo de `lib/riego/actions.ts`, con `especie` en el dbKey que espera `calc.ts:60`. Verificar el conteo esperado.

> `scripts/generar_riego_base_snapshot.py <project_ref>` lo baja por PostgREST con la anon key (las tablas de referencia tienen SELECT público desde la migración 0032). Resultado: mensual 360, especies 30, suelos 4, zonas 11, edades 4, niveles 5, etapas 210 = **624 filas**, que coincide con producción. Nota: el conteo real es 624 y no 623 porque `gf_riego_etapas` suma 210 y `gf_riego_kc` (8 filas) queda fuera por ser write-only.

- [x] 2.2 Escribir `tests/riego-consistencia.test.ts`: carga el fixture y el snapshot una sola vez, y por cada una de las 30 especies ejecuta un bloque con sus combinaciones de mes/zona. Llamar a `calcularRiego` con `suelo: "M"`, `edadN: 4`, `copaM: base.copaRefM`, `humedad: 2` y comparar `litros` y `cadaDias` con el fixture. El mensaje de fallo debe incluir especie, zona, mes, valor esperado y obtenido.

> El test mapea las filas del snapshot a los tipos de `RiegoBasePayload` con la misma lógica de `lib/riego/actions.ts`, y llama a `calcularRiego` de verdad: no reimplementa la fórmula.

- [x] 2.3 Ejecutar el test y **registrar el recuento real de fallos**, separando filas en reposo de filas normales. El número esperado de fallos es el de filas con `reposo = 1` (1.044 de 6.480); si los fallos son de otra forma, el motor tiene un problema distinto del reposo y hay que reportarlo antes de seguir.

> **Resultado: 1.044 fallos / 5.438 pasan de 6.482** (6.480 combinaciones + 2 checks estructurales). Las 5.436 combinaciones sin reposo pasan; las 1.044 con reposo fallan. Es el número exacto esperado: **la única divergencia entre el motor y la calculadora del Excel es el bug de reposo**.
>
> La primera ejecución dio 1.891 fallos, no 1.044. Los 847 extra no eran un defecto del motor sino un **mismatch de codificación**: el fixture traía el alias legible del Excel (`Arándano`, `Palta`, `Níspero`) mientras `gf_riego_mensual` y `calc.ts` esperan el dbKey de la app (`Arandano`, `Palto`, `Níspero Japonés`). Para esas especies el motor no encontraba calendario y devolvía `null`, que el test contaba como fallo. Corregido en el generador con un mapa Excel→dbKey, mismo criterio que `MAPEO_ESPECIE` de `generar_riego_seed.py`; tras el fix el recuento cae al número exacto.
- [x] 2.4 Confirmar que el fallo de una fila en reposo dice que la app devuelve 0 L mientras el fixture espera el volumen de mantenimiento, para que el mensaje apunte al bug y no solo dé números.

> Mensaje real de salida:
> `almendro|N1|NOR|3 reposo: esperado 21 L / 15 dias, obtenido 0 L / 15 dias | mes en REPOSO: la app devuelve 0 L usando el rango del calendario (litros_min=0), y REGLAS_APP Paso 4 pide el volumen de mantenimiento (21 L). Es el bug de reposo.`

- [x] 2.5 Añadir al test un caso explícito y legible de la regla de reposo (por ejemplo nogal en junio, suelo Media, adulta), que documente la diferencia entre lo que la app calcula hoy y lo que la calculadora del Excel da, aunque siga fallando.

> Bloque `describe("regla de reposo (REGLAS_APP Paso 4)")` con nogal en junio, suelo Media, adulta, copa de referencia, punto de riego. Comprueba que el fixture espera el volumen de mantenimiento y que la app devuelve 0. Recuento final: **1.045 fallos / 5.438 pasan** (1.044 combinaciones de reposo + este caso explícito).

## 3. Documentación

- [x] 3.1 Actualizar `PENDING.md`: registrar el fallo del reposo con el número exacto de filas afectadas, que el bug queda medido y con test, y que el fix correspondiente es un change aparte. Dejar constancia de que `API_RESPUESTAS` es materialización del motor y no se importa a la base.

> Dos filas nuevas en `PENDING.md`: «Bug de riego en reposo» (MEDIDO con el alcance de 1.044 de 6.480 y la cita de `REGLAS_APP`) y «API_RESPUESTAS» (materialización, no tabla de dominio, con el comando de regeneración).

- [x] 3.2 Documentar en el encabezado del CSV de qué hoja y columnas proviene cada campo, y con qué comando se regenera, para que un fallo futuro sea rastreable sin leer el generador entero.

> El CSV abre con 5 líneas comentadas: procedencia (hoja `API_RESPUESTAS`), por qué no se importa a Postgres, comando de regeneración, que el generador recalcula y falla si no cuadra, y el comando del test.
- [x] 3.3 Verificar que `pnpm typecheck`, `pnpm lint` y `pnpm build` siguen en verde, y que el test nuevo corre sin red ni acceso a la base.

> `tsc --noEmit` 0 errores, `eslint` 0 errores, `build` OK con las 38 rutas. Suite completa: `Test Files 1 failed | 20 passed`, `Tests 1045 failed | 5738 passed`. Los 300 tests preexistentes siguen en verde; el único archivo rojo es el nuevo, y falla **solo** en las 1.045 aserciones de reposo. El test lee el CSV y el snapshot desde disco y no hace red ni toca la base: se puede correr sin conexión.

## Workflow follow-up

- Este change deja el bug de reposo medido, no arreglado. El fix va en `fix-reposo-riego`, que parte de este test: al aplicar la corrección, las 1.044 filas deben pasar sin tocar las otras 5.436.
- Archivar cuando el recuento de fallos esté documentado y `PENDING.md` apunte al change siguiente.