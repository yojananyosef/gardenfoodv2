## Context

V2 ya corre en Next 16 App Router (`proxy.ts:30`) con Supabase SSR y `is_admin()` RLS (`supabase/migrations/0006`). El flujo de suscripción actual es hosteado (`POST /preapproval` → `init_point`) y evita Bricks; su única deuda es mapear mal el anual (`frequency:1, years` → MP K.O.) y no centralizar `back_url`/`notification_url`. Legacy usaba Payment Bricks (`mp.bricks().create('payment')` `legacy/Gardenfood/ASSETS/JS/planes.js:46`) con `card_token_id` → `preapproval_plan_id` → 404 `Card token service not found` (documentado en `archive/2026-08-20-subscription-payments/tasks.md:6.2`). Copiar ese Bricks reintroduce CSP `nonce strict-dynamic` (Next inyecta `nonce-xyz` en `script-src`; `unsafe-inline` se ignora) y errores `secure-fields.mercadopago.com: fontSize should be string / No length configuration`. Por tanto se mantiene hosteado. Datos agronómicos están tipados (`lib/agronomy/*:1`) pero imágenes siguen en `ASSETS/IMG/frutas` + Wikimedia externa; `fichas.ts:1` carga 10k líneas en toda ruta; `sitemap.ts:7` lista 5 rutas y omite 30 fichas.

## Goals / Non-Goals

**Goals:** (1) pagos sandbox verificables end-to-end sin Bricks inline; (2) restaurar recomendación por zona sin romper gating; (3) eliminar 429/404 de imágenes; (4) sitemap/robots canónicos; (5) split de fichas.
**Non-Goals:** revivir Flow/PayPal (descartados por usuario), re-crear `gf_economia` (0 registros históricos; se documenta como dropeado), PWA offline extendido, app nativa.

## Decisions

**D1 — Pagos: mantener preapproval plan-less hosteado, no Bricks.** Rationale: MP exige que la tarjeta se tokenice dentro de su checkout (`docs mercadopago.com/developers/es/reference/preapproval`); `card_token_id` vía API no es canjeable por suscripción. Alternativa Bricks considerada → rechazada por 404 + CSP + `secure-fields` validación estricta (`length`/`allowedLengths`). Consecuencia: UX es redirect a `init_point`, no modal.

**D2 — Yearly = 12× months, no 1× years.** Rationale: `archive/2026-08-20-subscription-payments/proposal.md:62` fija anual 10× mensual en 12 cuotas; MP ejemplos usan `frequency:12, frequency_type:"months"` para anual. Validado contra error de usuario (init_point creado pero checkout recaptcha/colpasa en sandbox por frecuencia no soportada). Mensual queda `frequency:1, months`.

**D3 — URLs canónicas desde `NEXT_PUBLIC_SITE_URL`.** `back_url = ${SITE_URL}/suscripcion/confirmar`, `notification_url = ${SITE_URL}/api/v1/payments/webhook`. Validar con `new URL()` en handler; si falta env, fallback a `https://gardenfoodv2.vercel.app`. Esto fija webhook para que MP notifique aunque el usuario cierre el checkout.

**D4 — Collector==payer guard.** Si `payer_email === collector_email` MP responde `400 collector cannot be same`. En TEST el collector es el dueño TEST; los test users creados por MP tienen email `test_user_...`. Guard: interceptar error `status 400` con string `collector` y devolver `400 {error:"Usa un email de prueba distinto..."}` + borrar draft; en prod no aplica (email cliente ≠ collector).

**D5 — CSP: no relajar, eliminar inline.** En lugar de añadir `script-src https://secure-fields.mercadopago.com unsafe-inline`, se elimina causa: 0 `next/script` MP, 0 `createPaymentBrick`. `layout.tsx` JSON-LD `type:application/ld+json` ya es nonce-compatible en Next. Tracking Prevention de Safari sobre recaptcha es aislado a `mp.mercadopago.com` checkout (tercero), no nuestra página; no bloquea el flujo.

**D6 — Recomendaciones como ruta autenticada `/recomendadas`.** Implementada como Server Component que lee `perfiles` (`region, comuna`) + `getZonaDeComuna` + `getEspeciesPorZona`; SSR cache `revalidate 0`. Alternativa de inyectar bloque en `/explorar` → descartada por gating (explorar es público, recomendadas es core de pago).

**D7 — Imágenes locales WebP via `sharp`.** Script `scripts/migrate-frutas-images.mjs` descarga 10 Wikimedia con `width=800`, convierte a `webp` 600px, mueve 20 locales, actualiza `especies.ts:imagen` a `/frutas/<slug>.webp`. `next.config.ts` `images: {formats:["image/webp"]}`; sin `remotePatterns`.

**D8 — Sitemap dinámico.** `app/sitemap.ts` importa `ESPECIES` y mapea `...ESPECIES.map(e=>({url:${SITE_URL}/especies/${e.slug}, priority:0.8}))`. Robots añade `recomendadas` y `suscripcion` a disallow.

**D9 — Split fichas.** `lib/agronomy/fichas/` → un archivo por `dbKey` (`duraznero.ts`, etc) + `index.ts` lazy `import()` usado solo en `especies/[slug]`. Landing `app/page.tsx` que solo necesita `FICHAS[dbKey].nc` para 8 items cambia a `especies.ts` `latino` opcional o fetch dinámico.

## Risks / Trade-offs

- **TEST vs PROD init_point:** `mercadopago.ts:145` `init_point` vs `sandbox_init_point` — en TEST debe devolver sandbox; si `MP_ACCESS_TOKEN` es PROD por error, redirige a prod y falla tarjeta de prueba → mitigar log `MP env TEST?` al arrancar route.
- **Webhook delay:** MP puede tardar minutos; usuario ve pending → mitigar con `subscribe/status` polling + botón "Re-verificar" en `/suscripcion/confirmar`.
- **Frecuencia 12 months rechazada por MP si monto no divisible:** MP puede exigir `frequency_type months=1` y `frequency 12`; si rechaza 12 por plan-less, fallback documentado: `frequency 12` es 12 cobros mensuales, no anual single-charge; si MP obliga single yearly charge, cambiar a `frequency 1, frequency_type years` con validación de monto trial → test en sandbox antes de merge.
- **Imágenes WebP: licencias Wikimedia CC:** Atribución requerida → mitigar `public/frutas/ATTRIBUTION.md` con URLs originales.
- **Navegación recomendadas gated:** free user redirigido a pricing puede confundir si llegó desde huerto → mitigar toast en pricing "desbloquea recomendadas".

## Migration Plan

1. Deploy cambio MP (no DB) → test sandbox con `test_user_*` email (no collector) → verificar `POST /api/v1/payments/subscribe` → seguir `init_point` → tarjeta TEST `5031755736641680` (MP docs `mastercard approved`) → `authorized` → webhook + `subscribe/status` → `perfiles.plan` cambia a tier.
2. Deploy imágenes + sitemap (estático, no migra).
3. Deploy `/recomendadas` + ficha tabs (SSR, requiere `getZonaDeComuna` existente).
4. Rollback: revertir `mercadopago.ts` frequency y URLs; no hay migración destructiva.

## Open Questions

- Anual como 12 cuotas vs 1 cobro anual único: MP permite ambos; el negocio definió anual = 10× mensual pagado en un solo cobro (ver `plans.ts:5`). Si el cliente quiere 12 cuotas separadas, el mapping cambia a 12 cargos mensuales descontados. Se resuelve con PO antes de merge (asunción actual: 1 cobro anual `frequency:12` es 12 meses trial? no, es recurrencia).
