## Purpose

Cobra patrocinaciones de GardenFood con Flow.cl (pasarela chilena, CLP) y activa la campaña solo tras confirmar el pago firmado por Flow, dejando preparado un conector PayPal para pagos internacionales.

## ADDED Requirements

### Requirement: Create Flow payment order
The system SHALL create a Flow.cl payment order for a pending sponsorship and return the redirect URL to Flow's hosted payment page.

#### Scenario: Successful order creation
- **WHEN** an authenticated user requests checkout for a sponsorship in `pending` or `draft` state
- **THEN** the system creates a Flow payment order for the sponsorship amount (CLP) and returns a `redirect_url` and `token`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to create the Flow order is made without a valid session
- **THEN** the system returns 401 and creates no order

### Requirement: Confirm payment via Flow webhook
The system SHALL verify the Flow webhook signature, consult `payment/getStatus`, and on confirmed payment mark the matching sponsorship as paid and active.

#### Scenario: Valid confirmed payment
- **WHEN** Flow sends a confirmation for a known `token`/`commerceOrder` with a valid signature and `getStatus` reports paid
- **THEN** the system sets `payment_status` to `paid`, records `flow_payment_id` and `paid_at`, and activates the campaign

#### Scenario: Invalid signature is rejected
- **WHEN** a webhook request has an invalid or missing Flow signature
- **THEN** the system returns 400 and makes no change to any sponsorship

### Requirement: Idempotent webhook handling
The system SHALL process each Flow confirmation at most once, keyed by the Flow `token` or `commerceOrder`.

#### Scenario: Duplicate confirmation
- **WHEN** the same Flow confirmation is delivered more than once
- **THEN** the sponsorship is updated only once and no duplicate side effects occur

### Requirement: Payment failure and pending handling
The system SHALL keep the sponsorship non-active when Flow reports a failed or still-pending payment.

#### Scenario: Pending payment
- **WHEN** Flow reports the payment is still pending
- **THEN** the sponsorship remains in `pending` and is not activated

#### Scenario: Failed payment
- **WHEN** Flow reports a failed payment
- **THEN** the sponsorship is not activated and its `payment_status` reflects the failure
