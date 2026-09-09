# Tasks: Clean-room B2B

## 1. SQL
- [x] 1.1 Crear `supabase/migrations/0024_media_kit_consent_gate.sql`: `create or replace function admin_media_kit()` con CTE `vigentes` (última elección vigente por titular vía `distinct on (user_id)` orden `consent_timestamp desc`, `expires_at > now()`, `consent_third_party_sharing = true`) y cruce de las 4 dimensiones (`por_segmento`, `por_tier`, `por_especie`, `por_region`) con ese conjunto; `bajo_umbral` calculado sobre el mismo pool elegible. Guard `is_admin()` + `REVOKE EXECUTE FROM anon` intactos.
- [x] 1.2 Aplicar migración 0024 vía MCP y verificar con `execute_sql` que la función quedó con la gate (auditoría SQL directa del CTE).

## 2. Media kit (UI/export)
- [x] 2.1 Actualizar `app/(dashboard)/admin/media-kit/page.tsx`: nota visible de que los conteos incluyen solo titulares con la elección "Compartir con socios comerciales" vigente.
- [x] 2.2 Actualizar `components/admin/MediaKitExport.tsx`: agregar a la cabecera del CSV y del JSON la línea de base de consentimiento ("incluye solo titulares que aceptaron compartir con socios comerciales").

## 3. Copy
- [x] 3.1 Actualizar la descripción de "Compartir con socios comerciales" en `components/cmp/ConsentPreferences.tsx` con el modelo clean-room (sin venta ni entrega de datos; solo estadísticas de grupos grandes y entrega contra segmentos).
- [x] 3.2 Actualizar el párrafo "Sobre la publicidad y el modelo de datos" en `app/legal/privacidad/page.tsx` con la definición clean-room (entrega contra segmento, reportes agregados k≥50, solo titulares con consentimiento de compartición vigente).

## 4. Contrato
- [x] 4.1 Crear `docs/ads/clean-room.md`: qué compra la marca, qué recibe (reporte de entrega agregado k≥50), qué nunca recibe, base legal por titular, reglas operativas, respuesta estándar a solicitudes de datos individuales y trazabilidad hacia RAT/dpas-checklist.

## 5. Verificación
- [x] 5.1 `pnpm typecheck` + `pnpm lint` + `pnpm test` en verde.
- [x] 5.2 Smoke: RPC `admin_media_kit` deniega a anon; con la gate aplicada el media kit sigue mostrando estados vacíos honestos (no hay audiencias ni pool elegible ≥50 hoy).
- [x] 5.3 Actualizar PENDING.md (migración 0024 aplicada; Fase 5 cerrada).
