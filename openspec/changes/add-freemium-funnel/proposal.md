# add-freemium-funnel

## Why

El funnel actual contradice la promesa del landing: dice "Crear mi huerto gratis · Gratis para siempre · Sin tarjeta" pero `proxy.ts` redirige a `/pricing` a cualquier usuario gratuito que entra a `/huerto`, `/calendario`, `/cosechas` o `/recomendadas` — el registro completo termina en un rebote inmediato al paywall. Además el usuario anónimo puede usar calculadoras y ver las 30 fichas sin registrarse, perdiendo el gancho de conversión. Se necesita un funnel de 3 capas (anónimo → registrado gratuito → pago) coherente entre landing, onboarding, gating y copy.

## What Changes

- **Capa anónima (nueva)**: anónimo ve landing, `/explorar` con las 30 especies (solo `duraznero` desbloqueada, las otras 29 con candado), la ficha completa del duraznero y pricing. `/calculadoras` y rutas core → redirect a `/registro?next=<path>`. Las 29 fichas bloqueadas se renderizan completas server-side (SEO/sitemap intacto) con lock overlay + teaser + CTA de registro.
- **Capa gratuita registrada (Modelo A — freemium real)**: acceso real a core con límites: máx 3 cultivos, máx 1 árbol, anuncios visibles, sin logros ni analítica de producción. Ya no hay redirect a `/pricing` por plan en core.
- **Capa paga (sin cambios de precios)**: Huertero = ilimitado + sin anuncios + logros; Cosecha = + analítica/comparativas/export; Full = + equipo. Pagos vía Mercado Pago igual que hoy.
- **Registro honra `?next=`** (hoy hardcodea `/huerto`), para que el usuario vuelva a donde iba.
- **Copy honesta**: landing ("Empieza gratis"), tarjeta "Gratis" en pricing, `/suscripcion/confirmar` deja de prometer "14 días gratis" (el trial está deshabilitado).
- **Gating `/admin` en proxy** por `isAdmin` (defensa en profundidad; hoy cualquier usuario pago pasa hasta que la página lo bloquea).

## Capabilities

### Modified Capabilities

- `payments/subscription`: el requirement de gating por plan se reemplaza por gating de 3 capas (anónimo/gratuito/pago) con escenarios para calculadoras, catálogo con muestra gratuita y acceso core del tier gratuito.
- `garden/agronomy-data`: ADDED — muestra gratuita del catálogo: solo `duraznero` con ficha íntegra para anónimos; el resto renderiza bloqueado con contenido server-side para SEO.
- `garden/huerto`: ADDED — límites del tier gratuito (3 cultivos, 1 árbol) con mensaje de upsell al superarlos.
- `garden/cosechas`: ADDED — logros y analítica de producción gated por tier (Huertero+ / Cosecha+).

## Impact

- **Código**: `proxy.ts`, `lib/payments/plans.ts`, `lib/agronomy/index.ts`, `lib/huerto/actions.ts`, `app/(auth)/registro/page.tsx`, `app/(public)/especies/[slug]/page.tsx`, `app/(public)/explorar/page.tsx`, `app/(public)/pricing/page.tsx`, `app/page.tsx`, `app/(dashboard)/cosechas/page.tsx`, `app/(dashboard)/suscripcion/confirmar/page.tsx`, componentes de ficha/explorar/huerto.
- **Tests**: helpers puros de límites y gating (hoy el gating tiene cero tests).
- **Sin cambios de DB ni migraciones** (los límites se validan en server actions leyendo `perfiles.plan`).
- **No toca**: seguridad de pagos (self-upgrade vía polling, webhook sin firma, RLS `perfiles.plan`) — queda para la fase P0 posterior.
