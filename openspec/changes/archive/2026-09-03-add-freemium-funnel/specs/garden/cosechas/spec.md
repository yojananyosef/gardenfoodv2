## ADDED Requirements

### Requirement: Tier-gated achievements and production analytics
The system SHALL gate cosechas features by tier: achievements (`logros`) SHALL render only for paid tiers (Huertero or higher) and `admin`; production analytics (kg per species charts, season comparisons, export) SHALL render only for Cosecha or higher and `admin`. Gated blocks SHALL be omitted server-side and replaced by an upsell CTA to `/pricing`; premium data SHALL not be computed when access is denied. Harvest logging itself SHALL remain available to the free tier.

#### Scenario: Free user logs a harvest without achievements
- **WHEN** a free user adds a harvest record
- **THEN** the record is saved, but achievements and analytics blocks are not rendered and an upsell CTA is shown instead

#### Scenario: Huertero user sees achievements
- **WHEN** a Huertero user opens `/cosechas`
- **THEN** achievements render, but production analytics show the upsell CTA

#### Scenario: Cosecha user sees full analytics
- **WHEN** a Cosecha (or Full) user opens `/cosechas`
- **THEN** achievements and production analytics render without upsell
