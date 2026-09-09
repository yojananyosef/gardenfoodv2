## Why

La sección `/admin` solo se accede tecleando la URL: ni TopBar ni BottomNav muestran entrada alguna, así que el dueño del negocio (el jefe) navega a ciegas. Además el overview mezcla datos reales con uno inventado ("Webhook MP 100% (27 notifs)", hardcodeado en `admin/page.tsx:96`) y las métricas agregan tablas completas en JS (`lib/admin/metrics.ts` descarga todas las filas de eventos de 30 días para contar con un `Set`) — con telemetría creciente esto no escala y el dato falso desinforma decisiones.

## What Changes

- **Entrada visible**: TopBar muestra botón "Admin" cuando el usuario tiene `plan=admin`; BottomNav agrega entrada Admin para admins (grid 5→6). El dashboard layout resuelve el plan una vez y lo pasa como prop.
- **Layout de la sección admin** (`app/(dashboard)/admin/layout.tsx`): navegación por pestañas (Overview · Usuarios · Finanzas · Audiencias · Patrocinios) con estado activo, y guard de acceso en el propio layout.
- **Métricas a SQL**: migración `0022_admin_overview_metrics_rpc.sql` crea la función `admin_overview_metrics()` (SECURITY DEFINER, guarda `is_admin()`, revocada a anon) que agrega en una ida: total usuarios, gratuitos, funnel por estado, suscripciones activas por plan/intervalo, activos 30d (count distinct), eventos 24h, top comunas (por cultivos, join a perfiles) y última sincronización de suscripciones.
- **`lib/admin/metrics.ts` reescrito** sobre la RPC vía cliente SSR (sesión admin, `auth.uid()` activo); los precios MRR siguen en TS (`planAmount`) — la RPC devuelve conteos agrupados.
- **Overview real**: fuera el hardcode del webhook; la tarjeta de salud muestra "última sincronización de suscripciones" (max `updated_at` de `gf_subscriptions`). Loading skeleton para la ruta admin.
- La degradación a datos sin filas (proyecto temprano) usa estados vacíos explícitos.

## Capabilities

### New Capabilities

- `admin/navegacion`: acceso visible al panel desde la UI (TopBar/BottomNav/layout con pestañas) para usuarios con plan admin.

### Modified Capabilities

- `admin/metrics`: Overview KPIs y Health signals pasan a datos agregados en SQL (RPC) y el health signal del webhook fabricado se reemplaza por "última sincronización"; top comunas se computa por cultivos (join perfiles) como declara la spec.

## Impact

- **Migración nueva** `0022_admin_overview_metrics_rpc.sql` (se aplica a producción vía MCP `apply_migration`, no con `supabase db push` — ver PENDING sobre drift de versiones remotas).
- **Archivos nuevos**: `app/(dashboard)/admin/layout.tsx`, `app/(dashboard)/admin/loading.tsx`, migración 0022.
- **Archivos modificados**: `components/layout/top-bar.tsx`, `components/layout/BottomNav.tsx`, `app/(dashboard)/layout.tsx` (prop esAdmin), `app/(dashboard)/admin/page.tsx`, `lib/admin/metrics.ts`.
- **Compatibilidad**: `lib/admin/finanzas.ts` no cambia (usa admin client directo); `getMRR`/`getFunnel` de metrics.ts quedan solo para overview vía RPC.
- **Riesgo**: RPC SECURITY DEFINER debe quedar revocada a `anon` y con guard `is_admin()` dentro — verificado con smoke.
