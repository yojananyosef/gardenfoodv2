## Context

El root layout solo define `title` y `description`. Next.js 16 genera `<head>` a partir
del objeto `metadata` y de archivos de convención (`robots.ts`, `sitemap.ts`,
`opengraph-image`). No hay sitemap ni robots ni JSON-LD. Ver proposal.md.

## Goals / Non-Goals

**Goals:**
- Metadata social (OG/Twitter) global + imagen de marca.
- `/robots.txt` y `/sitemap.xml` generados por Next.
- JSON-LD en el root.

**Non-Goals:**
- Metadata por-ruta muy granular para contenido dinámico (se deja la base global;
  rutas específicas pueden extender después).
- Internacionalización/multiidioma (el sitio es es_CL).

## Decisions

- **metadata en root + `metadataBase`**: aplica OG/Twitter a todas las páginas; las
  sub-rutas heredan y pueden sobreescribir `title`/`description`.
- **`robots.ts` / `sitemap.ts`** en vez de archivos estáticos: Next los sirve en las
  rutas estándar y permiten usar `NEXT_PUBLIC_SITE_URL` para URLs absolutas.
- **OG image estática** (`/og.png` 1200x630) generada con sharp desde SVG de marca:
  fiable y sin costo de render en build (vs `ImageResponse` dinámico).
- **JSON-LD Organization** inline en el root layout vía `<script type="application/ld+json">`.

## Risks / Trade-offs

- [Risk] URLs absolutas incorrectas en sitemap/OG → Mitigation: `metadataBase` y
  `NEXT_PUBLIC_SITE_URL` definidos; fallback a la URL de Vercel.
- [Risk] Robots bloquee contenido que sí queremos indexar → Mitigation: solo se
  bloquean rutas privadas/API explícitas.

## Migration Plan

Sin migración de datos. Solo código + asset estático (`/og.png`). Desplegar en Vercel
y verificar `/robots.txt`, `/sitemap.xml`, y la presencia de OG en el `<head>`.

## Open Questions

- ¿Incluir rutas dinámicas de `/especies/[slug]` en el sitemap consultando la DB?
  (se deja como mejora; arranca con rutas estáticas públicas).
