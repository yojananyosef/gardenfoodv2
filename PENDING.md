# AVISO — Pendientes de operación y deuda conocida

Última actualización: 2026-09-09 (Fase 1 LPDP aplicada: legales, CMP completo, ARSOP, headers/CSP, docs de cumplimiento).

## 🔴 Acción requerida (operación, no código)

1. ~~Supabase Dashboard → Auth → URL Configuration~~ **Cerrado 2026-09-09** (configurado por el usuario).
2. **Validación jurídica** de las plantillas de `/legal/{terminos,privacidad,cookies}` antes de cobrar suscripciones. Responsable: **Hugo Montenegro** (GardenFood), emprendedor individual, contacto pichilemugardenfood@gmail.com; Johan Gutierrez solo desarrollo. Falta completar el RUT al formalizar. No soy asesor legal.
3. ~~DPA de geolocalización IP~~ **Resuelto sin acción 2026-09-09**: `IPGEO_URL` está vacío — no hay proveedor de terceros de geo por IP; la ubicación viene de la comuna declarada y del GPS solo con consentimiento `preciseGeo`. Si algún día se configura `IPGEO_URL`, ahí sí se necesita DPA con ese proveedor (ver dpas-checklist.md §4).

## 🟡 Deuda conocida (de la auditoría, sin change abierto)

| Tema | Detalle |
|---|---|
| `fichas.ts` monolítico | 10.360 líneas; split por especie (README lo documenta) |
| Código muerto | ~~readConsentCookieExpiry, clearLocalConsent, resetTracker, describeInterval, getComuna/getEspeciesPorGrupo/getGrupos, variable muerta huerto/data.ts, migrate-frutas-images.mjs~~ **Cerrado 2026-09-09** (`add-minor-pack-limpieza`, todos verificados sin uso). Falsos positivos retirados: `clearLocalConsent` (revocación en perfil) y `esRutaProtegida` (proxy + tests); `getCalendario` (uso interno) y `ZonaClimatica` (definición única). Pendientes congelados: `mpPlanKey`, `setup-mercadopago-plans.mjs` y tabla `gf_subscription_plans` (MP hasta rehacer implementación). Refactor pendiente: `MESES` triplicado (agronomy/fechas/landing, acoplado a `type Mes`) |
| CMP anónimo | ~~Sin banner de consentimiento en primera visita anónima;~~ **Cerrado 2026-09-09** (`add-lpdp-compliance`): banner en layout raíz, revocación total en perfil, telemetría bajo interés legítimo con oposición, flags `personalizedAds` ya gated server-side. `thirdPartySharing`/`deviceLinking` quedan como gates documentados de la exportación B2B (Fase ad-tech) |
| Auth | OAuth (Google/Apple) stub "Próximamente"; sin páginas de términos/privacidad. ~~"¿Olvidaste tu clave?" `href="#"` sin flujo~~ **Cerrado 2026-09-09** (`fix-auth-confirmation-flow`): recuperación + restablecimiento + confirmación por email con callback PKCE. Pendiente operacional: configurar Site URL/Redirect URLs en Supabase Dashboard (README § Auth) |
| Métricas admin | ~~Agregaciones full-table en JS; `catch {}` silencioso en MRR~~ **Cerrado 2026-09-09** (`add-admin-dashboard-visible`): RPC `admin_overview_metrics` (0022, guard is_admin + revoke anon), MRR desde conteos con warn en logs. Pendiente menor: errores de DB tragados como `[]` en huerto/cosechas |
| Headers de seguridad | ~~`next.config.ts` sin HSTS/X-Frame-Options/`poweredByHeader:false`~~ **Cerrado 2026-09-09** (`add-lpdp-compliance`): HSTS/XFO/nosniff/Referrer/Permissions + CSP nonce en proxy.ts. Trade-off: layout raíz dinámico (sin estático de landing) por el nonce del JSON-LD |
| Retención telemetría | ~~Nueva deuda LPDP: implementar purge de `gf_analytics_events` a 24 meses~~ **Cerrado 2026-09-09** (`add-purge-telemetria-24m`): función `purga_eventos_telemetria()` con borrado por lotes + índice `created_at` + job pg_cron `purga-telemetria-24m` diario 06:30 UTC (0027). Verificado: 0 borrados sin errores, anon denegado |
| Trial de suscripción | Desactivado en código (`freeTrialDays: undefined` en route subscribe) por rechazo de risk en MP sandbox; la spec payments/subscription lo contempla a 14d. Al retomar la implementación de MP el usuario decide el número (7/14/ninguno) en esa única línea y se actualiza la spec. No configurar nada en dashboard de MP |
| Versión visible de Términos | `TERMINOS_VERSION` (route subscribe) registra qué versión aceptó cada suscripción; la página pública /legal/terminos aún no muestra su número de versión — agregar al formalizar la empresa |
| PWA | Cache de navegaciones sin límite; `/frutas/*.webp` no cacheadas; versión del SW manual |
| Tests | Sin cobertura de route handlers ni de `lib/supabase`; sin script `test:coverage` pese a tener `@vitest/coverage-v8` |
| Advisors Supabase (pre-existentes) | `is_admin()` SECURITY DEFINER ejecutable vía RPC por anon/authenticated (⚠️ no revocar EXECUTE: las políticas RLS dependen de él); `set_updated_at` con search_path mutable; `pg_net` en schema `public` (default Supabase); `gf_cron_config` con RLS sin políticas (intencional: solo service role); Leaked Password Protection deshabilitado en Auth |
| Historial de migraciones | Versiones remotas con timestamp (p.ej. `20260904004500`) vs filenames `NNNN_*` del repo — no usar `supabase db push` sin reconciliar (reintentaría migraciones ya aplicadas); las migraciones se aplican vía MCP `apply_migration`. Últimas aplicadas: 0020/0021 (2026-09-08), 0022_admin_overview_metrics_rpc (2026-09-09), 0023_admin_insights_media_kit_rpc (2026-09-09), 0024_media_kit_consent_gate (2026-09-09), 0025_subscriptions_terminos (2026-09-09), 0026_fk_audiences_perfiles (2026-09-09: hotfix embed /admin/audiencias), **0027_purge_telemetria_24m (2026-09-09)** |
| Datasets oficiales (referencia futura) | CIREN Catastro Frutícola: MapServer público `https://esri.ciren.cl/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer` + CSV 1999–2025 en `datos.odepa.gob.cl` (comercial >0,5 ha, actualización trianual — no cubre huertos caseros). IDE Minagri WMS: `ide.minagri.gob.cl/directorio-de-servicios`. INIA Agromet (estaciones agroclimáticas). Candidatos a overlays/capas de referencia en iteraciones futuras |

## 🟢 Cerrado

- Migración `0018_security_hardening` aplicada a producción (MCP `apply_migration`, versión `20260904004500`): trigger guard `perfiles.plan`, RLS de telemetría/sponsorships/consents. Verificado post-aplicación: políticas nuevas presentes y antiguas eliminadas, trigger habilitado, smoke tests (anon ve 0 consents y solo sponsorships paid+active; update autenticado de `plan` bloqueado con excepción del guard, rollback).
- Migración `0019_revoke_plan_guard_rpc` (nueva): `REVOKE EXECUTE` de `bloquea_cambio_plan_perfiles()` a `public/anon/authenticated` — cierra el único hallazgo nuevo del security advisor (la RPC ya fallaba por ser trigger function; el revoke elimina la superficie). Re-verificado: RPC denegada, trigger sigue activo.
- `MP_WEBHOOK_SECRET` verificado presente en producción (Vercel; valor no extraíble por diseño "Sensitive" del CLI).
- `CRON_SECRET` sincronizado: verificado funcionalmente replicando el POST del job pg_cron desde la DB (pg_net con el secret de `gf_cron_config`) → `200 {"processed":0,"errors":[]}`.
- Funnel de 3 capas (anónimo con muestra duraznero / gratuito con límites / pago) — `add-freemium-funnel` (commit `cbfe23e`).
- P0 seguridad: escalada RLS a admin, self-upgrade vía polling, webhook sin firma/anti-replay, telemetría falsable, consents anónimos world-writable, sponsorships no pagadas públicas, gates admin/checkout, `timingSafeEqual` — `harden-payments-and-rls` (commit `540b891`).
- Catálogo completo de 346 comunas oficiales (SUBDERE DPA) + selector del landing derivado del catálogo canónico — `complete-comunas-catalog`.
