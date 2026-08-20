# mobile-first-ux — Design

## Context

V2 hoy es: registro + landing + capa adtech completa (consentimiento, telemetría, audiencias, sponsorships). No hay login, no hay middleware de sesión, `/huerto` es un placeholder, `/calculadoras` tiene una sola calculadora. El legacy (Vanilla JS + Bootstrap + Supabase) ya resolvía estos módulos con 6 tabs en "Mi Huerto" y 4 calculadoras + diagnóstico; su lógica está documentada en `legacy/Gardenfood/ASSETS/JS/huerto.js` y `biblioteca.js`, y sus datos en `datos.js`/`db_detalle.js` (~4.300 líneas). Los reportes del legacy (`qa_report.md`) justifican no reutilizar ese código tal cual (errores críticos de seguridad y consistencia).

La base de datos v2 ya tiene `perfiles` (con `region`, `comuna`, `zona_agroclimatica`, `plan`) y la capa adtech. Faltan las 4 tablas de datos del usuario.

## Goals / Non-Goals

**Goals:**
- Reconstruir los módulos de usuario mobile-first con la arquitectura React/Next v2 (Server Components + client islands + RLS), sin deuda técnica del legacy.
- Migrar los datos agronómicos estáticos a módulos TS tipados reutilizables.
- Dejar los flujos adtech ya existentes conectados al feed del huerto y calendario.

**Non-Goals:**
- No integrar la red de estaciones INIA (agrometeorologia.cl) en vivo: no expone API JSON pública (formularios PHP POST). Se deja documentado como evolución.
- No migrar el módulo de pagos (MercadoPago) ni planes gated: fuera de alcance.
- No reconstruir las fichas técnicas de 9 tabs en su totalidad; el foco es dashboard, calendario, cosechas y calculadoras.
- No implementar el planificador económico/árboles del legacy en esta iteración (se cubre en un change futuro).

## Decisions

### D1. Data layer agronómico: módulos TS puros, sin DB

Convertir `datos.js` + `db_detalle.js` a `lib/agronomy/` (zonas.ts, comunas.ts, especies.ts, calendarios.ts, viabilidad.ts, diagnostico.ts) como datos estáticos tipados, con una única interfaz de acceso (ej. `getZonaDeComuna`, `getCalendario(especie, mes)`, `getEspeciesPorZona`).

- **Por qué**: datos de solo lectura, de referencia, sin mutación → no necesitan RLS ni tabla; el tree-shaking de Next solo carga lo que cada ruta usa. Mantiene la app rápida (el legacy cargaba 504KB de JS en todas las páginas).
- **Alternativa descartada**: tablas en Supabase. Añade latencia y complejidad de seed para datos que nunca cambian; los calendarios mensuales son 30×12.

### D2. Autenticación: Supabase SSR + middleware

Login/logout con `@supabase/ssr` (`createClient` server + browser, ya existentes) y un `middleware.ts` que refresca sesión y protege las rutas `(dashboard)`.

- **Por qué**: es el patrón oficial de Supabase + Next y ya hay `lib/supabase/client.ts` y `server.ts`.
- **Nota**: el v2 no tiene middleware hoy; hay que crearlo. Rutas públicas: `/`, `/explorar`, `/especies/*`, `/calculadoras`, `/registro`, `/login`. Rutas protegidas: `(dashboard)` y `/perfil`. `is_admin` ya existe en `lib/auth/admin.ts`.

### D3. Bottom navigation: layout compartido del dashboard

Nuevo `app/(dashboard)/layout.tsx` que renderiza un `<BottomNav />` (client) en móvil (`< md` via CSS) y el header desktop con las mismas rutas + perfil/salir. Se usa `lucide-react` (ya en el proyecto). Touch targets ≥48px vía clases (h-12+).

- **Por qué**: una sola barra inferior reutilizada por todos los módulos es el patrón mobile-first estándar y evita duplicar navegación.
- **Alternativa**: Tabs superiores — descartada por el requisito de uso con una mano.

### D4. Tablas de usuario: RLS "user manages own data"

Migraciones versionadas (`000N_*.sql`) crean `gf_cultivos`, `gf_tareas`, `gf_registro` y `gf_arboles` con: `id uuid default gen_random_uuid()`, `user_id uuid references auth.users on delete cascade`, índices por `user_id`, RLS habilitada y política `FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`. `gf_cultivos` lleva `UNIQUE(user_id, especie)` para evitar duplicados (bug crítico C3/duplicados del legacy). `gf_registro` usa `especie` como slug de catálogo (estandariza `dbKey` — corrige C3).

- **Por qué**: corrige los hallazgos críticos del QA legacy (C3 inconsistencia de especie, duplicados, sin FKs) desde el diseño.
- **Acceso**: lecturas en Server Components con `createClient()` (server), mutaciones con client components + RLS.

### D5. Escritura: Server Components + client islands con useOptimistic

Páginas del dashboard leen datos en el server (SSR) y las interacciones (agregar cultivo, cambiar estado tarea, guardar registro) son componentes client con `useOptimistic` para feedback inmediato, validación con zod y toasts con `sonner`.

- **Por qué**: SSR para carga inicial, optimismo para la sensación nativa mobile; consistente con el stack v2 (zod + sonner ya instalados).
- **Alternativa**: server actions puras — válidas pero con menos feedback optimista inmediato en conexiones lentas.

### D6. Calendario: grilla mensual propia (sin librería)

La grilla mensual (días, marcadores, navegación) se implementa con componentes propios reutilizando la utilidad de fechas (semana que empieza en lunes). Sin dependencias de calendario nuevas.

- **Por qué**: el alcance es simple (marcador por día + detalle), y el legacy ya lo hacía con CSS puro. Evita una dependencia pesada.

### D7. Alertas: derivadas de zona + mes, con hook de integración INIA

Las alertas se calculan de `calendarios.ts` (mes actual) + `zonas.ts` (zona del perfil). Se define una interfaz `ClimateAlertProvider` en `lib/climate/` con implementación estática inicial y la documentación de una futura implementación que consuma estaciones INIA por comuna.

- **Por qué**: cumple la spec sin depender de un servicio externo sin API pública; deja el punto de extensión claro.

## Risks / Trade-offs

- **[Volumen de datos migrados]** → Migrar ~4.300 líneas de datos a TS es el riesgo mayor de errores → se migra con test de snapshots (fixtures) comparando valores clave (nº de especies=30, comunas=208, zonas=20) y tests unitarios sobre la matriz.
- **[Middleware nuevo puede romper rutas públicas]** → La lista de rutas públicas/protegidas se cubre con tests de rutas (ya existe patrón de tests E2E manual).
- **[Cambio de navegación afecta flujos adtech existentes]** → El TelemetryProvider se mantiene en el layout raíz del dashboard; el bottom nav no altera los hooks de tracking.
- **[Bottom nav + webview/safe-area en iOS]** → Se usa `env(safe-area-inset-bottom)` para no tapar la barra del navegador.
- **[Fecha límite de la RLS por índice]** → `UNIQUE(user_id, especie)` puede chocar si un usuario ya tiene duplicados del flujo viejo → como no hay datos reales en v2 (tablas nuevas), no hay riesgo.

## Migration Plan

1. Migraciones SQL aplicadas vía MCP (tablas + RLS + índices).
2. Landing + explorar/especies: actualizar para consumir `lib/agronomy` (sin cambio de ruta).
3. Login + middleware + logout + protección de dashboard.
4. Bottom nav + layout dashboard.
5. `/huerto` (cultivos + resumen del día + alertas + ads).
6. `/calendario` (grilla + tareas + sugerencias).
7. `/cosechas` (bitácora + logros).
8. `/calculadoras` (4 calculadoras + diagnóstico; públicas).
9. Validación openspec + tests + commit/push + deploy Vercel.

Rollback: los cambios son aditivos (tablas nuevas, rutas nuevas); revierta el commit y los datos nuevos quedan huérfanos pero inofensivos (no afectan la capa adtech).

## Open Questions

- ¿El dashboard debe estar protegido por plan (gate como el legacy) o solo por sesión en esta iteración? Se asume solo por sesión (los planes/pagos no existen aún en v2); se documentará como decisión si el usuario quiere gate.
- ¿`/calculadoras` públicas en `/explorar` (ruta pública) o dentro del dashboard? Se asume pública (spec: usable sin sesión) → se ubica fuera de `(dashboard)` pero se enlaza desde la navegación.