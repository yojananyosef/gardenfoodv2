# Tasks: Purge telemetría 24m

## 1. SQL
- [x] 1.1 Crear `supabase/migrations/0027_purge_telemetria_24m.sql`: índice `idx_events_created_at`, función `purga_eventos_telemetria(p_meses int default 24, p_lote int default 10000)` (borrado por lotes en bucle, retorna total) y `cron.schedule('purga-telemetria-24m', '30 6 * * *', ...)`.
- [x] 1.2 Aplicar migración 0027 vía MCP y verificar con `execute_sql`: función existe, job activo en `cron.job`, y denegación para anon (REST RPC).

## 2. Verificación
- [x] 2.1 `pnpm typecheck` + `pnpm lint` + `pnpm test` en verde (no debería cambiar nada, verificación de regresión).
- [x] 2.2 Ejecutar la función una vez manualmente con `execute_sql` (service role) y confirmar retorno 0 sin errores.
- [x] 2.3 Actualizar PENDING.md (migración 0027 aplicada; cerrar la deuda "Retención telemetría").
