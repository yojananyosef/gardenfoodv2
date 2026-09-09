# Design: Purge telemetría

## Context
- La política pública promete retención de 24 meses para eventos; hoy no hay ejecución.
- El único job pg_cron existente (`refresh-audience-profiles`, 0012) es HTTP-based porque necesita lógica TS (computeAudienceProfile). El purge no necesita la app: es SQL puro.
- La tabla usa `created_at timestamptz default now()` sin índice propio (solo índices de event_category/adtech, geo, payload GIN, user_time).

## Goals / Non-Goals
- **Goals**: eliminación automática, diaria, auditable, sin locks largos y sin superficie pública.
- **Non-Goals**: purge de `gf_user_consents` (otra política de retención, otra deuda); particionado de la tabla; archivo histórico.

## Decisions

### D1: SQL puro + pg_cron, sin endpoint HTTP
La función `purga_eventos_telemetria()` vive en la DB y el job la llama directamente (`select public.purga_eventos_telemetria()`). Evita todo el aparato del patrón HTTP (CRON_SECRET, guard en route handler, pg_net) que solo se justifica cuando la lógica vive en TS. Menos piezas, menos secretos, menos superficie.

### D2: Borrado por lotes en bucle
`with victimas as (select id ... limit p_lote) delete ... using victimas` repetido hasta que un lote devuelve menos filas que el límite. Cada iteración es una transacción corta (MVCC libera espacio en vacuum); evita el lock prolongado y el bloat de un DELETE masivo único. Costo O(n/lote) round-trips: aceptable a escala actual (tabla chica) y controlada al crecer.

### D3: Índice de created_at
`idx_events_created_at` (b-tree simple) hace el corte index-scan. Al ser monótono en el tiempo, los lotes seleccionados son contiguos al final del índice. Sin él, cada iteración sería seq-scan completo.

### D4: Corte de 24 meses configurable por parámetro
`p_meses int default 24` con `make_interval(months => p_meses)`: si la política cambia (más corto por minimización), es un parámetro del job o una llamada manual, no una nueva migración de función.

### D5: Superficie de la función
SECURITY DEFINER (el dueño ejecuta el delete sobre la tabla) pero `REVOKE EXECUTE FROM anon, authenticated, public`. El rol del cron en Supabase corre con permisos suficientes (pg_cron corre como el rol del owner del job; en Supabase los jobs se crean con el rol del proyecto). Verificación de la denegación en el smoke.

## Risks / Trade-offs
- **Borrar de más**: el corte es `created_at < now() - 24 meses` exacto; si la política pública dijera algo distinto quedaría contradicción — hoy coincide con lo publicado.
- **Bloat por deletes**: vacuum estándar de Supabase maneja el espacio de lotes pequeños; riesgo residual al crecer (revisar en la próxima revisión de advisors).

## Migration Open Questions
- Ninguna: 0027 crea función + índice + schedule; reversible (`cron.unschedule` + `drop function`).
