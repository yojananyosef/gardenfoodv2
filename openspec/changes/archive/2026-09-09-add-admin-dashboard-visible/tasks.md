## 1. Migración RPC

- [x] 1.1 Crear `supabase/migrations/0022_admin_overview_metrics_rpc.sql` con `admin_overview_metrics()` (plpgsql, SECURITY DEFINER, `set search_path = public`, guard `is_admin()`, agrega: total usuarios, gratuitos, subs por estado, subs activas por plan/interval, activos 30d count distinct, eventos 24h, top comunas por cultivos join perfiles limit 10, última sincronización max updated_at; `REVOKE EXECUTE FROM anon`) — verificar SQL sintácticamente
- [x] 1.2 Aplicar la migración a producción vía MCP `apply_migration` y verificar con SQL: `select admin_overview_metrics();` falla sin admin y el schema tiene la función — verificar resultado del apply

## 2. Entrada visible y navegación

- [x] 2.1 En `app/(dashboard)/layout.tsx`: resolver `esAdmin` una vez (perfiles.plan) y pasarlo como prop a `TopBar` y `BottomNav` — verificar revisión
- [x] 2.2 En `components/layout/top-bar.tsx`: botón "Admin" (Icono ShieldCheck) en `UserNav` cuando `esAdmin` — verificar revisión visual
- [x] 2.3 En `components/layout/BottomNav.tsx`: aceptar prop `esAdmin`, agregar entrada "Admin" (grid-cols-6 condicional, icono ShieldCheck) — verificar revisión visual a 320px

## 3. Layout admin + skeleton

- [x] 3.1 Crear `app/(dashboard)/admin/layout.tsx`: guard `isAdmin` (mensaje de acceso denegado) + navegación por pestañas (Overview · Usuarios · Finanzas · Audiencias · Patrocinios) con estado activo por pathname — verificar navegación
- [x] 3.2 Crear `app/(dashboard)/admin/loading.tsx` con skeleton de KPI cards — verificar render

## 4. Métricas a SQL

- [x] 4.1 Reescribir `lib/admin/metrics.ts`: `getOverview(supabase)` llama `supabase.rpc("admin_overview_metrics")`, mapea a tipos existentes (`Funnel`), calcula MRR con `planAmount` desde los conteos agrupados y devuelve `{ total, gratuitos, funnel, mrr, activos30d, eventos24h, topComunas, ultimaSincronizacion }` — verificar `pnpm typecheck`
- [x] 4.2 Reescribir `app/(dashboard)/admin/page.tsx` sobre `getOverview`: tarjetas KPI, funnel, salud con "última sincronización" real (estado vacío "sin sincronizaciones") y top comunas (estado vacío) — sin ningún dato hardcodeado — verificar revisión visual

## 5. Verificación integral

- [x] 5.1 `pnpm lint && pnpm typecheck && pnpm test` en verde — verificar salida limpia
- [x] 5.2 Smoke en dev con sesión admin: entrada Admin visible en TopBar/BottomNav, pestañas activas, overview con datos reales de la RPC, sin valor fabricado en el HTML — verificar en dev
- [x] 5.3 Actualizar `PENDING.md` (cierre del ítem de métricas admin + migración 0022 registrada) — verificar diff
