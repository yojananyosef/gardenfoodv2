# Garden Auth

## Purpose

Enables existing users to sign in and sign out of the application and protects dashboard routes so the personal modules are only reachable with an authenticated session.

## ADDED Requirements

### Requirement: Sign in with email and password

The system SHALL allow an existing user to sign in with email and password, and on success establish a session that grants access to the dashboard.

#### Scenario: Valid credentials

- **WHEN** a user submits valid email and password
- **THEN** the system authenticates the user, establishes a session and redirects to the huerto dashboard

#### Scenario: Invalid credentials

- **WHEN** a user submits invalid email or password
- **THEN** the system shows a clear error message and keeps the user on the sign-in page

#### Scenario: Sign in errors are human readable

- **WHEN** authentication fails for any reason (wrong password, unconfirmed email, network error)
- **THEN** the system shows a localized, human-readable error message instead of a raw API error

### Requirement: Sign out

The system SHALL allow an authenticated user to sign out, which terminates the session and returns the user to the public home page.

#### Scenario: User signs out

- **WHEN** an authenticated user triggers sign out
- **THEN** the session is terminated and the user is redirected to the home page

### Requirement: Protected dashboard routes

The system SHALL redirect unauthenticated users away from dashboard routes and redirect authenticated users away from auth-only pages.

#### Scenario: Unauthenticated user opens a dashboard route

- **WHEN** a user without a session opens any route under the dashboard
- **THEN** the system redirects them to the sign-in page

#### Scenario: Authenticated user opens the sign-in page

- **WHEN** an authenticated user opens the sign-in or sign-up page
- **THEN** the system redirects them to the huerto dashboard

### Requirement: New user profile creation

The system SHALL create a profile record in the `perfiles` table when a user signs up, including email, name, region, commune and agroclimatic zone.

#### Scenario: Profile created on sign up

- **WHEN** a new user completes sign up
- **THEN** the system creates the corresponding profile record and the user is treated as authenticated