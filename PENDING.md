# AVISO — Pendientes de operación y deuda conocida

Última actualización: 2026-09-03 (cambios `add-freemium-funnel` + `harden-payments-and-rls`).

## 🔴 Acción requerida (operación, no código)

1. **Push de la migración 0018** — `supabase/migrations/0018_security_hardening.sql` (trigger guard de `perfiles.plan` + RLS de telemetría/sponsorships/consents) vive en el repo pero **aún no se aplicó a la DB**:
   ```bash
   pnpm exec supabase link --project-ref <ref>   # si no está linkeado
   pnpm exec supabase db push
   ```
   Orden recomendado: deployar el código (que ya tolera ambas configs de RLS) → push de la migración.
2. **Verificar `MP_WEBHOOK_SECRET` en producción** (Vercel env). Desde `harden-payments-and-rls`, el webhook **rechaza con 500** si falta el secret en `NODE_ENV=production` — intencional. Sin esta var, Mercado Pago no podrá confirmar suscripciones.
3. **Sincronizar `CRON_SECRET`** — el job pg_cron de audiencias (`gf_cron_config.cron_secret`) y la env `CRON_SECRET` deben seguir iguales; nada automatiza esto.

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
| Spec drift | `garden/agronomy-data` menciona "254 comunas canónicas"; código tenía 245 (ver change en curso del selector) |

## 🟢 Cerrado

- Funnel de 3 capas (anónimo con muestra duraznero / gratuito con límites / pago) — `add-freemium-funnel` (commit `cbfe23e`).
- P0 seguridad: escalada RLS a admin, self-upgrade vía polling, webhook sin firma/anti-replay, telemetría falsable, consents anónimos world-writable, sponsorships no pagadas públicas, gates admin/checkout, `timingSafeEqual` — `harden-payments-and-rls`.
