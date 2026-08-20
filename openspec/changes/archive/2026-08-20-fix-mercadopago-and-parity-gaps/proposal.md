## Why

V2 corrigió 18/22 hallazgos QA y migró la deuda técnica (Vanilla→Next, RLS versionado, PWA/SEO), pero quedan 4 regresiones de valor core y un flujo de pagos sandbox roto. El pago recurrente usa `POST /preapproval` plan-less con `frequency:1, frequency_type:"years"` para anual (MP espera 12×months), `back_url` singular mal documentado, y sin trato para `Payer==collector` que devuelve 400 en tests; el cliente ve errores `MercadoPago.js - No length configuration / invalid property settings` y CSP `nonce ... strict-dynamic` porque intenta mezclar Bricks legacy con redirect, y `Tracking Prevention` bloquea storage. Además falta: vista de recomendación por zona (`resultados.html`), 3 tabs de ficha (fenología/consejos/info), 10 imágenes Wikimedia con 429, `gf_economia` eliminado sin decisión, `perfil` sin suelo/agua/sol, `sitemap.xml` omite 30 especies e incluye privadas, y `fichas.ts` monolítico de 10k líneas. Sin fix, el onboarding pago no puede verificarse y el claim "¿qué puedo cultivar en mi zona?" no existe en UI.

## What Changes

- **Pagos Mercado Pago (único proveedor, Flow/PayPal descartados):** Mantener flujo hospedado con `init_point` (legado Bricks con `card_token_id` + `preapproval_plan_id` devuelve 404 `Card token service not found` — ver `2026-08-20-subscription-payments/tasks.md:6.2`). Corregir `auto_recurring`: `monthly: {frequency:1, frequency_type:"months"}` / `yearly: {frequency:12, frequency_type:"months"}` (10×mensual, 12 cuotas), `transaction_amount` CLP entero, `free_trial:14d`, `back_url` validado contra `NEXT_PUBLIC_SITE_URL` + `/suscripcion/confirmar`, `notification_url` siempre seteado a `/api/v1/payments/webhook`, `external_reference=gf_subscriptions.id`. Manejo explícito de `collector==payer` → 400 con mensaje humano y guía de usuario de prueba distinto al vendedor, y retry/limpieza de draft. Webhook valida `x-signature` con `MP_WEBHOOK_SECRET` (HMAC `id;request-id;ts;`) y mapea `authorized→active/trialing`, `cancelled→gratuito`, `paused→inactive`. `POST /api/v1/payments/subscribe/status` y `/suscripcion/confirmar` hacen polling idempotente. **BREAKING**: elimina todo Bricks inline (`secure-fields.mercadopago.com`); no hay `paymentBrick_container`, se evita CSP `script-src nonce` al no inyectar inline scripts ni `fontSize:number`. Sponsorship con Checkout Pro (`/checkout/preferences`) queda con `sandbox_init_point` en TEST.
- **Paridad funcional:** Nueva ruta `/recomendadas` (o bloque en `/explorar`) que consume `getEspeciesPorZona(zonaId)` y clasifica `si/riesgo/no` con `viabRazon`; habilitada solo con `perfil.comuna` válida (fallback zona 7). Ficha: restablecer tabs `Fenología` (por macrozona), `Consejos`/`Info` y `Imagen` local.
- **Assets:** Descargar 10 imágenes Wikimedia (`frutilla`→`palto` `lib/agronomy/especies.ts:395`) a `public/frutas/` y re-escribir `ESPECIES.imagen` a `/frutas/<slug>.webp` optimizado con `sharp`; 20 locales mover de `ASSETS/IMG/frutas` a `public/frutas`. Actualizar `next.config.ts` con `images.remotePatterns` vacío (todo local).
- **Datos:** Canonizar catálogo a 254 comunas (`lib/agronomy/comunas.ts:9`, `zonas.ts:272`) y alinear docs (208 era 2024, 254 es 2026). `perfiles` mantiene decisión de dropear `gf_economia` (documentado como no portado; 0 registros en auditoría) vs re-crear si se requiere.
- **SEO/PWA:** `sitemap.ts` genera 1 + 30 `/especies/<slug>` + `/explorar`+`/calculadoras`+`/pricing` (excluye `/huerto|/calendario|/cosechas|/perfil|/admin|/api`), `robots.ts` disallow mismas privadas + `allow:/`. `fichas.ts` pasa a imports dinámicos por especie para no cargar 10k líneas en landing.
- **Observabilidad pagos:** logs estructurados `[payments/subscribe]` + `subscribe/status` + `webhook`, métricas 502 vs 400, guía de pruebas con usuario MP TEST distinto a coleccionador.

## Capabilities

### New Capabilities
- `garden/recomendaciones`: vista de descubrimiento que filtra el catálogo de 30 especies por zona agroclimática del perfil en buckets recomendado/riesgo/no recomendado con razón técnica, estado vacío sin comuna y fallback zona neutral.

### Modified Capabilities
- `payments/subscription`: creación de preapproval sin plan con recurrencia inline correcta, manejo de trial, yearly, back/notification URLs, validación collector≠payer, mapping de estados vía webhook/polling y gating por `perfiles.plan`; elimina flujo Bricks inline y su CSP.
- `garden/agronomy-data`: catálogo tipado de 254 comunas/20 zonas/30 especies/360 calendarios con imágenes hospedadas localmente (sin dependencia Wikimedia) y zona canónica.
- `seo/metadata`: sitemap y robots reflejan rutas públicas reales y especies dinámicas, OG/metadataBase sin regresión.

## Impact

- Código: `lib/payments/mercadopago.ts:55` (frequency fix, backUrl/notificationUrl), `app/api/v1/payments/subscribe/*`, `webhook/route.ts:84`, `app/(dashboard)/pricing/page.tsx:41` (no Bricks), `app/(public)/especies`, `lib/agronomy/*`, `public/frutas/*`, `next.config.ts`, `app/sitemap.ts:7`, `app/robots.ts:6`, `components/especies/FichaEspecieView.tsx:12`.
- DB: sin nueva tabla (reusa `gf_subscriptions` + `perfiles`); si se restaura economía se adiciona `0017_gf_economia.sql`.
- Config: `MP_ACCESS_TOKEN` (TEST), `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL` requeridos; `NEXT_PUBLIC_MP_PUBLIC_KEY` eliminado (era Bricks). `IPGEO_URL` opcional no afectado.
- Breaking: cualquier prueba que inyectaba `card_token_id` al backend deja de funcionar; toda suscripción pasa por `init_point` hospedado (redirect), no iframe.
