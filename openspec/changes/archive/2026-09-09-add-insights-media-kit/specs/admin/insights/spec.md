# admin/insights Delta

## ADDED Requirements

### Requirement: Funnel de conversión

El sistema SHALL mostrar en `/admin/insights` un funnel de conversión con las etapas: `visitas 30d` (distinct `device_id` con evento `PRODUCT_USAGE/PAGE_VIEW` en 30d), `registros 30d` (count de `perfiles` con `created_at` en 30d), `trial` (total de `gf_subscriptions` con `status='trialing'`) y `pagos activos` (total de `gf_subscriptions` con `status='active'`). El funnel SHALL calcularse en SQL y SHALL etiquetarse como comparación de totales acumulados, no como coorte de un mismo grupo de usuarios.

#### Scenario: Admin abre insights
- **WHEN** un admin abre `/admin/insights`
- **THEN** el sistema muestra las 4 etapas del funnel con sus conteos y la tasa de conversión entre etapas consecutivas

#### Scenario: Sin tráfico aún
- **WHEN** no hay eventos de página en 30d
- **THEN** las tarjetas del funnel muestran estados vacíos explícitos ("sin datos") en lugar de tasas con división por cero

### Requirement: Actividad semanal

El sistema SHALL mostrar un gráfico de línea/área con las últimas 8 semanas: usuarios **nuevos** (primer evento del usuario dentro de la semana) y usuarios **retornados** (con eventos en la semana y eventos previos), agregados en SQL por `date_trunc('week')`.

#### Scenario: Admin revisa actividad
- **WHEN** un admin revisa el gráfico de actividad
- **THEN** el sistema muestra una serie por semana con nuevos y retornados calculados en Postgres

#### Scenario: Semanas sin actividad
- **WHEN** una semana no tiene eventos
- **THEN** la serie incluye la semana con valor 0 (generada con `generate_series`) en lugar de omitir la fila

### Requirement: CTR por slot publicitario

El sistema SHALL mostrar impresiones, clics y CTR por `ad_unit_id` a partir de eventos `AD_INTERACTION` (`AD_IMPRESSION`/`AD_CLICK`), con CTR calculado en SQL (`clics/impresiones`) y ordenado por impresiones descendente.

#### Scenario: Admin evalúa slots
- **WHEN** un admin revisa el bloque de CTR
- **THEN** el sistema lista cada slot con impresiones, clics y CTR real de telemetría

#### Scenario: Sin interacciones publicitarias
- **WHEN** no hay eventos `AD_INTERACTION`
- **THEN** el bloque muestra el estado vacío explícito "sin interacciones registradas" en lugar de un CTR fabricado

### Requirement: Interés por especie

El sistema SHALL mostrar las especies con más eventos de telemetría (`especie_id` no nulo) en 30d, con conteo por especie (límite 10, orden descendente).

#### Scenario: Admin revisa interés
- **WHEN** un admin revisa el bloque de interés
- **THEN** el sistema muestra el ranking de especies por eventos de 30d calculado en SQL

### Requirement: Guard de acceso

La función SQL `admin_insights_metrics()` SHALL aplicar `is_admin()` como guard y SHALL tener `EXECUTE` revocado a `anon`; las páginas SHALL además validar `isAdmin()` server-side.

#### Scenario: Anónimo consulta la RPC
- **WHEN** una solicitud anónima llama a `admin_insights_metrics()`
- **THEN** Postgres rechaza con "No autorizado: solo administradores"
