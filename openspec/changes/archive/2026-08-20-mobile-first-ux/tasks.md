## 1. Data layer agronómico

- [x] 1.1 Migrar zonas agroclimáticas (20) y comunas (245 reales del legacy) desde `legacy/.../datos.js` a `lib/agronomy/zonas.ts` + `comunas.ts` con tipos
- [x] 1.2 Migrar catálogo de 30 especies (slug, nombre, latino, dificultad, grupo) a `lib/agronomy/especies.ts`
- [x] 1.3 Migrar calendarios mensuales (30×12: etapa, riego, nutrición, sanidad, alerta) a `lib/agronomy/fichas.ts` (`cal`) con acceso `getCalendarioPorMes`/`getTareasDelMes`/`getAlertasDelMes`
- [x] 1.4 Migrar matriz de viabilidad 30×20 a `lib/agronomy/viabilidad.ts`
- [x] 1.5 Migrar biblioteca fitosanitaria a `lib/agronomy/fichas.ts` (campo `san` por especie)
- [x] 1.6 Crear `lib/agronomy/index.ts` con acceso tipado (`getZonaDeComuna`, `getCalendario`, `getEspeciesPorZona`, etc.)
- [x] 1.7 Tests: nº especies = 30, comunas = 245, zonas = 20, calendarios 12 meses y muestra de la matriz (vitest)

## 2. Base de datos de usuario

- [x] 2.1 Migración SQL `gf_cultivos` (UNIQUE user_id+especie, RLS) vía MCP
- [x] 2.2 Migración SQL `gf_tareas` (estado/check constraints, RLS) vía MCP
- [x] 2.3 Migración SQL `gf_registro` (especie=slug, RLS) vía MCP
- [x] 2.4 Migración SQL `gf_arboles` (RLS) vía MCP
- [x] 2.5 Verificar con `list_tables` + advisors de seguridad

## 3. Autenticación

- [x] 3.1 Crear `app/login/page.tsx` (email+password, errores legibles, redirect con `next`)
- [x] 3.2 Crear `proxy.ts` (Next 16: `middleware.ts` → `proxy.ts`, export `proxy`) que refresca sesión y protege `(dashboard)`; públicas: `/`, `/explorar`, `/especies`, `/calculadoras`, `/registro`, `/login`, `/api`
- [x] 3.3 Botón/acción de logout en el dashboard (`lib/auth/logout.ts` + `SignOutButton`)
- [x] 3.4 Redirigir autenticados desde /login y /registro al dashboard

## 4. Navegación mobile-first

- [x] 4.1 Componente `components/layout/BottomNav.tsx` (client, 4 destinos, h-14 ≥48px, safe-area) + `SignOutButton.tsx`
- [x] 4.2 Actualizar `app/(dashboard)/layout.tsx`: bottom nav móvil + header desktop (`md:flex`) + logout
- [x] 4.3 Verificación: sin overflow horizontal a 375px, último bloque visible sobre la barra

## 5. Mi huerto

- [x] 5.1 Server action/lib CRUD de cultivos (`lib/huerto/cultivos.ts`)
- [x] 5.2 Rehacer `app/(dashboard)/huerto/page.tsx`: resumen (cultivos, tareas de hoy, alertas) + CRUD
- [x] 5.3 Componente de tarjetas de tareas del día con mark-done optimista
- [x] 5.4 Alertas estacionales por zona+mes con `lib/climate/`
- [x] 5.5 Inyección de `<SponsoredBanner />`/`<NativeAdSlot />` en el feed del huerto

## 6. Calendario

- [x] 6.1 Utilidad de fechas (semana inicia lunes) y grilla mensual `components/calendario/`
- [x] 6.2 Crear `app/(dashboard)/calendario/page.tsx`: navegación de meses + marcadores + día actual
- [x] 6.3 Detalle de día: lista de tareas con estado cíclico y borrar
- [x] 6.4 Agregar tarea custom al día (zod + sonner)
- [x] 6.5 Sugerencias agronómicas del mes (desde calendarios.ts) con add-one-tap y anti-duplicado

## 7. Cosechas

- [x] 7.1 Lib CRUD de registros (`lib/cosechas/registro.ts`)
- [x] 7.2 Crear `app/(dashboard)/cosechas/page.tsx`: stats + formulario + historial
- [x] 7.3 Sistema de logros (4 logros) con estados bloqueado/desbloqueado

## 8. Calculadoras y diagnóstico

- [x] 8.1 Mover `/calculadoras` fuera de `(dashboard)` a ruta pública
- [x] 8.2 Calculadora de riego (componente client)
- [x] 8.3 Calculadora de fertilización
- [x] 8.4 Calculadora de nº de plantas (usa densidad de especies.ts)
- [x] 8.5 Calculadora de rentabilidad
- [x] 8.6 Diagnóstico fitosanitario (chips de síntomas → matching → ranking)

## 9. Catálogo y fichas conectados

- [x] 9.1 `/explorar` consume `especies.ts` (30 especies con grupo)
- [x] 9.2 `/especies/[slug]` consume ficha + calendario del mes desde `calendarios.ts`
- [x] 9.3 Landing: enlazar catálogo y rutas actualizadas

## 10. Validación y cierre

- [x] 10.1 `openspec validate mobile-first-ux`
- [x] 10.2 Tests (vitest) + typecheck + lint
- [x] 10.3 E2E manual: login→huerto→calendario→cosechas→calculadoras (móvil + desktop)
- [x] 10.4 Commit + push + deploy Vercel