## ADDED Requirements

### Requirement: Muestra gratuita del catálogo
The system SHALL expose `duraznero` as the free catalog sample (`ESPECIE_MUESTRA_GRATIS`) and a pure helper `esMuestraGratuis(slug)`. Anonymous visitors SHALL be able to open the sample's full technical ficha; every other species SHALL be presented as locked (visual lock + upsell CTA) while the underlying content remains server-rendered for SEO.

#### Scenario: Sample constant resolves
- **WHEN** any caller checks `esMuestraGratuis("duraznero")`
- **THEN** it returns `true`, and any other slug returns `false`

#### Scenario: Locked species keep SEO rendering
- **WHEN** a locked species page is requested
- **THEN** the response HTML contains the full ficha content regardless of the locked presentation
