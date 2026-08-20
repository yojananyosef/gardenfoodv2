## Purpose

Mejora el descubrimiento y el aspecto al compartir GardenFood: metadata Open Graph/Twitter, robots, sitemap, imagen OG de marca y datos estructurados JSON-LD.

## ADDED Requirements

### Requirement: Global social metadata
The system SHALL expose Open Graph and Twitter card metadata for all pages, including a branded OG image, resolved against `metadataBase`.

#### Scenario: Shared link renders a rich card
- **WHEN** a page URL is shared on a social network or messaging app
- **THEN** the crawler reads OG/Twitter tags with title, description, and the branded 1200x630 image

### Requirement: Machine-readable sitemap
The system SHALL serve a sitemap at `/sitemap.xml` listing the public routes of the site.

#### Scenario: Crawler fetches sitemap
- **WHEN** a search engine requests `/sitemap.xml`
- **THEN** it receives the public routes with their last-modified date and priority

### Requirement: Crawl rules
The system SHALL serve `/robots.txt` allowing crawling of public pages and disallowing private/API routes.

#### Scenario: Crawler reads robots
- **WHEN** a crawler requests `/robots.txt`
- **THEN** it receives allow rules for public routes and disallow for `/api`, `/huerto`, `/perfil`, `/admin`, `/login`, `/registro`, and references the sitemap

### Requirement: Structured data
The system SHALL embed JSON-LD structured data (Organization / WebSite) in the site's root.

#### Scenario: Page includes structured data
- **WHEN** any page is rendered
- **THEN** the HTML includes a valid JSON-LD script describing the GardenFood organization
