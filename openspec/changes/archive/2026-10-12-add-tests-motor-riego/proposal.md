# Proposal

## Why

`lib/riego/calc.ts` es el motor puro que decide cuántos litros riega cada árbol, y **no tiene una sola prueba que lo ate a la fuente de verdad**. Eso dejó pasar dos defectos durante meses:

- El **bug de reposo**: en 1.044 de 6.480 combinaciones (19 de 30 especies) la app devuelve 0 L donde la calculadora del Excel da el volumen de mantenimiento. Como los meses de reposo traen `dias = 20`, la UI muestra «0 L cada 20 días», que aparenta ser una decisión agronómica y no un error.
- La **divergencia con `FichaEspecieView`**: el componente cliente reimplementa la fórmula en vez de llamar al motor, y no aplica humedad. Con suelo seco da 16 L menos. Como con clima templado ambos coinciden, nadie lo notó.

Ambos se habrían detectado con una suite que compare el motor contra los resultados ya calculados por el Excel. Sin ella, cualquier cambio futuro del motor es a ciegas: no hay forma de demostrar que una corrección no rompió las otras 5.436 combinaciones.

Este change es la red de seguridad. **No arregla el reposo**: solo lo deja visible y medible, para que el fix venga después con pruebas que lo demuestren.

## What Changes

- **Se extrae `API_RESPUESTAS` del Excel a un fixture commiteado** (`tests/fixtures/riego_api_respuestas.csv`) con las 6.480 combinaciones: 30 especies × 11 zonas de riego × 6 macrozonas × 12 meses, con cobertura parcial. Incluye las columnas de la clave, la fila fuente resuelta y los valores esperados de litros y días.
- **Se verifica el fixture antes de confiar en él**, recalculando sus 6.480 filas desde `FACT_RIEGO_MES` + `dim_especies` + `dim_zonas_riego` con la fórmula de `REGLAS_APP` y comparando. Si el Excel tuviera filas stale, se detectaría aquí en vez de producir 540 falsos positivos después.
- **Se agrega `tests/riego-consistencia.test.ts`** que corre `calcularRiego` sobre cada fila del fixture y compara litros y días, agrupado por especie para que un fallo diga qué especie y qué mes se rompió.
- **Se documenta el fixture como materialización, no como tabla.** `API_RESPUESTAS` no se importa a Postgres: es la salida del motor, no una fuente. El test compara contra el motor, así que un cambio en el Excel que no se propague a las tablas fuente debe romper el test.

Sin cambios en el runtime: `calc.ts` no se toca, ni ningún archivo de `lib/`, `app/` o `components/`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/agronomy-data`: se añade el requisito de que el motor de riego tenga una suite que lo ate a los resultados de la calculadora de referencia del Excel maestro, de modo que el cálculo de litros y días sea verificable de forma exhaustiva y automatizada. Hoy la spec declara el dato agroclimático como fuente, pero no exige nada que impida que el motor se desvíe de ella sin que nadie lo note.

## Impact

- **Datos nuevos**: `tests/fixtures/riego_api_respuestas.csv`, derivado de `GARDENFOOD_Base_Maestra_Frutales_v3.xlsx` por un script versionado. Es el único artefacto binario-derived del change y se regenera con `scripts/generar_base_maestra.py`, siguiendo el patrón de `scripts/generar_riego_seed.py`.
- **Tests**: `tests/riego-consistencia.test.ts` (nuevo). Sin red y sin DB: la base de riego se carga una vez desde las mismas tablas que usa la app.
- **Runtime**: ninguno. `lib/riego/calc.ts` no se modifica.
- **Riesgo**: bajo y de solo lectura. El riesgo real de este change es el contrario al habitual: que los tests **no** detecten una regresión porque el fixture esté mal. Por eso el fixture se autoverifica contra las tablas fuente antes de usarse.
- **El detalle del redondeo**: Excel y JavaScript redondean half-up; `Math.round(52.5) === 53` en JS igual que `ROUND(52.5, 0)` en Excel, pero `round(52.5) === 52` en Python. Cualquier verificación escrita en Python sin `ROUND_HALF_UP` produce cientos de falsos positivos. El generador y el test usan la convención de JS.