## Why

GardenFood tiene metadata mínima (solo title/description en el root) y no genera
sitemap ni robots, por lo que las redes sociales no muestran tarjetas ricas al
compartir y los crawlers no descubren bien el sitio. Mejorar SEO/metadata aumenta
el descubrimiento orgánico (clave para un producto de huertos por comuna en Chile).

## What Changes

- Se añade `metadataBase` + Open Graph + Twitter cards a nivel global (root layout).
- Se genera `app/robots.ts` (allow público, disallow de rutas privadas/API).
- Se genera `app/sitemap.ts` con las rutas públicas principales.
- Imagen OG de marca (`/og.png`, 1200x630) generada y referenciada.
- Se inyecta JSON-LD (Organization / WebSite) en el root layout.
- Se documenta `NEXT_PUBLIC_SITE_URL` para resolver URLs absolutas.

## Capabilities

### New Capabilities
- `seo/metadata`: presencia y descubribilidad del sitio — metadata Open Graph/Twitter,
  robots, sitemap, imagen OG de marca y datos estructurados (JSON-LD).

### Modified Capabilities
<!-- sin capabilities existentes cuyo comportamiento (requirements) cambie a nivel spec -->

## Impact

- **Código**: `app/layout.tsx` (metadata ampliada + JSON-LD), nuevos `app/robots.ts`,
  `app/sitemap.ts`, `public/og.png`, script generador en `scripts/`.
- **Config**: variable `NEXT_PUBLIC_SITE_URL` en `.env.example`/Vercel.
- **Sin cambios de datos ni de API**.

## Assumptions

- URL del sitio: `https://gardenfoodv2.vercel.app` (o `NEXT_PUBLIC_SITE_URL`).
- Rutas privadas a bloquear en robots: `/api`, `/huerto`, `/perfil`, `/admin`,
  `/login`, `/registro`.
