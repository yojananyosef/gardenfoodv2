# Design

## Context

`lib/climate/index.ts` (86 líneas) es todo el módulo. Su `ClimateAlertProvider` tiene un método síncrono, `getAlertas(zona, mes)`, sin `async` y sin I/O. Las reglas:

- `MESES_HELADAS = [6, 7, 8]` fijo, igual para las 20 zonas.
- `helada`: severidad por `zona.heladas.includes(...)` sobre un string tipo `"15–30 días"`.
- `sequía`: `MESES_SEQUIA = [11,12,1,2,3]`, sin mirar `zona.sequia`.
- `calor`: `txMax >= 30`, donde `txMax` es el promedio anual de la zona, no una temperatura prevista.

`ZonaClimatica` (`lib/agronomy/zonas.ts:4-15`) es un literal autogenerado marcado «Do not edit manually». `COMUNAS` (`comunas.ts`) tiene `comuna`, `zonaId`, `region` y nada más: **no hay coordenadas en ninguna parte del repo**.

Restricciones que moldean el enfoque:

- `/huerto` es un server component (`page.tsx:59-78`) que ya hace 5 queries a Supabase en cada request. `getAlertas` es síncrono y se llama en línea.
- La CSP de `proxy.ts` no incluye `api.open-meteo.com` en `connect-src`. Como el fetch es server-side, la CSP no aplica (solo gobierna al navegador), así que no hay que tocar `proxy.ts`. Confirmado: los `fetch` existentes (telemetría, MercadoPago) tampoco están en `connect-src`.
- `next.config.ts` no tiene `cacheComponents` ni flags experimentales. El `fetch` con `next: { revalidate }` funciona como caché de datos en App Router.
- `lib/climate/index.ts` tiene **cero tests**. `lib/agronomy/index.ts:138-145` tiene un `getAlertasDelMes` distinto (por especie desde `fichas.ts`), que sí está testeado y que no se toca.

Verificado contra la API real: `GET https://api.open-meteo.com/v1/forecast?latitude=-33.45&longitude=-70.67&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Santiago&forecast_days=7` responde 200 sin credencial, con 7 días de min, max y probabilidad. Con `past_days=7` devuelve también el histórico reciente, que sirve para el badge del termómetro.

## Goals / Non-Goals

**Goals:**
- Pronóstico real por día, con fecha, para la comuna del perfil.
- Alertas derivadas del valor previsto, con la fecha a la que se refieren.
- Que un fallo de Open-Meteo no tumbe `/huerto`, y que el fallback sea declarado como tal en pantalla.
- Que la lógica de umbrales sea testeable sin red.

**Non-Goals:**
- No se migran los promedios de `zonas.ts`. Se quedan como respaldo y como fuente de los umbrales regionales.
- No se integra INIA Agrometeorología ni la DMC. Agromet expone formularios PHP POST, no JSON; la DMC no tiene API pública consumible. Queda anotado en `PENDING.md`.
- No se cruzan las alertas de clima con los cultivos activos del usuario, que es lo que dice hoy la spec `garden/huerto`. La spec se ajusta para que deje de prometer eso (ver decisión 6).
- No se toca el chart de alertas más allá de quitar la indicación falsa de cobertura.

## Decisions

### 1. Open-Meteo, y no la DMC

Descartado: la Dirección Meteorológica de Chile no expone API pública consumible desde cliente, y su portal es web con formularios. Agrometeorología INIA expone formularios PHP POST (`estaciones[]`, `variables[]`), lo que ya está documentado en `lib/climate/index.ts:16-20` y en el design de `add-mobile-first-ux` (decisión D7).

Elegido: Open-Meteo. JSON, gratis, sin API key para este uso, y entrega exactamente los tres campos que pide el socio. La ausencia de credencial elimina variables de entorno, DPA y el problema de secretos en Vercel que ya está documentado para `MP_WEBHOOK_SECRET` en `PENDING.md`.

### 2. Dos módulos, no uno: `alertas.ts` puro y `open-meteo.ts` con el fetch

El umbral y el formateo van en funciones puras sin `fetch`. Los tests corren sin red, que es lo que permite un CI determinista. El fetch va aparte y devuelve `null` en cualquier fallo en vez de lanzar.

**Alternativa descartada:** testear el provider con `vi.mock` del módulo de fetch. Se descartó porque acopla los tests a la forma del módulo y porque un test de integración con red es exactamente lo que falla en CI un jueves a las 23:50.

### 3. `alertas.ts` reescrito, no extendido

El módulo actual pasa a ser el respaldo. Se reescriben las reglas para que todo sea función de un valor previsto, con la fecha:

- Helada: `temperature_2m_min` por debajo del umbral de la zona. Severidad porrangos del valor previsto, no por `includes("15")` sobre un string de rango. Esto mata el bug de severidad de Copiapó, Quillota, Pichilemu y Concepción.
- Lluvia: `precipitation_probability_max` sobre el umbral. Es el tipo de alerta que hoy **no existe** y que el socio pidió explícitamente.
- Calor: `temperature_2m_max` sobre el umbral.
- Sequa: la alerta desaparece como regla por mes. Sigue having sentido como respaldo del perfil estático, pero mirando `zona.sequia` antes de dispararla.

Cada alerta lleva `fecha` obligatoria. Si no puede.Named la fecha, no se emite.

### 4. Centroides: seed generado, no dependencia en runtime

Hace falta una coordenada por comuna. No existe en el repo. Opciones:

- **Nominatim en runtime** → descartado: 346 requests al primer usuario, uso de CPU de un tercero en cada carga, y la política de uso de Nominatim prohíbe el uso sin identificación y con tráfico de producción.
- **Consultar 20 centroides por zona, hardcodeados** → suficiente para un pronóstico y cero infraestructura, pero un pronóstico para Arica y otro para Coyhaique dan el mismo dato.
- **Seed generado una vez** → `scripts/comunas_centroides.mjs` consulta Nominatim 346 veces con pausa y User-Agent identificable, escribe `supabase/comunas_centroides.json` versionado, y `lib/agronomy/centroides.ts` lo consume como `Map`. Sigue el patrón exacto de `scripts/fertilizacion_seed.py` → `supabase/fertilizacion_seed.json` → `lib/agronomy/fertilizacion.ts`.

Se elige el seed. Si Nominatim no entregara coordenadas válidas para todas las comunas, el fallback es el centroide de la `zonaId` y queda anotado en `PENDING.md` como limitación conocida.

### 5. Caché con `revalidate` y respaldo en dos capas

`next: { revalidate: 3600 }` sobre el fetch: el pronóstico no cambia cada minuto y `/huerto` se pide en cada visita. Una hora es un refresco razonable y no castiga a Open-Meteo.

El respaldo tiene dos capas, porque una sola no alcanza: si el fetch lanza, se usa el perfil estático de la zona; si el perfil estático tampoco está disponible, se devuelven cero alertas. `/huerto` nunca falla por clima.

### 6. La spec de `garden/huerto` se ajusta en vez de prometer el cruce con cultivos

La spec vigente dice «compute seasonal alerts for the user's **active crops** using the current month's agronomic calendar». La implementación nunca hizo eso: cruza zona + mes del reloj, no cultivos. El cruce real con cultivos existe en otro lugar (`lib/agronomy/index.ts:138-145`, `getAlertasDelMes`, que usa `fichas.ts` y alimenta las tareas).

Elegí modificar la spec para que describa lo que el sistema hace: las alertas estacionales de cultivo siguen existiendo para las sugerencias de tareas, y lo que la tab Clima muestra son las alertas de clima predictivas. Reclamar el cruce con cultivos aquí sería un change distinto y bastante más grande, porque necesitaría leer los cultivos del usuario y cruzarlos con el pronóstico.

## Risks / Trade-offs

- **[Un tercero en el camino crítico de `/huerto`]** → `try/catch` con dos capas de respaldo, y el spec lo fija como comportamiento observable («la pantalla se renderiza igual, sin errores»). Un fallo de Open-Meteo degrada a promedios, no rompe.

- **[El `BarChart` de alertas se vuelve redundante]** → Hoy cuenta por tipo y como cada tipo se empuja máximo una vez, todos los valores son `1`: el gráfico no representa magnitud. Con el pronóstico hay N días por tipo, así que pasa a ser útil. Se reescribe como «días con alerta por tipo», no se borra.

- **[Umbrales que no están en `zonas.ts`]** → `ZonaClimatica` no tiene umbral de helada en grados, tiene un string de «días de helada por año». Hay que derivar un umbral en grados a partir de `tnMin` (la temperatura mínima promedio de la zona) con un margen, y documentarlo. Es una decisión de agronomía, no de código: se anota como supuesto explícito en el design y queda señalado para que el socio lo valide. Si el umbral queda mal, las alertas se disparan de más o de menos, y se ajusta en un solo lugar.

- **[Centroides con error de precisión]** → Nominatim devuelve el centroide de la relación administrativa, que para comunas extensas (por ejemplo las de Magallanes) puede caer lejos del caserío real. Se acepta: para un pronóstico a 7 días la diferencia es de décimas de grado. Se anota como limitación.

- **[Los tests de `lib/climate` hoy no existen]** → El módulo se reescribe, así que cualquier cobertura existente sería falsa confianza. Se empieza de cero con `tests/clima.test.ts`, lo que es una mejora.

- **[El origen de los datos cambia de un día a otro si Open-Meteo degrada o cambia su API]** → Se aísla en un solo módulo (`open-meteo.ts`) y se documenta en `PENDING.md` que es la fuente a revisar si algún día se integran Agromet o la DMC. El contrato de `alertas.ts` no depende de quién trae los números.