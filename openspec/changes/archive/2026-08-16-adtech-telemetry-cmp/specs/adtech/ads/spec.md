## Purpose

Provides native ad inventory for the platform — ad slot and sponsored banner components with impression/click tracking and administrator-managed sponsorship configuration, ready for future programmatic ad-network integration.

## ADDED Requirements

### Requirement: Native ad slot component

The system SHALL provide a native ad slot component that renders sponsored content in non-intrusive, app-consistent styling with touch targets of at least 48px, and SHALL report each impression to telemetry when the unit becomes visible to a consented user.

#### Scenario: Ad slot renders in feed

- **WHEN** a consented user scrolls an ad slot into view in the explore or garden screens
- **THEN** the slot renders the sponsored content styled consistently with the app and a `AD_IMPRESSION` event is recorded

#### Scenario: Ad slot click

- **WHEN** a user taps an ad slot
- **THEN** the system records an `AD_CLICK` event with the ad unit id and ad partner id and opens the sponsored destination

#### Scenario: No consent, no tracking

- **WHEN** the user has no consent for personalized advertising
- **THEN** the slot may render generic content but SHALL NOT record impressions or clicks attributed to that user's profile

### Requirement: Sponsored banner component

The system SHALL provide a sponsored banner component for placements such as the explore screen and garden dashboard, with the same impression/click tracking contract as ad slots.

#### Scenario: Banner impression

- **WHEN** a sponsored banner becomes visible to a consented user
- **THEN** the system records a `AD_IMPRESSION` event for that banner's ad unit and partner

### Requirement: Admin-managed sponsorship configuration

Administrators SHALL be able to configure sponsored placements — ad unit id, ad partner id, target screen and active status — without code changes, and the app SHALL render only active sponsorships.

#### Scenario: Admin activates a sponsorship

- **WHEN** an admin configures an active sponsorship for the explore screen
- **THEN** the explore screen renders the sponsored unit with the configured identifiers

#### Scenario: Admin deactivates a sponsorship

- **WHEN** an admin marks a sponsorship inactive
- **THEN** the app stops rendering that sponsored unit

### Requirement: Pluggable ad-partner contract

Ad slots SHALL carry an `ad_partner_id` so the inventory can be served by different partners (internal sponsorships or future ad networks) without changing the component contract.

#### Scenario: Partner identifiers attached to events

- **WHEN** an impression or click is recorded for an ad unit
- **THEN** the event includes both the ad unit id and the ad partner id that owns the placement