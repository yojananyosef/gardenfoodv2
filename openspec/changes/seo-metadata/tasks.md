## 1. Metadata global

- [ ] 1.1 Ampliar `metadata` en `app/layout.tsx`: `metadataBase`, `title.template`, `openGraph`, `twitter`, `robots`
- [ ] 1.2 Inyectar JSON-LD (Organization/WebSite) en el root layout

## 2. Robots y sitemap

- [ ] 2.1 Crear `app/robots.ts` (allow público, disallow `/api`, `/huerto`, `/perfil`, `/admin`, `/login`, `/registro`, sitemap ref)
- [ ] 2.2 Crear `app/sitemap.ts` con rutas públicas principales

## 3. Imagen OG de marca

- [ ] 3.1 Crear `scripts/og-source.svg` (brand 1200x630) y generador en `scripts/generate-og.mjs`
- [ ] 3.2 Generar `public/og.png` (1200x630) y referenciarlo en metadata

## 4. Configuración

- [ ] 4.1 Añadir `NEXT_PUBLIC_SITE_URL` a `.env.example`

## 5. Validación

- [ ] 5.1 `openspec validate seo-metadata` + typecheck + lint
- [ ] 5.2 `next build` y comprobar `/robots.txt`, `/sitemap.xml`, tags OG en `<head>`
- [ ] 5.3 Commit + push + `openspec archive seo-metadata`
