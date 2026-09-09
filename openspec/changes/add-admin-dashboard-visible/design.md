## Context

TopBar es server component que ya consulta `auth.getUser()` (top-bar.tsx:65-69); BottomNav es client con 5 destinos en grid-cols-5. El dashboard layout (`app/(dashboard)/layout.tsx:13,17`) los monta. `isAdmin()` vive en `lib/auth/admin.ts` (consulta perfiles.plan). El overview (`admin/page.tsx`) usa `lib/admin/metrics.ts` — el único consumidor; `lib/admin/finanzas.ts` sirve a `/admin/finanzas` con admin client y no se toca. Existe spec `admin/metrics` con "Health signals" que la implementación traiciona con el dato fijo del webhook. Las migraciones se aplican vía MCP `apply_migration` (drift de versiones remotas documentado en PENDING).

## Goals / Non-Goals

**Goals:**
- Admin descubrible en la UI con un clic desde TopBar/BottomNav y navegable por pestañas.
- Overview 100% datos reales agregados en SQL, sin descargas full-table a JS.
- Cero datos fabricados en la UI.

**Non-Goals:**
- Gráficas recharts / página de insights (Fase 4).
- Cambiar el modelo de permisos (sigue `perfiles.plan === "admin"` + proxy).
- Auditoría de acciones admin (backlog).
- Rediseño visual de las subpáginas admin existentes.

## Decisions

1. **Plan admin resuelto una vez en el dashboard layout** y pasado como prop `esAdmin` a TopBar (server) y BottomNav (client). TopBar podría consultarlo solo, pero duplicaría la query por request; el layout ya renderiza ambos componentes en la misma pasada. BottomNav: grid `grid-cols-5` → `grid-cols-6` condicional (última celda "Admin" con icono Shield, reemplazando "Biblioteca" en espacio: **no** — 6 celdas reales con labels cortos; en pantallas muy estrechas el grid sostiene 6 columnas de ~64px).
2. **RPC `admin_overview_metrics()`** en una ida: evita 7 roundtrips y mueve `count distinct` (imposible en PostgREST head count) a Postgres. `SECURITY DEFINER` + `set search_path = public` + guard `if not is_admin() then raise` + `REVOKE EXECUTE FROM anon`. Llamada con cliente SSR de la sesión admin (auth.uid() presente); el admin client (service role, auth.uid() null) NO la usa.
3. **Precios MRR siguen en TS**: la RPC agrupa `plan`/`interval`/`count` y `lib/admin/metrics.ts` multiplica con `planAmount` — una sola fuente de precios, sin duplicar montos en SQL.
4. **Top comunas por cultivos** (spec-faithful): `gf_cultivos c JOIN perfiles p ON p.id = c.user_id GROUP BY p.comuna` — refleja demanda agrícola real, no población registrada.
5. **Loading skeleton** vía `admin/loading.tsx` (Next segment loading) — el overview es `force-dynamic`, el skeleton tapa el flash de carga.
6. **`getFunnel`/`getMRR`/etc. de `lib/admin/metrics.ts` se reemplazan** por `getOverview(supabase)` que consume la RPC; se conservan los tipos exportados (`Funnel`) que usa el overview.

## Risks / Trade-offs

- [RPC SECURITY DEFINER mal revocada expone agregados] → guard `is_admin()` dentro + `REVOKE EXECUTE FROM anon` + smoke: llamada anónima → error, admin → 200.
- [BottomNav con 6 entradas apretado en móvil] → labels cortos (Mi huerto/Zonas/Calendario/Cosechas/Biblioteca/Admin) probados a 320px; alternativa futura: overflow menu.
- [Migración aplicada vía MCP puede divergir del archivo repo] → el nombre `0022_*` sigue la convención repo; se aplica por MCP y se registra en PENDING como las anteriores.
- [El admin client de `finanzas.ts` queda full-table para listing paginado (limit 20)] → paginado ya implementado; no cambia.

## Migration Plan

1. Aplicar migración 0022 vía MCP `apply_migration` a producción.
2. Verificar RPC: anon → denegado; admin (sesión real) → json completo.
3. Merge del código (funciona igual sin la RPC hasta que exista; el overview degrada a estados vacíos si la RPC falta).
4. Rollback: revert commit + `drop function public.admin_overview_metrics()`.

## Open Questions

- Ninguna.
