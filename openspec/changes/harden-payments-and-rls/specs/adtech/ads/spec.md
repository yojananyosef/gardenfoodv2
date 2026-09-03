## MODIFIED Requirements

### Requirement: Admin-managed sponsorship configuration

Administrators SHALL be able to configure sponsored placements — ad unit id, ad partner id, target screen and active status — without code changes, and the app SHALL render only active sponsorships whose payment is settled: public (non-admin) reads SHALL only expose rows with `payment_status = 'paid'` and `active = true`; unpaid inventory, amounts in negotiation and provider tokens SHALL NOT be readable by clients holding the anon key. Admin surfaces (service role or `is_admin()`) keep full read/write.

#### Scenario: Admin activates a sponsorship

- **WHEN** an admin configures an active sponsorship for the explore screen
- **THEN** the explore screen renders the sponsored unit with the configured identifiers

#### Scenario: Admin deactivates a sponsorship

- **WHEN** an admin marks a sponsorship inactive
- **THEN** the app stops rendering that sponsored unit

#### Scenario: Unpaid inventory is not publicly readable

- **WHEN** a client holding only the anon key queries `gf_sponsorships`
- **THEN** only rows with `payment_status = 'paid'` and `active = true` are returned
