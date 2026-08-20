# pwa/offline-shell Specification

## Purpose
Registers a service worker that caches the app's navigation shell so the main routes can open without a connection and updates in the background once the network returns.

## Requirements

### Requirement: Service worker registration

The system SHALL register a service worker on the root layout so the offline shell activates on first visit.

#### Scenario: Service worker registered

- **WHEN** a user visits the app for the first time
- **THEN** the page registers the service worker and it becomes active for subsequent visits

### Requirement: Offline navigation shell

The system SHALL precache the main navigation routes (home, explorar, calculadoras, and, once authenticated, huerto, calendario, cosechas) so they render without a network connection, using a network-first strategy that falls back to cache.

#### Scenario: Main route opens offline

- **WHEN** a returning user opens a precached route without connectivity
- **THEN** the route renders from the cache

#### Scenario: Fresh content preferred when online

- **WHEN** a user opens a route with connectivity
- **THEN** the service worker serves the network response and updates the cache in the background

### Requirement: Cache versioning

The system SHALL version the cache and clean up stale versions on activation so users never see a broken mix of old and new assets after a deploy.

#### Scenario: New deploy invalidates old cache

- **WHEN** a new version of the app is deployed and the new service worker activates
- **THEN** the old caches are deleted and the new cache is used

### Requirement: Degradation without cache

The system SHALL handle requests that are not in the cache gracefully, returning a fallback page instead of a broken screen.

#### Scenario: Non-cached route offline

- **WHEN** a user opens a route that was not precached while offline
- **THEN** the service worker serves a fallback page rather than an error
