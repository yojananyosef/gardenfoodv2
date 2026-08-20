// Mercado Pago payment provider.
// Docs: https://www.mercadopago.com/developers/es/reference
//   - One-time:   POST /checkout/preferences        -> init_point
//   - Recurring:  POST /preapproval_plan (plan) -> init_point (hosted checkout)
//   - Webhooks:   GET /v1/payments/{id} | /preapproval/{id} | /authorized_payments/{id}
// Auth is Bearer ACCESS_TOKEN (no HMAC signing needed).

import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  PaymentProvider,
  PaymentStatus,
  PaymentStatusResult,
  SubscriptionStatusResult,
} from "./types";

const MP_API = "https://api.mercadopago.com";

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN is not configured");
  return t;
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const err = data as { message?: string; error?: string } | undefined;
    const message =
      err?.message ?? err?.error ?? `Mercado Pago request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

// Yearly = 10× monthly paid in 12× monthly charges (see plans.ts / subscription spec).
// Monthly = 1× months. Legacy used years+1 which MP sandbox rejects for plan-less preapprovals.
// Creates a `pending` subscription (preapproval) with inline recurrence and
// returns its hosted-checkout init_point. Mercado Pago tokenizes the card inside
// that checkout; the webhook then links it back via external_reference.
export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<CreateSubscriptionResult> {
  const t = process.env.MP_ACCESS_TOKEN ?? "";
  if (t.startsWith("TEST-")) {
    console.log("[mercadopago] using TEST token, payer:", input.payerEmail);
  } else if (t.startsWith("APP_USR-")) {
    console.warn("[mercadopago] using PROD token - sandbox cards will fail");
  }

  if (!Number.isInteger(input.transactionAmount) || input.transactionAmount <= 0) {
    throw new Error("transaction_amount must be positive integer CLP");
  }

  // Canonical URLs — always validated via new URL()
  const siteUrlRaw =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app").replace(/\/$/, "");
  let siteUrl: URL;
  try {
    siteUrl = new URL(siteUrlRaw);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: ${siteUrlRaw}`);
  }
  const notificationUrl = `${siteUrl.origin}/api/v1/payments/webhook`;
  let backUrl = input.backUrl;
  try {
    new URL(backUrl);
  } catch {
    backUrl = `${siteUrl.origin}/suscripcion/confirmar`;
  }

  const isYearly = input.interval === "yearly";
  const data = await mpFetch<{
    id: string;
    init_point: string;
    sandbox_init_point?: string;
  }>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      notification_url: notificationUrl,
      auto_recurring: {
        frequency: isYearly ? 12 : 1,
        frequency_type: "months",
        transaction_amount: input.transactionAmount,
        currency_id: "CLP",
        ...(input.freeTrialDays
          ? { free_trial: { frequency: input.freeTrialDays, frequency_type: "days" } }
          : {}),
      },
      back_url: backUrl,
      status: "pending",
    }),
  });
  return {
    subscriptionId: data.id,
    // In TEST mode MP returns sandbox_init_point; prefer it for testing but init_point also works with TEST token.
    url: (data as { sandbox_init_point?: string }).sandbox_init_point ?? data.init_point,
  };
}

// Returns the preapproval id linked to an authorized (recurring) payment.
export async function getAuthorizedPayment(
  authorizedPaymentId: string,
): Promise<{ preapprovalId: string; status: string }> {
  const data = await mpFetch<{ preapproval_id?: string; status?: string }>(
    `/authorized_payments/${authorizedPaymentId}`,
  );
  return {
    preapprovalId: data.preapproval_id ?? "",
    status: data.status ?? "pending",
  };
}

function mapPaymentStatus(mp: string): PaymentStatus {
  switch (mp) {
    case "approved":
      return "paid";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "rejected":
    case "cancelled":
    case "expired":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

function mapSubscriptionStatus(
  mp: string,
): SubscriptionStatusResult["status"] {
  switch (mp) {
    case "authorized":
      return "authorized";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";

  async createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult> {
    const data = await mpFetch<{
      id: string;
      init_point: string;
      sandbox_init_point?: string;
    }>("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            id: input.externalReference,
            title: input.description,
            quantity: 1,
            currency_id: input.currency,
            unit_price: input.amount,
          },
        ],
        payer: { email: input.payerEmail },
        back_urls: input.backUrls,
        notification_url: input.notificationUrl,
        external_reference: input.externalReference,
        auto_return: "approved",
      }),
    });
    return {
      token: data.id,
      url: data.init_point,
      sandboxUrl: data.sandbox_init_point,
    };
  }

  async getStatus(paymentId: string): Promise<PaymentStatusResult> {
    const data = await mpFetch<{ id: string; status: string }>(
      `/v1/payments/${paymentId}`,
    );
    return {
      status: mapPaymentStatus(data.status),
      paymentId: data.id,
      raw: data,
    };
  }

  isPaid(status: PaymentStatus): boolean {
    return status === "paid";
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult> {
    return createSubscription(input);
  }

  async getSubscriptionStatus(
    subscriptionId: string,
  ): Promise<SubscriptionStatusResult> {
    const data = await mpFetch<{
      id: string;
      status: string;
      next_payment_date?: string;
      auto_recurring?: { end_date?: string };
    }>(`/preapproval/${subscriptionId}`);
    return {
      status: mapSubscriptionStatus(data.status),
      periodEnd: data.next_payment_date ?? data.auto_recurring?.end_date,
      raw: data,
    };
  }
}

export const mercadoPagoProvider: PaymentProvider = new MercadoPagoProvider();
