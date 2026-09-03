## ADDED Requirements

### Requirement: Profile plan columns are server-managed
The database SHALL prevent authenticated users from changing their own `plan`, `subscription_status`, `subscription_id` or `payment_provider` on `perfiles` (trigger `guarda_columnas_plan_perfiles` rejecting the UPDATE); plan changes SHALL only happen through the service role (payment webhook/status, admin API). Regular profile fields (location, terreno, nombre) remain user-editable, and `perfiles.plan` SHALL remain the single trust source for `isAdmin()` and admin route gating.

#### Scenario: Self-service admin escalation is rejected

- **WHEN** an authenticated user updates their own profile row setting `plan = 'admin'`
- **THEN** the database raises an exception and the plan stays unchanged

#### Scenario: Server-side plan change still works

- **WHEN** the payment webhook or an admin API updates `perfiles.plan` via the service role
- **THEN** the update succeeds
