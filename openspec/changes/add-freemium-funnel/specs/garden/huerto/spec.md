## ADDED Requirements

### Requirement: Free tier crop limits
The system SHALL limit the free tier (`perfiles.plan = "gratuito"`) to 3 active crops (`gf_cultivos`) and 1 tree (`gf_arboles`), enforced in the server actions (`agregarCultivo`, `agregarArbol`) via pure helpers `puedeAgregarCultivo` / `puedeAgregarArbol` from `lib/payments/plans.ts`. Paid tiers and `admin` are unlimited. When the limit is reached the action SHALL reject with an upsell message and the huerto UI SHALL show usage counters and an upsell CTA to `/pricing`.

#### Scenario: Free user reaches the crop limit
- **WHEN** a free user with 3 active crops tries to add a fourth
- **THEN** the action rejects with an upsell message and the UI shows the `3/3` counter with a CTA to `/pricing`

#### Scenario: Free user within limits
- **WHEN** a free user with 1 crop adds a second
- **THEN** the crop is created normally and the counter shows `2/3`

#### Scenario: Paid user is unlimited
- **WHEN** a Huertero (or higher) user adds crops beyond the free limit
- **THEN** the action accepts without restriction
