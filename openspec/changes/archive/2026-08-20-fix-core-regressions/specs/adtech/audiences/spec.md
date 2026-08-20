## ADDED Requirements

### Requirement: Audience refresh resolves to a real, operational endpoint
The scheduled audience refresh SHALL target an endpoint that actually exists in the project and that re-runs the audience computation, instead of a localhost Edge Function that is not deployed. The refresh SHALL also be triggerable manually from the admin dashboard.

#### Scenario: Scheduled refresh hits a live endpoint
- **WHEN** the `pg_cron` job (migration 0007) fires
- **THEN** it posts to the project's real audience-refresh endpoint (e.g. `/api/v1/admin/audiences/refresh`) and updates `gf_user_audiences` for consented users

#### Scenario: Admin triggers refresh manually
- **WHEN** an admin clicks the refresh button in the audience explorer
- **THEN** the system runs the audience computation and reflects updated cohorts without requiring the cron job
