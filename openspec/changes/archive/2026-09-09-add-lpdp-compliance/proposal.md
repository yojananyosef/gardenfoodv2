## Why

La Ley 21.719 (protección de datos personales) rige plenamente desde el 1-dic-2026 y el proyecto no cumple sus obligaciones base: no hay política de privacidad ni términos publicados, no existe canal para ejercer derechos ARSOP, el consentimiento CMP está incompleto (sin banner en visita anónima, flags `thirdPartySharing`/`deviceLinking` guardados y jamás leídos, sin revocación total), la telemetría exige consentimiento para todo (bloqueando los datos que alimentan el modelo ad-tech cuando bastaría interés legítimo) y faltan cabeceras de seguridad exigibles como "medidas de seguridad apropiadas". Sin esto, monetizar suscripciones y datos es adquirir riesgo legal directo (multas hasta 20.000 UTM, cesiones nulas).

## What Changes

- Páginas legales `/legal/terminos`, `/legal/privacidad`, `/legal/cookies` (contenidos adaptados al modelo freemium + ad-tech, con placeholders explícitos para RUT/razón social) y links reales donde hoy hay `href="#"` (registro).
- Re-arquitectura de bases de licitud del CMP: la telemetría de producto de primer partido (page views, dwell, scroll, interacciones de fichas) corre por defecto bajo **interés legítimo** con oposición simple; el **consentimiento** queda reservado para publicidad personalizada, geo precisa, compartición con terceros y vinculación de dispositivos (defaults OFF, como hoy).
- Banner de consentimiento en la primera visita anónima (Aceptar todo / Rechazar todo / Gestionar, botones de igual prominencia, sin dark patterns), montado en el layout raíz, con persistencia local + registro en API CMP.
- Revocación total desde "Ajustes de privacidad" en `/perfil`: botón "Restablecer elección" que borra el token local y vuelve a mostrar el banner.
- Conexión real de flags: `personalizedAds` ya gobierna el matching por audiencia server-side (`lib/ads/sponsorships.ts:44`, verificado) — no se duplica; `thirdPartySharing` y `deviceLinking` quedan documentados como gates de la exportación B2B (Fase ad-tech) y visibles en la UI de preferencias.
- Derechos ARSOP en `/perfil`: **portabilidad** (descarga JSON de todos los datos propios vía `/api/v1/privacy/export`) y **supresión** (eliminación de cuenta y datos con confirmación explícita, bloqueada con suscripción activa).
- Gate de edad en el registro: checkbox obligatorio "Tengo al menos 14 años" (la ley exige autorización parental para menores de 16; los términos lo declaran).
- Cabeceras de seguridad en `next.config.ts` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, `poweredByHeader: false`) y CSP con nonce en `proxy.ts`.
- Documentos de cumplimiento en `docs/legal/`: Registro de Actividades de Tratamiento (RAT), borrador EIPD del motor de audiencias, procedimiento de notificación de brechas y checklist de DPAs (Supabase, Vercel, Mercado Pago, IPGeolocation).

## Capabilities

### New Capabilities

- `privacy`: derechos del titular (portabilidad, supresión, oposición), banner CMP anónimo, revocación total y arquitectura de bases de licitud (interés legítimo vs consentimiento).

### Modified Capabilities

- `adtech/consent`: el requerimiento "Consent gates telemetry and advertising" cambia — la telemetría de producto pasa a correr bajo interés legítimo con oposición (sin consentimiento), y el gate de consentimiento queda solo para publicidad personalizada (que ya está implementado server-side en `lib/ads/sponsorships.ts` y no se repite aquí).

## Impact

- **Archivos nuevos**: `app/(public)/legal/{terminos,privacidad,cookies}/page.tsx` (o `app/legal/...` fuera del grupo para layout simple), `components/cmp/ConsentBanner.tsx`, `app/api/v1/privacy/export/route.ts`, `lib/privacy/{export,supresion}.ts`, `docs/legal/*.md`.
- **Archivos modificados**: `layout.tsx` (banner + nonce CSP + JSON-LD), `lib/consent/token.ts` (v2 + `telemetriaPermitida`), `lib/telemetry/tracker.ts` y `components/analytics/TelemetryProvider.tsx` (gate por oposición), `components/ads/*` y `lib/ads/sponsorships.ts` (fallback contextual), `app/(dashboard)/perfil/page.tsx` (revocación + ARSOP), `registro/page.tsx` (edad + links legales), `proxy.ts` (CSP nonce), `next.config.ts` (headers), hooks de tracking.
- **Trade-off aceptado**: la CSP con nonce fuerza render dinámico del layout raíz (el JSON-LD inline necesita el nonce) → se pierde la optimización estática de landing/fichas; se compensa con caché PWA existente. Documentado en design.md.
- **Sin migraciones DB** (la RLS actual permite ingestión anónima de eventos con `user_id null`, y `gf_user_consents` ya modela los 5 flags).
- **Riesgo legal pendiente**: los textos de las páginas son plantillas técnicas; el usuario debe validarlos con abogado antes de cobrar.
