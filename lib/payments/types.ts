// Generic payment domain shared by all providers.
// Business models:
//   1. subscription -> user pays to use the app (future change)
//   2. sponsorship  -> sponsor pays for an ad slot (implemented now, Flow.cl)
//   3. data-powered sponsor ads -> targeting layer over sponsorships (future)
// Providers (Flow now, PayPal later) implement `PaymentProvider`.

export type PaymentKind = "sponsorship" | "subscription";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed";

export interface CreatePaymentInput {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}

export interface CreatePaymentResult {
  url: string;
  token: string;
  paymentId: string | number;
}

export interface PaymentStatusResult {
  status: number;
  paymentId?: string | number;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getStatus(token: string): Promise<PaymentStatusResult>;
  // Flow status codes: 1 pending, 2 paid, 3 declined, 4 annulled, 5 expired, 6 refunded.
  isPaid(status: number): boolean;
}
