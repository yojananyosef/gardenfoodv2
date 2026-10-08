# Proposal

## Why

El módulo de clima no tiene clima. `lib/climate/index.ts` son 86 líneas de reglas sobre promedios anuales hardcodeados en `lib/agronomy/zonas.ts`: cero fetch en runtime, cero API key, cero red. Las alertas se disparan por el mes del reloj contra promedios históricos (`txMax >= 30`, `MESES_HELADAS = [6,7,8]`), así que el «pronóstico» que ve el usuario es en realidad el perfil climático de su zona. El socio reportó datos históricos estáticos y estaciones caídas mostrando «Sin alertas», y pidió un pronóstico de los próximos días como el de una app de clima.

Verificado que no hay nada que arreglar: no existe el concepto de estación meteorológica en el código. No hay lista de estaciones, ni campo de estación activa, ni eventos con fecha. «Coihueco» solo aparece como comuna en `lib/agronomy/comunas.ts:214` y en una nota de almendro. El «Sin alertas» que ve el socio es el estado vacío de las reglas actuales.

De paso, las reglas tienen bugs que el pronóstico viene a corregir por la vía larga: la severidad de helada usa `includes("15")` sobre el string, así que `"5–15 días"` matchea y marca `alta` a Copiapó, Quillota, Pichilemu y Concepción, que deberían ser `media`; y la alerta de sequía se dispara en `[11,12,1,2,3]` sin mirar `zona.sequia`, así que a Temuco le dice «Precipitación baja (1200 mm/año)».

## What Changes

- **Pronóstico real de 7 días.** Se integra Open-Meteo (`api.open-meteo.com/v1/forecast`), que es JSON, gratis, sin API key y entrega `temperature_2m_min`, `temperature_2m_max` y `precipitation_probability_max` por día. Verificado en producción con la zona de Santiago: devuelve los 7 días con min, max y probabilidad de lluvia. La Dirección Meteorológica de Chile no expone API pública consumible desde cliente, así que se descarta como fuente.
- **Las alertas pasan a ser predictivas y fechadas.** Helada si el mínimo previsto de alguno de los próximos días baja del umbral, con la fecha. Lluvia si la probabilidad supera el umbral. Calor si el máximo lo supera. Se termina el caso «registrar eventos que ya ocurrieron».
- **Centroides por comuna.** No existen: `COMUNAS` solo tiene `zonaId` y `region`. Se genera un seed versionado en Git con un script de una sola pasada, siguiendo el patrón que ya usa `scripts/fertilizacion_seed.py`. Si el origen no es fiable, el fallback es centroide por `zonaId` (20 valores) y se anota como limitación.
- **Fallback explícito al perfil estático.** Si Open-Meteo falla o no hay centroide, el módulo sigue devolviendo el perfil de la zona, y la interfaz dice que son promedios y no pronóstico. La spec `garden/agronomy-data` hoy pide solo perfil estático, así que esto es alcance nuevo.
- **La tab Clima muestra los 7 días.** Tira con máxima, mínima y probabilidad de lluvia por día, más las alertas con fecha. Se cae el subtítulo «Datos agroclimáticos», que hoy sugiere una datasource que no existe.
- **Se quitan los chips decorativos.** `Riego`/`Helada`/`Lluvia` en `huerto/page.tsx:470-480` se muestran siempre, tengan o no alertas. Mienten sobre la cobertura.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/agronomy-data`: el sistema SHALL entregar pronóstico meteorológico por día para la comuna del usuario, no solo el perfil climático estático por zona. La spec vigente pide exclusivamente perfil estático, así que el requisito se amplía en vez de modificarse.
- `garden/huerto`: la pestaña Clima SHALL mostrar el pronóstico de los próximos días con fechas, y las alertas SHALL ser predictivas y fechado, no disparadas por el mes del calendario.

## Impact

- **Código**: `lib/climate/open-meteo.ts` (nuevo, fetch + tipos), `lib/climate/alertas.ts` (nuevo, umbrales puros desde pronóstico), `lib/climate/index.ts` (deja de ser el provider único; guarda el perfil estático como fallback), `lib/agronomy/centroides.ts` (nuevo, lee el seed), `supabase/comunas_centroides.json` (nuevo, generado), `scripts/comunas_centroides.mjs` (nuevo, una pasada), `app/(dashboard)/huerto/page.tsx` (tab Clima), `components/huerto/AlertasClimaticas.tsx` (fecha y valor), `components/huerto/HuertoCharts.tsx` (el `BarChart` de alertas, que hoy es constante).
- **Tests**: `tests/clima.test.ts` (nuevo) para umbrales y formateo. Los tests **no** pueden depender de la red, así que el fetch va separado de la lógica y los umbrales son funciones puras.
- **Spec**: `openspec/specs/garden/agronomy-data/spec.md` (nuevo requisito de pronóstico) y `garden/huerto` (requisito de alertas por fecha).
- **Docs**: `PENDING.md` (la fila de «Datasets oficiales» pasa a decir que Open-Meteo está integrado).
- **Sin API key ni variables de entorno nuevas.** Es la razón principal de elegir Open-Meteo.
- **Sin migraciones de DB.**
- **Riesgo de red en el camino crítico**: `/huerto` es un server component que ya lee Supabase en cada request. Sumar un fetch a un tercero en ese mismo camino tiene que estar detrás de `try/catch` y del perfil estático, o un problema de Open-Meteo tumba la pantalla principal.