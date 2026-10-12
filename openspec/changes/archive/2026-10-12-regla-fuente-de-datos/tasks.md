- [x] 1. Recorrer las 47 hojas del Excel celda por celda buscando `descripcion`, `imagen` y `clima` de especie. Resultado: `imagen` y `descripcion` no existen en ninguna hoja; `clima_ideal` esta en 20 de 30.
- [x] 2. Comparar `especies.ts` contra `dim_especies` + `especies_bc` + `especies_ficha_bd20`, campo por campo. 29 diferencias, todas de vocabulario.
- [x] 3. Comparar `viabilidad.ts` contra `fact_viabilidad_zona`. 551 contra 600, 1 cambio real de veredicto, 87 combinaciones ausentes del codigo.
- [x] 4. Comparar `consejos.ts` contra `fact_consejos`. 154 contra 211, 1 en comun. Fuentes distintas.
- [x] 5. Migrar `especies.ts`: generar `especies.generado.ts` desde las tres tablas y dejar el editorial en `especies.editorial.ts`. **0 diferencias en 270 comparaciones.**
- [x] 6. Migrar `viabilidad.ts` y `consejos.ts`: **descartado.** Sus diferencias son de contenido, no de higiene.
- [x] 7. Agregar `fact_viabilidad_zona.razon` (migracion 0048) y poblarla con las 551 razones que el codigo conocia, sin cambiar el consumo.
- [x] 8. Verificar que el motor de riego ya tiene oraculo propio contra las 6.480 combinaciones de `API_RESPUESTAS`, con igualdad exacta. **Ya existia; no se duplico.**

## Lo que este change deja escrito

- Los numeros salen de la base, el texto editorial del codigo.
- Antes de migrar un catalogo se mide cuanto falta en cada lado.
- Una migracion de catalogo no puede cambiar lo que ve el usuario: se
  compara campo por campo y la diferencia tiene que ser cero.

## Lo que queda para otro dia

Nada de esto se resuelve aqui, y es a proposito:

| | Donde |
|---|---|
| 49 combinaciones de viabilidad ausentes | `PENDING.md` |
| Veredicto de olivo en la zona 20 | `PENDING.md` |
| Cual fuente de consejos manda | `PENDING.md` |
| Las 217 celdas de `dim_comunas.zona_agro_id` | `data/comunas_sin_zona.csv` |
| Mercado Pago -> Flow | `PENDING.md` |
| Licencia de Open-Meteo | `PENDING.md` |