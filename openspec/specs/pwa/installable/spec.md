# pwa/installable Specification

## Purpose
Makes GardenFood installable as a Progressive Web App: a valid web app manifest, branded icons and theme metadata so beta users can add it to their phone's home screen like a native app.

## Requirements

### Requirement: Web app manifest

The system SHALL expose a valid web app manifest declaring the app name, short name, description, start URL, display mode `standalone`, brand background color and theme color, and icons in 192×192 and 512×512 (including a maskable variant).

#### Scenario: Manifest is valid and served

- **WHEN** a browser requests the web app manifest
- **THEN** it receives a valid manifest with the required fields and icon references that resolve successfully

#### Scenario: Home screen install prompt

- **WHEN** a user on a supported browser visits the app
- **THEN** the browser can offer to install the app because the manifest requirements (name, icons, start_url, display) are satisfied

### Requirement: Brand icons

The system SHALL provide app icons in at least 192×192 and 512×512 plus a maskable variant, and an apple-touch-icon for iOS, using the GardenFood brand mark.

#### Scenario: Icons referenced by manifest resolve

- **WHEN** the manifest and page reference the app icons
- **THEN** all referenced icon URLs return valid image files

### Requirement: Branded theme metadata

The system SHALL declare the brand theme color and viewport metadata on the root layout so the app chrome (status bar on mobile) matches the brand.

#### Scenario: Mobile status bar matches brand

- **WHEN** the installed app runs on a mobile device
- **THEN** the browser chrome uses the declared theme color
