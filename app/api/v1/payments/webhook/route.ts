import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mercadoPagoProvider,
  getAuthorizedPayment,
} from "@/lib/payments/mercadopago";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

// Mercado Pago notifications (IPN) arrive as GET (?topic=&id=) or POST (JSON body).
// We always respond 200 so Mercado Pago does not retry/alert.
// Topics:
//   - payment                      -> one-time sponsorship charge
//   - preapproval | subscription_preapproval        -> subscription lifecycle
//   - subscription_authorized_payment               -> each recurring charge
// Signature: x-signature: ts=<ts>,v1=<hmac> ; x-request-id: <uuid>
// HMAC-SHA256 over manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with MP_WEBHOOK_SECRET.
// If MP_WEBHOOK_SECRET not set we log warn and skip verification (local dev).
// See https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks

async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const url = new URL(request.url);
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";

  let rawBody = "";
  let bodyJson: Record<string, unknown> | null = null;
  try {
    rawBody = await request.text();
    bodyJson = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
  } catch {
    // ignore
  }

  const bodyData = (bodyJson?.data ?? null) as { id?: string } | null;

  const topic: string | undefined =
    url.searchParams.get("topic") ??
    url.searchParams.get("type") ??
    (typeof bodyJson?.topic === "string" ? bodyJson.topic : undefined) ??
    (typeof bodyJson?.type === "string" ? bodyJson.type : undefined);
  const id: string | undefined =
    url.searchParams.get("id") ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("resource") ??
    (typeof bodyJson?.id === "string" ? bodyJson.id : undefined) ??
    (bodyData?.id ?? undefined);

  if (secret) {
    const candidates = [
      url.searchParams.get("data.id"),
      url.searchParams.get("id"),
      bodyData?.id,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    if (
      !verifyMercadoPagoSignature(xSignature, xRequestId, candidates, secret)
    ) {
      console.error("[payments/webhook] rejected: invalid signature");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "[payments/webhook] MP_WEBHOOK_SECRET not set; skipping signature validation",
    );
  }

  if (!topic || !id) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  if (topic.includes("authorized_payment")) {
    return await handleAuthorizedPayment(id, admin);
  }
  if (topic.includes("preapproval") || topic.includes("subscription")) {
    return await handleSubscription(id, admin);
  }
  if (topic.includes("payment")) {
    return await handlePayment(id, admin);
  }
  return NextResponse.json({ ok: true });
}

function verifyMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataIdCandidates: string[],
  secret: string,
): boolean {
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of xSignature.split(/[,&]/)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  const expected = Buffer.from(v1, "utf8");
  for (const candidate of dataIdCandidates) {
    const manifest = `id:${candidate};request-id:${xRequestId};ts:${ts};`;
    const hash = Buffer.from(
      createHmac("sha256", secret).update(manifest).digest("hex"),
      "utf8",
    );
    if (hash.length === expected.length && timingSafeEqual(hash, expected)) {
      return true;
    }
  }
  return false;
}

async function handlePayment(
  paymentId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let status: PaymentStatus;
  let reference: string | undefined;
  try {
    const result = await mercadoPagoProvider.getStatus(paymentId);
    status = result.status;
    const raw = (result.raw ?? {}) as { external_reference?: string };
    reference = raw.external_reference;
  } catch (err) {
    console.error("[payments/webhook] getStatus failed", err);
    return NextResponse.json({ ok: true });
  }

  if (!reference) return NextResponse.json({ ok: true });

  const { data: sponsorship, error } = await admin
    .from("gf_sponsorships")
    .select("id, payment_status")
    .eq("id", reference)
    .maybeSingle();
  if (error || !sponsorship) return NextResponse.json({ ok: true });
  if (sponsorship.payment_status === "paid") return NextResponse.json({ ok: true });

  const update: Record<string, unknown> = { payment_status: status };
  if (status === "paid") {
    update.provider_payment_id = paymentId;
    update.paid_at = new Date().toISOString();
    update.active = true;
  } else if (status === "failed") {
    update.active = false;
  }

  const { error: updateError } = await admin
    .from("gf_sponsorships")
    .update(update)
    .eq("id", reference);
  if (updateError) {
    console.error("[payments/webhook] sponsorship update failed", updateError);
  }
  return NextResponse.json({ ok: true });
}

async function handleAuthorizedPayment(
  authorizedPaymentId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let preapprovalId: string;
  try {
    const ap = await getAuthorizedPayment(authorizedPaymentId);
    preapprovalId = ap.preapprovalId;
  } catch (err) {
    console.error("[payments/webhook] getAuthorizedPayment failed", err);
    return NextResponse.json({ ok: true });
  }
  if (!preapprovalId) return NextResponse.json({ ok: true });
  return handleSubscription(preapprovalId, admin);
}

async function handleSubscription(
  subscriptionId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<NextResponse> {
  let raw: Record<string, unknown>;
  try {
    const result = await mercadoPagoProvider.getSubscriptionStatus(subscriptionId);
    raw = (result.raw ?? {}) as Record<string, unknown>;
  } catch (err) {
    console.error("[payments/webhook] getSubscriptionStatus failed", err);
    return NextResponse.json({ ok: true });
  }

  const mpStatus = String(raw.status ?? "pending");
  const reference = raw.external_reference
    ? String(raw.external_reference)
    : undefined;
  if (!reference) {
    // Preapproval without our external_reference; nothing to link.
    return NextResponse.json({ ok: true });
  }

  // The external_reference is our gf_subscriptions draft id.
  const { data: subRow } = await admin
    .from("gf_subscriptions")
    .select("id, user_id, plan, interval")
    .eq("id", reference)
    .maybeSingle();
  if (!subRow) return NextResponse.json({ ok: true });

  return applySubscription(
    admin,
    subRow.user_id,
    subRow.plan ?? "huertero",
    subRow.interval ?? "monthly",
    mpStatus,
    subscriptionId,
    raw.next_payment_date as string | undefined,
  );
}

// Mercado Pago sends `pending` while in free trial before first charge;
// we map it explicitly to `trialing` so the DB status is meaningful.
async function applySubscription(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  tier: string,
  interval: string,
  mpStatus: string,
  subscriptionId: string,
  periodEnd?: string,
): Promise<NextResponse> {
  const subStatus: SubscriptionStatus =
    mpStatus === "authorized"
      ? "active"
      : mpStatus === "cancelled"
        ? "canceled"
        : mpStatus === "paused"
          ? "inactive"
          : mpStatus === "pending"
            ? "trialing"
            : "trialing";

  // Update the user's latest subscription draft row.
  const { data: subs } = await admin
    .from("gf_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  const subId = subs?.[0]?.id;

  if (subId) {
    const { error: subError } = await admin
      .from("gf_subscriptions")
      .update({
        status: subStatus,
        current_period_end: periodEnd ?? null,
        paid_via: "mercadopago",
        provider_subscription_id: subscriptionId,
      })
      .eq("id", subId);
    if (subError) {
      console.error("[payments/webhook] subscription update failed", subError);
    }
  }

  const profileUpdate: Record<string, unknown> = {
    subscription_status: subStatus,
    subscription_id: subscriptionId,
    payment_provider: "mercadopago",
  };
  if (subStatus === "active") profileUpdate.plan = tier;
  else if (subStatus === "canceled") profileUpdate.plan = "gratuito";

  const { error: profileError } = await admin
    .from("perfiles")
    .update(profileUpdate)
    .eq("id", userId);
  if (profileError) {
    console.error("[payments/webhook] profile update failed", profileError);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
