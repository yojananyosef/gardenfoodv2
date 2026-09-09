# Change: Add insights de decisión y media kit de venta

## Why
El overview admin (Fase 3) muestra KPIs puntuales, pero no tendencias ni funnel de conversión: el jefe no puede decidir dónde invertir ni medir si los cambios de producto mueven la aguja. Además, para activar ad-tech (Fase 5) hace falta un **media kit** con segmentos comercializables y k-anonymity ≥50, exportable, que sea el material de venta ante marcas sin exponer datos individuales.

## What Changes
- Nueva función SQL `admin_insights_metrics()` (migración 0023) con guard `is_admin()` y `EXECUTE` revocado a `anon`: funnel conversión (visitas → registros → trial → pagos), actividad semanal (nuevos vs retornados, 8 semanas), CTR por `ad_unit_id` (AD_IMPRESSION/AD_CLICK) e interés por especie.
- Nueva capability `admin/insights`: página `/admin/insights` con gráficas (recharts 3.8, ya en dependencias) alimentadas por la RPC; componente cliente único que recibe datos como props; estados vacíos explícitos.
- Nueva capability `admin/media-kit`: página `/admin/media-kit` con segmentos agregados de `gf_user_audiences` (por segmento comercial, tier, especie de interés, región) filtrados por **k-anonymity ≥50**, export CSV/JSON generado en cliente; nunca filas individuales.
- Pestañas nuevas en `AdminTabs`: "Insights" y "Media kit".

## Impact
- **Affected specs**: `admin/insights` (nueva), `admin/media-kit` (nueva), `admin/navegacion` (MODIFIED: se agregan las dos pestañas).
- **Affected code**: `supabase/migrations/0023_*`, `lib/admin/insights.ts`, `components/admin/InsightsCharts.tsx`, `components/admin/MediaKitExport.tsx`, `app/(dashboard)/admin/{insights,media-kit}/`, `app/(dashboard)/admin/AdminTabs.tsx`.
- No breaking: solo agrega páginas y una RPC. La RPC de overview (0022) queda intacta.
