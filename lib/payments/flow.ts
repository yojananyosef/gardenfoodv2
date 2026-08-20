import { createHmac } from "node:crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
} from "./types";

const API_URL = process.env.FLOW_API_URL ?? "https://sandbox.flow.cl/api";
const API_KEY = process.env.FLOW_API_KEY ?? "";
const SECRET_KEY = process.env.FLOW_SECRET_KEY ?? "";

if (!API_KEY || !SECRET_KEY) {
  // Surfaced at call time, not at import, so build/lint stays clean.
  console.warn("[flow] FLOW_API_KEY / FLOW_SECRET_KEY are not set");
}

// Flow signature: sort param keys, concatenate key+value for each, HMAC-SHA256 hex.
export function signParams(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return createHmac("sha256", SECRET_KEY).update(toSign).digest("hex");
}

class FlowProvider implements PaymentProvider {
  readonly name = "flow";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const params: Record<string, string> = {
      apiKey: API_KEY,
      commerceOrder: input.commerceOrder,
      subject: input.subject,
      amount: String(input.amount),
      currency: "CLP",
      email: input.email,
      paymentMethod: "9",
      urlConfirmation: input.urlConfirmation,
      urlReturn: input.urlReturn,
    };
    const s = signParams(params);
    const body = new URLSearchParams({ ...params, s });

    const res = await fetch(`${API_URL}/payment/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Flow createPayment failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      url: string;
      token: string;
      flowOrder: number;
    };
    return { url: data.url, token: data.token, paymentId: data.flowOrder };
  }

  async getStatus(token: string): Promise<PaymentStatusResult> {
    const params: Record<string, string> = { apiKey: API_KEY, token };
    const s = signParams(params);

    const url = new URL(`${API_URL}/payment/getStatus`);
    url.searchParams.set("apiKey", API_KEY);
    url.searchParams.set("token", token);
    url.searchParams.set("s", s);

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Flow getStatus failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      status: number;
      paymentId?: string;
      flowOrder?: number;
    };
    return {
      status: Number(data.status),
      paymentId: data.paymentId ?? data.flowOrder,
    };
  }

  isPaid(status: number): boolean {
    return status === 2;
  }
}

export const flowProvider: PaymentProvider = new FlowProvider();
