# Change: Purge automático de telemetría a 24 meses

## Why
La Política de Privacidad y el RAT declaran que los eventos de telemetría "se conservan hasta 24 meses, luego se eliminan", pero no existe ningún mecanismo que lo ejecute: la tabla `gf_analytics_events` solo crece. Retener más de lo prometido es incumplimiento del principio de minimización (art. 12 Ley 21.719) y del propio texto publicado.

## What Changes
- Nueva función SQL `purga_eventos_telemetria(p_meses, p_lote)` (migración 0027): borra eventos con `created_at` anterior al corte en lotes de 10.000 filas (sin locks largos), en bucle hasta terminar, y retorna el total borrado.
- Índice `idx_events_created_at` para que el corte no sea full-scan al crecer la tabla.
- Job pg_cron `purga-telemetria-24m` diario a las 06:30 UTC (~03:30 CLT) que ejecuta la función.
- Superficie mínima: `REVOKE EXECUTE` de la función a `anon`/`authenticated`/`public` (solo service role y el rol del cron pueden borrar).
- El periodo es configurable por parámetro (`p_meses`, default 24) sin tocar código si algún día cambia la política.

## Impact
- **Affected specs**: `privacy/retencion` (nueva).
- **Affected code**: `supabase/migrations/0027_*` (función + índice + schedule). Ningún cambio de app.
- No breaking: operación idempotente y segura con la tabla vacía.
