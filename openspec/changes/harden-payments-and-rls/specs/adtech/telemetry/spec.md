## MODIFIED Requirements

### Requirement: Telemetry storage access control
Telemetry events SHALL be insertable by any client only with `user_id` null (device-scoped events) or equal to the authenticated user's own id (`auth.uid()`); rows with a foreign `user_id` SHALL be rejected by RLS. Events SHALL be readable only by administrators.

#### Scenario: Open insert, restricted read

- **WHEN** any client submits a telemetry event and an admin later queries telemetry
- **THEN** the insert succeeds for the client and only administrators can read stored events; regular users cannot read other users' telemetry

#### Scenario: Attribution spoofing is rejected

- **WHEN** a client submits a telemetry event with a `user_id` different from its own authenticated identity
- **THEN** the database rejects the row and the ingestion returns an error
