# GardenFood V2

Plataforma SaaS de agronomía doméstica para Chile: 245 comunas (canónico migrado a 254 en spec), 16 regiones y 20 zonas agroclimáticas, con catálogo de 30 especies frutales y 30 fichas técnicas. Ayuda a usuarios a saber **qué cultivar en su zona y cuándo podar, regar y qué fertilizante necesita su tierra**.

## Modelo de negocio híbrido

1. **Suscripciones recurrentes** — **Mercado Pago** único proveedor (hosted `init_point` via `POST /preapproval` plan-less, `frequency:1|12 months`, trial 14d). Flow/PayPal descartados. Ver `lib/payments/mercadopago.ts:55` y `app/api/v1/payments/subscribe`.
2. **Motor de datos Ad-Tech & Data Brokerage B2B** — inspirado en Fastic: ingesta de micro-eventos, dwell time, geolocalización híbrida y plataforma de consentimiento CMP estilo IAB TCF (vigencia 390 días). Perfilado automático de audiencias comerciales para venta a marcas.
3. **Consumo Multi-Cliente** — Supabase desacoplado y Route Handlers `/api/v1/...` preparados para Web y futura app React Native / Expo.

> Nota de paridad legacy: vista `resultados.html` (recomendadas por zona si/riesgo/no) restaurada en `/recomendadas`; fichas con 9 tabs (incluye Fenología/Consejos/Info + imagen `/frutas/*.webp` local sin Wikimedia 429); `gf_economia` eliminado intencionalmente (0 registros históricos, planificador financiero no portado); `fichas.ts` monolítico pendiente de split por especie.

## Stack

- **Core**: Next.js 16 (App Router, Server Components, Route Handlers, Turbopack)
- **Lenguaje**: TypeScript estricto (`strict: true`), cero `any`
- **UI/UX**: Tailwind CSS v4, shadcn/ui (Base UI), Lucide Icons — mobile-first
- **Base de datos & Auth**: Supabase PostgreSQL con RLS, Supabase Auth
- **Validación**: Zod v4 (esquemas estrictos)
- **Gestor de paquetes**: pnpm
- **Tests**: Vitest

## Estructura

```
├── app/
│   ├── (auth)/            # login, registro (flujo con modal CMP)
│   ├── (dashboard)/       # huerto, calendario, cosechas, calculadoras, perfil, admin/
│   ├── (public)/          # landing, explorar, especies/[slug], planes
│   └── api/v1/            # telemetry, cmp/consent, admin/*
├── components/
│   ├── cmp/               # ConsentModal, ConsentPreferences
│   ├── ads/               # NativeAdSlot, SponsoredBanner
│   ├── analytics/         # TelemetryProvider
│   └── ui/                # shadcn/ui
├── lib/
│   ├── telemetry/         # tracker, device, geo, audiences, refresh
│   ├── consent/           # token local, schemas
│   ├── supabase/          # client, server, admin
│   └── ads/               # sponsorships
├── hooks/                 # useDwellTime, useScrollDepth, useTrackedView, useAdTracking
├── supabase/migrations/   # esquema + RLS + pg_cron
├── types/                 # contratos compartidos (Web + App Móvil)
└── tests/                 # unit tests (Vitest)
```

## Empezar

```bash
pnpm install
pnpm dev
```

Configura las variables en `.env` (ver `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=            # opcional: secreto para el cron de audiencias
IPGEO_URL=              # opcional: servicio de geolocalización por IP
MP_ACCESS_TOKEN=        # TEST-... en sandbox, APP_USR-... en prod (Mercado Pago)
MP_WEBHOOK_SECRET=      # x-signature HMAC de webhooks MP
MP_COLLECTOR_EMAIL=     # opcional: guard collector==payer en TEST
NEXT_PUBLIC_SITE_URL=   # https://gardenfoodv2.vercel.app
```

Usa un email de prueba `test_user_...@testuser.com` distinto al collector de tu cuenta MP. Flow/PayPal no se usan.

### Mercado Pago — flujo hosteado (sin Bricks/CSP)

- `POST /api/v1/payments/subscribe {tier,interval}` crea draft `gf_subscriptions` + `POST /preapproval` con `auto_recurring` inline y devuelve `init_point` para `window.location.href`.
- El usuario paga allí (tarjeta TEST `5031755736641680` `123` `11/30`); MP llama `POST /api/v1/payments/webhook` con `x-signature` (`ts`/`v1` sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`) y el server hace `GET /preapproval/{id}` → `perfiles.plan`.
- Si el webhook demora, `/suscripcion/confirmar` hace `POST /api/v1/payments/subscribe/status` (poll idempotente). **No uses Bricks** (`sdk.mercadopago.com`/`secure-fields`) — da `fontSize string / No length` + CSP `nonce strict-dynamic` y 404 `Card token service`.
- Imágenes de frutas ahora en `public/frutas/*.webp` (ver `ATTRIBUTION.md`), `next.config.ts` `images.formats webp`.

### Base de datos

Las migraciones de Supabase viven en `supabase/migrations/`:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Incluyen: `perfiles`, `gf_user_consents` (CMP, expiración 390 días), `gf_analytics_events` (telemetría con índices analíticos), `gf_user_audiences` (perfiles comerciales), `gf_sponsorships` (inventario publicitario), políticas RLS y un job `pg_cron` que refresca las audiencias cada 6 horas (`/api/v1/admin/audiences/refresh`).

## Scripts

| Comando           | Descripción                              |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Servidor de desarrollo (Turbopack)       |
| `pnpm build`      | Build de producción                      |
| `pnpm lint`       | ESLint                                   |
| `pnpm typecheck`  | TypeScript estricto (`tsc --noEmit`)     |
| `pnpm test`       | Tests unitarios (Vitest)                 |

## Privacidad y consentimiento

La telemetría solo se captura con consentimiento válido (390 días, renovable desde "Ajustes de privacidad"). El consentimiento es granular: publicidad personalizada, geolocalización precisa, compartición con terceros y vinculación de dispositivos, más oposición al interés legítimo. La ingesta es no bloqueante (`sendBeacon` / `fetch keepalive`) y las lecturas quedan restringidas a administradores vía RLS.