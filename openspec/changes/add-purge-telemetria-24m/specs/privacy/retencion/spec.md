# privacy/retencion Delta

## ADDED Requirements

### Requirement: Purge de telemetría a 24 meses

El sistema SHALL eliminar los eventos de `gf_analytics_events` con `created_at` anterior a 24 meses mediante un job pg_cron diario que ejecuta una función SQL de borrado por lotes. La función SHALL borrar en lotes configurables (default 10.000 filas por lote) hasta agotar el corte, SHALL contar el total borrado, SHALL usar la columna `created_at` con índice dedicado y SHALL tener `EXECUTE` revocado a `anon`, `authenticated` y `public`. La política SHALL declarar que la eliminación es automática y diaria.

#### Scenario: Cron borra eventos vencidos
- **WHEN** el job diario corre con eventos más viejos que 24 meses
- **THEN** los eventos vencidos son eliminados por lotes y el job registra el total borrado

#### Scenario: Sin eventos vencidos
- **WHEN** no hay eventos más viejos que el corte
- **THEN** la función termina con 0 borrados sin errores

#### Scenario: Anónimo intenta ejecutar la purga
- **WHEN** una solicitud anónima o autenticada llama a `purga_eventos_telemetria()`
- **THEN** Postgres la rechaza por permisos insuficientes

#### Scenario: Crecimiento de la tabla
- **WHEN** `gf_analytics_events` acumula cientos de miles de filas
- **THEN** el borrado usa lotes acotados con el índice de `created_at`, sin locks prolongados ni full-scan
