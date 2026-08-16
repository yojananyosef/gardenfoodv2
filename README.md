# GardenFood V2

Plataforma SaaS de agronomía doméstica para Chile: 208 comunas, 16 regiones y 20 zonas agroclimáticas, con catálogo de 30 especies frutales. Ayuda a usuarios a saber **cuándo podar, regar y qué fertilizante necesita su tierra**.

## Modelo de negocio híbrido

1. **Suscripciones recurrentes** — Flow.cl (Webpay) y PayPal (internacional). *(en planificación)*
2. **Motor de datos Ad-Tech & Data Brokerage B2B** — inspirado en Fastic: ingesta de micro-eventos, dwell time, geolocalización híbrida y plataforma de consentimiento CMP estilo IAB TCF (vigencia 390 días). Perfilado automático de audiencias comerciales para venta a marcas.
3. **Consumo Multi-Cliente** — Supabase desacoplado y Route Handlers `/api/v1/...` preparados para Web y futura app React Native / Expo.

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
```

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