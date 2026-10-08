# Tasks

## 1. Seed de centroides

- [x] 1.1 Escribir `scripts/comunas_centroides.mjs`: recorre los 346 registros de `COMUNAS`, consulta Nominatim uno por uno con User-Agent identificable y pausa entre llamadas, y escribe `supabase/comunas_centroides.json` con `{ comuna: { lat, lng } }`. Debe fallar ruidosamente si el archivo queda incompleto en vez de emitir un seed a medias.
- [x] 1.2 Ejecutar el script y verificar que el JSON tiene los 346 registros, con coordenadas dentro de Chile (lat entre -56 y -17, lng entre -76 y -66) y sin duplicados. Registrar el conteo real en la salida del script.
- [x] 1.3 Crear `lib/agronomy/centroides.ts` con el `Map` de carga desde el JSON, una función `centroideDe(comuna)` que devuelve `{ lat, lng } | null` y un `centroideDeZona(zonaId)` con los 20 valores por zona como último recurso. Cubrir con tests en `tests/clima.test.ts` el caso de comuna encontrada, comuna ausente y el fallback por zona.

## 2. Cliente de pronóstico

- [x] 2.1 Crear `lib/climate/open-meteo.ts`: `fetchPronostico(lat, lng)` contra `api.open-meteo.com/v1/forecast` con `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`, `timezone=America/Santiago` y `forecast_days=7`, con `next: { revalidate: 3600 }`. Devuelve `Pronostico` tipado o `null`; nunca lanza.
- [x] 2.2 Añadir en el mismo módulo `pronosticoDeComuna(comuna)` que resuelve el centroide y delega en `fetchPronostico`. Verificar con `pnpm typecheck` y con un test de que sin centroide devuelve `null` sin hacer fetch.
- [x] 2.3 Verificar a mano contra la API real con la coordenada de Santiago que el módulo devuelve los 7 días con min, max y probabilidad, y que un centroide inexistente produce `null` y no una excepción.

## 3. Alertas desde el pronóstico

- [x] 3.1 Crear `lib/climate/alertas.ts` con funciones puras sin fetch: `alertasDesdePronostico(pronostico, zona)` y `formatearDia(dia)`. La alerta de helada usa `temperature_2m_min` contra el umbral derivado de `zona.tnMin` con el margen documentado en el design, y su severidad se calcula por rangos del valor previsto, sin `includes()` sobre strings.
- [x] 3.2 Añadir la alerta de lluvia por `precipitation_probability_max` sobre el umbral, y reescribir la de calor por `temperature_2m_max`. Toda alerta lleva `fecha` obligatoria; si no puede nombrar el día, no se emite.
- [x] 3.3 Convertir `lib/climate/index.ts` en el respaldo estático: corregir la severidad de helada para que `"5–15 días"` no matchee `"15"`, y hacer que la alerta de sequía mire `zona.sequia` antes de dispararse. Marcar el módulo en el comentario como respaldo, no fuente principal.
- [x] 3.4 Escribir `tests/clima.test.ts` sin red: umbral de helada en tres casos (minima sobre, bajo y exactamente en el umbral), severidad por valor, alerta de lluvia por probabilidad, presencia de `fecha` en toda alerta, formateo del día (etiqueta corta y larga), y que el respaldo estático no lanza con los 20 tipos de `heladas` del catálogo. Ejecutar `pnpm test` y confirmar que pasa sin acceso a la red.

## 4. Tab Clima

- [x] 4.1 En `app/(dashboard)/huerto/page.tsx`, reemplazar la llamada a `climateAlertsProvider.getAlertas(zona, mes)` por la resolución de pronóstico: primero `alertasDesdePronostico` si hay pronóstico, y si no el respaldo estático. El resultado debe incluir si la fuente fue pronóstico o perfil.
- [x] 4.2 Añadir en `AlertasClimaticas.tsx` la fecha y el valor previsto en cada alerta (por ejemplo «jueves 9 · mínima 1,2 °C»), y cubrir el caso sin fecha con un estado que no se emite en vez de imprimirse vacío.
- [x] 4.3 Renderizar en la tab Clima la tira de 7 días con máxima, mínima y probabilidad de lluvia, usando `formatearDia`, y marcar el mes actual en la tira. Declarar en pantalla si los datos son pronóstico o perfil histórico.
- [x] 4.4 Borrar los chips decorativos `Riego`/`Helada`/`Lluvia` (`huerto/page.tsx:470-480`) o condicionarlos a que exista una alerta de ese tipo, y cubrir el comportamiento con tests del módulo de alertas.
- [x] 4.5 Reescribir `AlertasBar` en `components/huerto/HuertoCharts.tsx` como «días con alerta por tipo», ya que hoy todos los valores son `1` y el gráfico no representa magnitud. Verificar con typecheck que sigue compilando y que el chart no se rompe con cero días.

## 5. Verificación y documentación

- [x] 5.1 Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`, confirmando que el repo pasa y que las 38 rutas compilan.
- [x] 5.2 Probar el camino de fallo: apuntando la URL a un host inválido, confirmar que `/huerto` renderiza igual, que la tab Clima muestra el perfil estático y que lo dice en pantalla. Restaurar la URL después.
- [x] 5.3 Probar con dos comunas de regiones distintas y confirmar que el pronóstico cambia y que las alertas tienen fechas coherentes con la estación.
- [x] 5.4 Recorrer la tab Clima con y sin alertas para confirmar que el estado vacío no muestra ninguna etiqueta de cobertura falsa.
- [x] 5.5 Actualizar `PENDING.md`: Open-Meteo quedó integrado, con la limitación de los centroides y los supuestos que hay que validar con el socio (umbral de helada en grados y uso de `sequia` como discriminante de heladas).