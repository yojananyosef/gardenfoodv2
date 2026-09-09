## Context

Estado actual verificado en código: `trackEvent` y el `PAGE_VIEW` del `TelemetryProvider` se gatean con `hasValidLocalConsent()` (lib/telemetry/tracker.ts:53, TelemetryProvider.tsx:42) — hoy sin token no corre nada. El token local es v1 (`lib/consent/token.ts`), con 5 flags incluido `legitimateInterestOpposed`, TTL 390 días. El `ConsentModal` solo se monta en el flujo de registro; no hay banner en visitas anónimas. El perfil ya re-abre `ConsentPreferences` pero sin opción de revocación total. El gating de ads personalizadas YA existe server-side (`lib/ads/sponsorships.ts:44-57`, verifica `gf_user_consents.consent_personalized_ads` no expirado). RLS: `gf_analytics_events` permite insert anónimo con `user_id null` (0018) y `gf_user_consents` escribe solo vía service-role (ruta CMP). La RLS de `gf_analytics_events` no permite DELETE al propio usuario (solo service-role) — la supresión usa admin client. `proxy.ts` es el middleware (convención de esta versión Next) y ya reescribe cookies de sesión.

## Goals / Non-Goals

**Goals:**
- Cumplir el piso de la Ley 21.719: transparencia, bases de licitud diferenciadas, ARSOP (portabilidad + supresión), oposición, revocación.
- Mantener vivo el flujo de datos del modelo ad-tech: la analítica de producto sigue alimentando audiencias sin pedir consentimiento para todo.
- Cabeceras de seguridad con CSP nonce según el patrón oficial de Next (middleware + nonce).

**Non-Goals:**
- Registros de consentimiento IAB TCF completos (consentString v2 de terceros) — el campo existe y queda passthrough.
- Enforzar `thirdPartySharing`/`deviceLinking` en la exportación B2B — llega con la Fase ad-tech (quedan documentados en docs/legal y visibles en UI).
- Opt-out de telemetría por tabla/evento individual — oposición binaria (la granularidad vive en los consentimientos).
- Migraciones de DB nuevas.
- Borrado selectivo de datos históricos de audiencias al suprimir cuenta más allá de lo listado.

## Decisions

1. **Doble base de licitud en un solo token** (v2): `telemetriaPermitida()` = NO hay elección válida, O la elección válida tiene `legitimateInterestOpposed: false`. Los consentimientos siguen independientes. Version bump 1→2 con migración defensiva: un token v1 válido se conserva tal cual (es una elección explícita del titular; su semántica de oposición es idéntica), tokens corruptos se descartan. Alternativa descartada: exigir re-elección forzada a todos — innecesario, molesto y sin base legal.
2. **Banner en el layout raíz** (`components/cmp/ConsentBanner.tsx`): cliente, se muestra cuando no hay token local válido; reutiliza `ConsentPreferences` para el modo granular y `useConsentSave` para persistir. Igual prominencia de Aceptar/Rechazar. `showCloseButton` → cerrar = rechazar todo (conservador, igual que el modal actual).
3. **CSP con nonce en `proxy.ts`** siguiendo el patrón Next: nonce por request, header `x-nonce` + CSP con `'nonce-…' 'strict-dynamic'`; el layout raíz lee el nonce de `headers()` para el JSON-LD inline. Dev añade `'unsafe-eval'` y `ws:` para HMR/Turbopack. `style-src 'unsafe-inline'` (Tailwind inline + librerías), `img-src self data: blob: https:` (imágenes de partners), `connect-src self https://*.supabase.co`. Trade-off aceptado: leer `headers()` en el layout raíz fuerza render dinámico — se pierde estático de landing/fichas; PWA cachea navegaciones. Alternativa descartada: CSP con hashes (el JSON-LD contiene SITE_URL variable por entorno → hash inestable).
4. **Supresión con admin client + auth check server-side**: la acción verifica sesión, consulta suscripción activa (`gf_subscriptions.status in (active,trialing)`) y bloquea; si no, borra en orden (tareas→cultivos→árboles→huertos→registro→consents→eventos→audiencias) con service-role y llama `admin.auth.deleteUser(id)` (FK cascade borra el perfil). Sesión se cierra en cliente con `signOut()`. Alternativa descartada: SQL en migración (una sola vez por cuenta, mejor en server action; auditable via logs).
5. **Exportación vía route handler** `/api/v1/privacy/export` (auth + `Content-Disposition: attachment`): agrupa consultas propias con el cliente SSR (RLS escopa) + eventos con admin client (RLS no permite SELECT propio). JSON con secciones nombradas y `generadoEn` ISO. Alternativa descartada: server action con redirect (no permite Content-Disposition limpio).
6. **Edad ≥14** con checkbox `required` + `FieldDescription` citando la autorización parental <16 (texto completo en Términos). Sin verificación documental (no es exigible operativamente para un registro freemium).
7. **Textos legales como plantillas técnicas**: redactados para el modelo concreto (freemium MP + telemetría first-party + audiencias agregadas), con placeholders `[RAZÓN SOCIAL]`, `[RUT]`, `[EMAIL CONTACTO]` y nota visible para validación legal antes de cobrar. `/legal` fuera del grupo `(public)` para no heredar TopBar/BottomNav y mantenerlas livianas, con layout propio minimal y noindex vía metadata.

## Risks / Trade-offs

- [Layout raíz dinámico por `headers()` → TTFB mayor en landing] → aceptado (seguridad > micro-perf); PWA cachea; revisar ISR cuando haya tráfico real.
- [Banner en layout raíz aparece también en dashboard (usuario logueado sin elección local)] → correcto: es primera visita en ese navegador; el token v2 persiste por dispositivo.
- [Supresión borra `gf_analytics_events` históricos con `user_id` — afecta cohortes de audiencia] → es el derecho del titular; los agregados se recalculan en el refresh de 6h; documentado en EIPD.
- [Usuario con preapproval "pending" al suprimir] → solo se bloquea `active`/`trialing`; `pending` sin pago aún puede suprimir (MP no cobra). Documentado.
- [`strict-dynamic` + CSP rompe futures scripts de terceros (MP Bricks, etc.)] → el modelo hosted-redirect no necesita inline de terceros; si se agregan, se evalúa nonce allowlist documentada.
- [Textos legales sin revisión jurídica] → placeholders + advertencia en PENDING.md: validación profesional antes de monetizar.

## Migration Plan

1. Merge del código (sin migraciones DB). Despliegue.
2. Verificar cabeceras con `curl -I` y banner con visita anónima; probar export con cuenta de prueba y supresión con cuenta desechable de prueba.
3. Rollback: revert del commit (sin estado de DB que migrar).

## Open Questions

- Ninguna que cambie specs o tareas. (El RUT/razón social y email de contacto real del responsable quedan como placeholders para el usuario.)
