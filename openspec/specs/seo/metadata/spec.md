# seo/metadata Specification

## Purpose
Mejora el descubrimiento y el aspecto al compartir GardenFood: metadata Open Graph/Twitter, robots, sitemap, imagen OG de marca y datos estructurados JSON-LD.

## Requirements

### Requirement: Global social metadata
The system SHALL expose Open Graph and Twitter card metadata for all pages, including a branded OG image, resolved against `metadataBase`.

#### Scenario: Shared link renders a rich card
- **WHEN** a page URL is shared on a social network or messaging app
- **THEN** the crawler reads OG/Twitter tags with title, description, and the branded 1200x630 image

### Requirement: Machine-readable sitemap
The system SHALL serve a sitemap at `/sitemap.xml` listing the **public routes of the site including the 30 species sheets**. The sitemap SHALL include `/`, `/explorar`, `/calculadoras`, `/pricing` and each `/especies/<slug>` (30 entries) with `lastModified` and `priority` (species 0.8, index 1.0, others 0.7), and SHALL exclude private/gated routes `/huerto`, `/calendario`, `/cosechas`, `/recomendadas`, `/perfil`, `/admin`, `/login`, `/registro`, `/api/**` and `/suscripcion/**`.

#### Scenario: Crawler fetches sitemap
- **WHEN** a search engine requests `/sitemap.xml`
- **THEN** it receives the 34 public URLs (4 + 30 species) with their last-modified date and priority, and no private URLs

### Requirement: Crawl rules
The system SHALL serve `/robots.txt` allowing crawling of public pages and disallowing private/API routes, and referencing the sitemap.

#### Scenario: Crawler reads robots
- **WHEN** a crawler requests `/robots.txt`
- **THEN** it receives `Allow: /`, `Disallow: /api/`, `/huerto`, `/calendario`, `/cosechas`, `/recomendadas`, `/perfil`, `/admin`, `/login`, `/registro`, `/suscripcion/` and `Sitemap: ${SITE_URL}/sitemap.xml`

### Requirement: Structured data
The system SHALL embed JSON-LD structured data (Organization / WebSite) in the site's root.

#### Scenario: Page includes structured data
- **WHEN** any page is rendered
- **THEN** the HTML includes a valid JSON-LD script describing the GardenFood organization
