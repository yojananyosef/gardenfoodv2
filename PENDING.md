# AVISO — Pendientes de operación y deuda conocida

Última actualización: 2026-09-03 (migraciones 0018 + 0019 aplicadas a producción; pendientes operacionales #1–#3 verificados).

## 🔴 Acción requerida (operación, no código)

Ninguna. Los 3 pendientes de `harden-payments-and-rls` quedaron cerrados (ver 🟢).

## 🟡 Deuda conocida (de la auditoría, sin change abierto)

| Tema | Detalle |
|---|---|
| `fichas.ts` monolítico | 10.360 líneas; split por especie (README lo documenta) |
| Código muerto | `readConsentCookieExpiry`, `clearLocalConsent`, `resetTracker`, `mpPlanKey`, `describeInterval`, `esRutaProtegida` (sin tests), `getComuna/getCalendario/getEspeciesPorGrupo/getGrupos`, `interface ZonaClimatica` duplicada en `zonas.ts`, `MESES` duplicado, variable muerta `huerto/data.ts`, scripts `migrate-frutas-images.mjs` y `setup-mercadopago-plans.mjs` + tabla `gf_subscription_plans` vestigiales |
| CMP anónimo | Sin banner de consentimiento en primera visita anónima; `thirdPartySharing`/`deviceLinking` se guardan pero nunca se leen; sin flujo de revocación total |
| Auth | OAuth (Google/Apple) stub "Próximamente"; "¿Olvidaste tu clave?" `href="#"` sin flujo; sin páginas de términos/privacidad |
| Métricas admin | Agregaciones full-table en JS (`lib/admin/metrics.ts`); `catch {}` silencioso en MRR (sub-conteo silencioso); errores de DB tragados como `[]` en huerto/cosechas |
| Headers de seguridad | `next.config.ts` sin HSTS/X-Frame-Options/`poweredByHeader:false` |
| PWA | Cache de navegaciones sin límite; `/frutas/*.webp` no cacheadas; versión del SW manual |
| Tests | Sin cobertura de route handlers ni de `lib/supabase`; sin script `test:coverage` pese a tener `@vitest/coverage-v8` |
| Advisors Supabase (pre-existentes) | `is_admin()` SECURITY DEFINER ejecutable vía RPC por anon/authenticated (⚠️ no revocar EXECUTE: las políticas RLS dependen de él); `set_updated_at` con search_path mutable; `pg_net` en schema `public` (default Supabase); `gf_cron_config` con RLS sin políticas (intencional: solo service role); Leaked Password Protection deshabilitado en Auth |
| Historial de migraciones | Versiones remotas con timestamp (p.ej. `20260904004500`) vs filenames `NNNN_*` del repo — no usar `supabase db push` sin reconciliar (reintentaría migraciones ya aplicadas); las migraciones se aplican vía MCP `apply_migration` |
| Datasets oficiales (referencia futura) | CIREN Catastro Frutícola: MapServer público `https://esri.ciren.cl/server/rest/services/IDEMINAGRI/CATASTRO_FRUTICOLA/MapServer` + CSV 1999–2025 en `datos.odepa.gob.cl` (comercial >0,5 ha, actualización trianual — no cubre huertos caseros). IDE Minagri WMS: `ide.minagri.gob.cl/directorio-de-servicios`. INIA Agromet (estaciones agroclimáticas). Candidatos a overlays/capas de referencia en iteraciones futuras |

## 🟢 Cerrado

- Migración `0018_security_hardening` aplicada a producción (MCP `apply_migration`, versión `20260904004500`): trigger guard `perfiles.plan`, RLS de telemetría/sponsorships/consents. Verificado post-aplicación: políticas nuevas presentes y antiguas eliminadas, trigger habilitado, smoke tests (anon ve 0 consents y solo sponsorships paid+active; update autenticado de `plan` bloqueado con excepción del guard, rollback).
- Migración `0019_revoke_plan_guard_rpc` (nueva): `REVOKE EXECUTE` de `bloquea_cambio_plan_perfiles()` a `public/anon/authenticated` — cierra el único hallazgo nuevo del security advisor (la RPC ya fallaba por ser trigger function; el revoke elimina la superficie). Re-verificado: RPC denegada, trigger sigue activo.
- `MP_WEBHOOK_SECRET` verificado presente en producción (Vercel; valor no extraíble por diseño "Sensitive" del CLI).
- `CRON_SECRET` sincronizado: verificado funcionalmente replicando el POST del job pg_cron desde la DB (pg_net con el secret de `gf_cron_config`) → `200 {"processed":0,"errors":[]}`.
- Funnel de 3 capas (anónimo con muestra duraznero / gratuito con límites / pago) — `add-freemium-funnel` (commit `cbfe23e`).
- P0 seguridad: escalada RLS a admin, self-upgrade vía polling, webhook sin firma/anti-replay, telemetría falsable, consents anónimos world-writable, sponsorships no pagadas públicas, gates admin/checkout, `timingSafeEqual` — `harden-payments-and-rls` (commit `540b891`).
- Catálogo completo de 346 comunas oficiales (SUBDERE DPA) + selector del landing derivado del catálogo canónico — `complete-comunas-catalog`.
