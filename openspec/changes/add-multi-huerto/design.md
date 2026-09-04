# Design add-multi-huerto

Contexto: App Next.js 16 (App Router) + Supabase con RLS. El terreno hoy vive en `perfiles.terreno_geojson` (un Feature por usuario, change 2026-08-25). El plan pago ya promete "Huertos y cultivos ilimitados" (`lib/payments/plans.ts`). UI del mapa: Leaflet + geoman en `components/perfil/`.

## Decisiones

1. **Tabla `gf_huertos` en vez de FeatureCollection en `perfiles`.** Un polígono = un huerto con nombre propio. Permite límites freemium por fila, nombres, coordenadas derivadas y una futura FK `huerto_id` en cultivos/árboles sin otra migración destructiva. Alternativa descartada: `jsonb` con FeatureCollection (sin identidad por huerto, renombrado frágil, RLS a nivel de objeto imposible).
2. **Data migration aditiva + columna deprecada, no borrada.** `INSERT ... SELECT` desde `perfiles.terreno_geojson` (idempotente con `not exists`); la columna queda con datos como respaldo de rollback del deploy de código. `perfiles.superficie_m2` se mantiene (la consume telemetría) y pasa a ser la suma, sincronizada por las actions.
3. **Autosave por evento en el mapa** en vez de botón "Guardar". `pm:create` → `crearHuerto` (devuelve id que etiqueta la capa), `pm:edit` → `actualizarHuerto(id, {feature})`, `pm:remove` → confirm → `eliminarHuerto(id)` (si falla o se cancela, la capa se restaura en el mapa). El botón único de guardar no escala a N polígonos con estados pendientes distintos.
4. **El mapa se monta una vez** y no re-reacciona a cambios de estado: los huertos se leen solo al montar (la sección lo oculta mientras carga) y las callbacks llegan por refs. Evita re-crear el mapa (y perder zoom/vista) en cada guardado.
5. **Límite freemium interceptado antes de dibujar**: en `pm:drawstart` se consulta `puedeDibujar` (derivado de `limitesDe(plan)` + huertos cargados); si no hay cupo se cancela el modo dibujo y se muestra toast con CTA a `/pricing`. El action vuelve a validar server-side (defensa en profundidad, igual que cultivos/árboles).
6. **Coordenadas = centroide del anillo exterior** calculado on-the-fly con fórmula shoelace sobre lat/lng (`terrenoCentro`); 5 decimales ≈ 1,1 m. Sin columnas nuevas ni PostGIS: la precisión pedida es informativa.
7. **Cantidad: alta con default, edición con stepper.** Los zod schemas ya tienen `.default(1)`; se cambia el tipo de entrada a `z.input` para que TS permita omitir `cantidad`. La edición vive en las listas (`ControlCantidad`: +/− y click para escribir el número exacto). `actualizarArbol` pasa a patch parcial — antes `cantidad` sola habría borrado fecha/observaciones.
8. **Vinculación `/huerto` ↔ mapa solo visual** (card con nombre, m², coordenadas + CTA a `/perfil`). La FK `huerto_id` en `gf_cultivos`/`gf_arboles` queda como evolución futura (fuera de alcance confirmado).

## Riesgos

- [Doble disparo de eventos geoman] → `onCrear` solo en `pm:create` (nunca también en `pm:drawend`); `pm:edit` repetido es idempotente (UPDATE del mismo id).
- [RLS de tabla nueva] → política espejo de 0010 (`auth.uid() = user_id`), índice en `user_id` para cascadas.
- [Re-normalización de uniones de TS] → las actions nuevas retornan uniones discriminadas por `ok` (narrowing real), anotadas explícitamente.

## Plan de migración

1. `0020_gf_huertos.sql` (tabla, RLS, trigger, data migration, comentarios de deprecación).
2. Deploy de código. Rollback de código: revertir deploy (la tabla queda inofensiva). Rollback total: `drop table gf_huertos` (los datos siguen en `perfiles.terreno_geojson`).
