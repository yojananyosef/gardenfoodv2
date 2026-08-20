import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowProvider } from "@/lib/payments/flow";

export const dynamic = "force-dynamic";

// Flow calls this at urlConfirmation after the user pays (or the payment fails).
// It sends `token` as application/x-www-form-urlencoded. We verify the real
// status via getStatus, then activate the slot idempotently. Always 200 so
// Flow does not retry/alert.
export async function POST(request: Request) {
  let token: string | undefined;
  try {
    const form = await request.formData();
    token = form.get("token")?.toString() ?? undefined;
  } catch {
    try {
      const json = (await request.json()) as { token?: string };
      token = json.token;
    } catch {
      token = undefined;
    }
  }
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  let statusResult;
  try {
    statusResult = await flowProvider.getStatus(token);
  } catch (err) {
    console.error("[flow/webhook] getStatus failed", err);
    return NextResponse.json({ error: "getStatus failed" }, { status: 502 });
  }

  const admin = createAdminClient();
  const { data: sponsorship, error } = await admin
    .from("gf_sponsorships")
    .select("id, payment_status")
    .eq("flow_token", token)
    .maybeSingle();

  if (error) {
    console.error("[flow/webhook] lookup failed", error);
  }
  if (!sponsorship) {
    // Unknown token; still 200 to avoid Flow alerts.
    return NextResponse.json({ ok: true });
  }

  if (sponsorship.payment_status === "paid") {
    return NextResponse.json({ ok: true });
  }

  if (flowProvider.isPaid(statusResult.status)) {
    const { error: updateError } = await admin
      .from("gf_sponsorships")
      .update({
        payment_status: "paid",
        flow_payment_id: String(statusResult.paymentId ?? ""),
        paid_at: new Date().toISOString(),
        active: true,
      })
      .eq("id", sponsorship.id);
    if (updateError) {
      console.error("[flow/webhook] activate failed", updateError);
    }
  } else if (statusResult.status === 1) {
    await admin
      .from("gf_sponsorships")
      .update({ payment_status: "pending" })
      .eq("id", sponsorship.id);
  } else {
    await admin
      .from("gf_sponsorships")
      .update({ payment_status: "failed", active: false })
      .eq("id", sponsorship.id);
  }

  return NextResponse.json({ ok: true });
}
