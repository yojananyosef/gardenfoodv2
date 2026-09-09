# Tasks: Insights + Media Kit

## 1. SQL
- [x] 1.1 Crear `supabase/migrations/0023_admin_insights_media_kit_rpc.sql`: función `admin_insights_metrics()` (funnel 30d, 8 semanas nuevos/retornados con generate_series y primera actividad por usuario, CTR por ad_unit_id, intereses por especie_id) y función `admin_media_kit()` (segmentos con HAVING ≥50 por commercial_segments desdoblado, tier, especie, región) — ambas plpgsql SECURITY DEFINER, `set search_path = public`, guard `is_admin()`, `REVOKE EXECUTE FROM anon`.
- [x] 1.2 Aplicar migración 0023 vía MCP `supabase_apply_migration` (proyecto `ayhpmsocohrorabvrmow`) y verificar con `execute_sql` que ambas funciones existen.

## 2. Insights
- [x] 2.1 Crear `lib/admin/insights.ts`: `getInsights()` vía `supabase.rpc("admin_insights_metrics")` con tipos y normalización (estados vacíos explícitos, sin catch silencioso de conteos: log en consola server en caso de error RPC).
- [x] 2.2 Crear `components/admin/InsightsCharts.tsx` (client, recharts): AreaChart de actividad semanal (nuevos/retornados), BarChart de CTR por slot, BarChart horizontal de intereses; props serializables, sin lógica de datos.
- [x] 2.3 Crear `app/(dashboard)/admin/insights/page.tsx` (guard isAdmin server-side): tarjetas funnel con etiqueta "Comparación de etapas (no coorte)", tasas entre etapas con división por cero protegida, y las gráficas de 2.2; estados vacíos explícitos.

## 3. Media kit
- [x] 3.1 Crear `lib/admin/mediakit.ts`: `getMediaKit()` vía `supabase.rpc("admin_media_kit")` con tipos y conteo de segmentos bajo el umbral.
- [x] 3.2 Crear `app/(dashboard)/admin/media-kit/page.tsx` (guard isAdmin): tabla de segmentos ≥50 por dimensión, indicador de segmentos omitidos por k-anonymity, estado vacío "aún no hay segmentos publicables (k≥50)" con export deshabilitado.
- [x] 3.3 Crear `components/admin/MediaKitExport.tsx` (client): botones "Exportar CSV" y "Exportar JSON" que generan Blob en cliente con cabecera legal (fecha, k-anonymity ≥50, "estadísticas agregadas — no incluye datos personales") y descargan vía `URL.createObjectURL`.

## 4. Navegación
- [x] 4.1 Agregar pestañas "Insights" (`/admin/insights`) y "Media kit" (`/admin/media-kit`) a `app/(dashboard)/admin/AdminTabs.tsx`.

## 5. Verificación
- [x] 5.1 `pnpm typecheck` + `pnpm lint` + `pnpm test` en verde.
- [x] 5.2 Smoke en dev: RPC de insights con anon deniega; con datos de producción las gráficas muestran series reales (ceros donde no hay); media kit muestra estado vacío k≥50 honesto con 6 usuarios; kill del server.
- [x] 5.3 Actualizar PENDING.md (marcar avance de Fase 4; registrar migración 0023 aplicada).
