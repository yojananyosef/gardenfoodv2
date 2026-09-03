// Generic payment domain shared by all providers.
// Business models:
//   1. subscription -> user pays to use the app (modelo 1, Mercado Pago)
//   2. sponsorship  -> sponsor pays for an ad slot (modelo 2, Mercado Pago)
//   3. data-powered sponsor ads -> targeting layer over sponsorships (modelo 3)
// A single provider (Mercado Pago) implements `PaymentProvider`.
//
// Recurring subscriptions use Mercado Pago Subscriptions. We create a
// `pending` preapproval (no plan reference; recurrence is inline in
// auto_recurring) and redirect the user to its hosted checkout (init_point),
// where Mercado Pago tokenizes the card. We link the resulting preapproval back
// to the user via external_reference in the webhook. A card_token_id created
// through the raw API cannot be used for /preapproval — Mercado Pago must
// tokenize the card inside its own checkout.

export type PaymentKind = "sponsorship" | "subscription";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "canceled"
  | "past_due";

// --- One-time payment (Mercado Pago Checkout Pro) ---

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  description: string;
  externalReference: string;
  payerEmail: string;
  backUrls: { success: string; failure: string; pending: string };
  notificationUrl: string;
}

export interface CreatePaymentResult {
  token: string; // preference id
  url: string; // init_point (production)
  sandboxUrl?: string; // sandbox_init_point (test credentials)
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  paymentId?: string;
  raw?: unknown;
}

// --- Subscription (Mercado Pago Subscriptions) ---
// We create a `pending` preapproval with inline auto_recurring and redirect the
// user to Mercado Pago's hosted checkout (init_point), where the card is
// tokenized. The webhook links it back via external_reference.

export interface CreateSubscriptionInput {
  externalReference: string; // our gf_subscriptions draft id
  payerEmail: string;
  reason: string;
  transactionAmount: number; // CLP, integer
  interval: "monthly" | "yearly";
  backUrl: string;
  freeTrialDays?: number;
}

export interface CreateSubscriptionResult {
  subscriptionId: string; // preapproval id
  url: string; // init_point (hosted checkout to redirect the user to)
}

export interface SubscriptionStatusResult {
  status: "pending" | "authorized" | "cancelled" | "paused";
  periodEnd?: string;
  cancelAt?: string;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getStatus(paymentId: string): Promise<PaymentStatusResult>;
  isPaid(status: PaymentStatus): boolean;
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult>;
  getSubscriptionStatus(
    subscriptionId: string,
  ): Promise<SubscriptionStatusResult>;
}
