# Design: Insights + Media Kit

## Context
- Fase 3 dejó la RPC `admin_overview_metrics()` (0022) y las pestañas admin; esta fase agrega tendencia/funnel y material de venta.
- Telemetría existente: eventos `PRODUCT_USAGE/PAGE_VIEW` (con `payload->>'path'`), `AD_INTERACTION/{AD_IMPRESSION,AD_CLICK}` (con `ad_unit_id`), `especie_id` en `gf_analytics_events`; suscripciones en `gf_subscriptions` (`trialing`, `active`); audiencias B2B en `gf_user_audiences` (seeds `commercial_segments`, `purchasing_power_tier`, `primary_interest_crop`, join a `perfiles` para región).
- recharts 3.8 ya está en dependencias; las gráficas serán cliente, con datos pasados como props desde el server.
- Datos actuales insuficientes para k≥50 en producción: la página debe degradar con estados vacíos honestos, no con datos de ejemplo.

## Goals / Non-Goals
- **Goals**: una RPC SQL para insights; página con gráficas recharts; media kit k≥50 exportable desde el navegador; pestañas nuevas.
- **Non-Goals**: coortes de retención por usuario exactos (el funnel es comparación de totales; queda etiquetado así); ad-tech real (Fase 5); purge de eventos (deuda ya registrada); cualquier consumo de datos fuera de guard admin.

## Decisions

### D1: Una RPC `admin_insights_metrics()` que devuelve todo
Igual que 0022: plpgsql SECURITY DEFINER, `set search_path = public`, guard `is_admin()` + `REVOKE EXECUTE FROM anon`. Devuelve un solo JSON con: `funnel` (visitas30d distinct device_id con PAGE_VIEW, registros30d count perfiles created_at ≥ now()-30d, trial y activos totales de gf_subscriptions), `semanas` (8 semanas con generate_series para ceros: nuevos = usuarios cuyo primer evento user_id no nulo cae en la semana; retornados = distinct user_id con eventos en la semana cuyo primer evento es anterior al lunes de esa semana), `ctr_slots` (group by ad_unit_id de AD_IMPRESSION/AD_CLICK con CTR redondeado), `intereses` (group by especie_id 30d limit 10). Alternativa descartada: vistas materializadas — innecesario a este volumen y obligan a refresh.

### D2: El funnel se etiqueta como "totales acumulados, no coorte"
Visitas son de los últimos 30d, registros de los últimos 30d, pero trial/activos son snapshots totales: mezclarlos como si fuera un mismo grupo de usuarios sería un funalismo falso. La UI muestra el rótulo "Comparación de etapas (no coorte)". Decisión registrada para no prometer retención de coorte real hasta tener madurez de datos.

### D3: Media kit como agregación con HAVING count(*) >= 50
Una sola consulta SQL por dimensión (segmento comercial desdoblado con `unnest(commercial_segments)`, tier, especie de interés, región) con `HAVING count(*) >= 50`. Si el total de segmentos elegibles es 0, la página muestra "aún no hay segmentos publicables (k≥50)" y el export se deshabilita. La RPC de insights NO incluye el media kit: funciones separadas por responsabilidad (`admin_media_kit()` en la misma migración 0023) — export automático no lo consume, es la página server.

### D4: Export CSV/JSON generado en cliente
La página `/admin/media-kit` es server component con `isAdmin()` + RPC; el botón de export es un client component que recibe los segmentos ya filtrados y genera Blob + descarga (`URL.createObjectURL`). Sin endpoint público nuevo: la API v1 no expone el media kit. Cabecera del export: fecha, "k-anonymity ≥50", "Estadísticas agregadas — no incluye datos personales".

### D5: Gráficas con un componente cliente
`components/admin/InsightsCharts.tsx` (client) recibe `semanas`, `ctrSlots`, `intereses` como props y renderiza con recharts (AreaChart semanal, BarChart CTR, BarChart horizontal intereses). El funnel son tarjetas server-rendered con flechas — sin gráfico. SSR de recharts no es problema porque el componente es `"use client"` con datos serializables.

## Risks / Trade-offs
- **Datos escasos hoy**: con 6 usuarios el media kit estará vacío y las gráficas mostrarán series de ceros — aceptado: los estados vacíos son parte del spec y el producto se llena de datos con el lanzamiento.
- **"Nuevos vs retornados" aproxima retención**: no mide cohorte exacta (requeriría comparar primera actividad por usuario y semana — se hace en SQL con window function sobre eventos 8 semanas, costo moderado pero factible; se implementará así: primera actividad real por usuario).
- **`is_admin()` duplica checks**: página + RPC. Aceptado por defensa en profundidad (patrón ya establecido en 0022).

## Migration Open Questions
- Ninguna: todo el SQL queda en 0023, reversible con `drop function`.
