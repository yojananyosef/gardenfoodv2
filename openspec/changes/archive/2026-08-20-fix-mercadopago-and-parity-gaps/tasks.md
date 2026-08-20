## 1. Pagos — Mercado Pago hosteado (sanity + fix anual)

- [x] 1.1 `lib/payments/mercadopago.ts:55` — Cambiar yearly a `frequency:12, frequency_type:"months"` (no `years`), mensual `1,months`; validar que `transaction_amount` es CLP entero y `free_trial:{frequency:14, frequency_type:"days"}` solo si `freeTrialDays`. Añadir log `TEST env?` si token inicia con `TEST-`.
- [x] 1.2 `lib/payments/mercadopago.ts:55` — Centralizar `back_url` y `notification_url` con `new URL(NEXT_PUBLIC_SITE_URL)` + fallback `https://gardenfoodv2.vercel.app`; lanzar 500 si URL inválida en runtime. Asegurar que `createSubscription` siempre envía ambos.
- [x] 1.3 `app/api/v1/payments/subscribe/route.ts:34` — Interceptar error 400 con `collector` en mensaje MP y devolver `400 {error:"Usa un email de prueba distinto al de tu cuenta de Mercado Pago. Crea un test_user en dashboard MP"}` y borrar draft `gf_subscriptions`. Mapear otros errores a 502 con `Could not create subscription`.
- [x] 1.4 `app/api/v1/payments/subscribe/route.ts:66` — Validar `payerEmail` existe y es distinto de `process.env.MP_COLLECTOR_EMAIL` si se declara; pasar `reason` con tier+interval visible en dashboard MP.
- [x] 1.5 `app/api/v1/payments/webhook/route.ts:84` — Documentar y testear firma `x-signature` (`ts`/`v1` sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`); cuando `MP_WEBHOOK_SECRET` no está, warn pero no bloquear. Añadir caso `pending→trialing` explícito en `mapSubscriptionStatus`.
- [x] 1.6 `app/api/v1/payments/subscribe/status/route.ts:9` — Asegurar mapping `authorized→active` activa `perfiles.plan=tier`, `cancelled→gratuito`; añadir retry idempotente si `status` es `pending` tras volver de checkout.
- [x] 1.7 `app/(dashboard)/suscripcion/confirmar/page.tsx:17` — Añadir botón "Re-verificar" que re-llama `subscribe/status` + estado `trialing→active` polling (30s), y manejar `grantsAccess` false con CTA a soporte.

## 2. Pagos — Limpieza CSP/Bricks

- [x] 2.1 Eliminar cualquier `next/script` que cargue `https://sdk.mercadopago.com` o `secure-fields.mercadopago.com`, y todo `paymentBrick_container` / `createPaymentBrick` legacy. Verificar `grep -r mercadoPago` solo aparece en server `lib/payments/*`.
- [x] 2.2 Verificar `app/layout.tsx:25` JSON-LD y `next.config.ts:3` no necesitan `headers()` CSP custom; documentar que hosted redirect evita `script-src nonce strict-dynamic` y errores `fontSize string / No length configuration / invalid property settings for expirationDate`.
- [x] 2.3 `.env.example:9` — Eliminar `NEXT_PUBLIC_MP_PUBLIC_KEY` (era Bricks) y `FLOW_*`; documentar `MP_ACCESS_TOKEN` (TEST), `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- [x] 2.4 `lib/payments/plans.ts:5` — Añadir comentario `yearly = 10× monthly via 12× months` y helper `describeInterval(interval)`.

## 3. Agronomy data — comunas e imágenes

- [x] 3.1 Confirmar `lib/agronomy/comunas.ts:9` y `zonas.ts:272` en 254 comunas; actualizar `openspec/specs/garden/agronomy-data/spec.md` docs y `README.md:5` de 208→254.
- [x] 3.2 `scripts/migrate-frutas-images.mjs` — Descargar 10 Wikimedia (`frutilla`→`palto` `especies.ts:395`) con `fetch` + `sharp` a `webp` 600px `public/frutas/<slug>.webp`; copiar 20 locales `legacy/Gardenfood/ASSETS/IMG/frutas/*` a `public/frutas/`, generar `public/frutas/ATTRIBUTION.md`. Actualizar `especies.ts:35` `imagen:"/frutas/<slug>.webp"` (no `ASSETS/IMG`).
- [x] 3.3 `next.config.ts:3` — Añadir `images: { formats:["image/webp"], unoptimized:false }` y eliminar cualquier `remotePatterns` a Wikimedia.
- [x] 3.4 `lib/agronomy/fichas.ts:1` — Splitear en `lib/agronomy/fichas/<slug>.ts` + `lib/agronomy/fichas/index.ts` con `export async function getFicha(dbKey)` dinámico; `app/page.tsx:6` no importa `FICHAS` completo para los 8 destacados.

## 4. Recomendaciones por zona

- [x] 4.1 Crear ruta `app/(dashboard)/recomendadas/page.tsx` (Server Component) que lee `supabase.auth.getUser` → `getPerfil` → `getZonaDeComuna` → `getEspeciesPorZona(zonaId)` y renderiza 3 secciones `si/riesgo/no` con `viabRazon`, card linking a `/especies/[slug]`. Estado vacío si sin comuna.
- [x] 4.2 `components/recomendaciones/RecomendacionesView.tsx` — Cards con badge verde/ámbar/gris, razón técnica en tooltip, filtro por grupo opcional, y CTA a `/perfil` si falta comuna.
- [x] 4.3 `proxy.ts:20` — Añadir `/recomendadas` a `esRutaProtegida` y a gating core (free→`/pricing`, admin pasa). `components/layout/BottomNav.tsx:1` + `app/(dashboard)/layout.tsx:1` añadir tab "Recomendadas" (icon `MapPinned`/`Sprout`).
- [x] 4.4 `app/(dashboard)/huerto/page.tsx:52` — Añadir card "Recomendadas para tu zona" con link a `/recomendadas` y contador `si.length/riesgo.length/no.length`.

## 5. Ficha de especie — completar tabs faltantes

- [x] 5.1 `components/especies/FichaEspecieView.tsx:12` — Añadir tabs `Fenología` (usa `getFenologia(dbKey,zonaId)` + `lib/agronomy/fenologia.ts`), `Consejos` (`CONSEJOS[dbKey]`) e `Info` (`desc` botánica + `ZONAS[zonaId]` climate). Mantener 6 tabs actuales y añadir 3 → total 9 igual legacy `ficha.html:182`.
- [x] 5.2 Renderizar `especie.imagen` (`/frutas/<slug>.webp`) con `next/image` 400px, fallback `og.png` si falta.
- [x] 5.3 Tests `tests/agronomy.test.ts:1` — Añadir casos `getEspeciesPorZona(7)` devuelve 30 clasificados y `buscarComuna("La Florida")→zonaId 8`.

## 6. SEO — sitemap/robots

- [x] 6.1 `app/sitemap.ts:7` — Importar `ESPECIES` y generar `...ESPECIES.map(e=>({url:${SITE_URL}/especies/${e.slug}, lastModified, priority:0.8}))` + entradas estáticas `/:1, /explorar:0.7, /calculadoras:0.7, /pricing:0.7`; excluir todo `huerto|calendario|cosechas|recomendadas|perfil|admin|suscripcion|login|registro|api`.
- [x] 6.2 `app/robots.ts:11` — `disallow:["/api/","/huerto","/calendario","/cosechas","/recomendadas","/perfil","/admin","/login","/registro","/suscripcion/"]`, `allow:"/"`, `sitemap:${SITE_URL}/sitemap.xml`.
- [x] 6.3 Smoke test `pnpm build && curl /sitemap.xml` verifica 34 URLs, y `curl /robots.txt` contiene `recomendadas`.

## 7. Validación y docs

- [x] 7.1 `scripts/test-mercadopago-subscription.mjs` — E2E sandbox: crear `test_user` vía MP API (email no collector) → `POST /api/v1/payments/subscribe {tier,interval}` con cookie auth → seguir `init_point` → pagar con tarjeta TEST `5031755736641680` + `123` + `11/30` → poll `subscribe/status` → assert `perfiles.plan` cambia.
- [x] 7.2 `README.md:5` + `openspec/specs/garden/agronomy-data/spec.md:28` — Actualizar 208→254, documentar que Pagos es solo Mercado Pago hosteado (no Bricks), y que `gf_economia` fue dropeado intencionalmente.
- [x] 7.3 `pnpm typecheck && pnpm lint --fix && pnpm test` verde; `pnpm build` sin errores CSP. Archivar `openspec archive fix-mercadopago-and-parity-gaps`.
