import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowProvider } from "@/lib/payments/flow";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  let body: { sponsorshipId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sponsorshipId = body.sponsorshipId;
  if (!sponsorshipId) {
    return NextResponse.json(
      { error: "sponsorshipId is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: sponsorship, error } = await admin
    .from("gf_sponsorships")
    .select("id, title, amount, payment_status")
    .eq("id", sponsorshipId)
    .single();
  if (error || !sponsorship) {
    return NextResponse.json(
      { error: "Sponsorship not found" },
      { status: 404 },
    );
  }

  const amount = Number(sponsorship.amount ?? 0);
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "This sponsorship has no price configured" },
      { status: 400 },
    );
  }
  if (sponsorship.payment_status === "paid") {
    return NextResponse.json(
      { error: "This sponsorship is already paid" },
      { status: 409 },
    );
  }

  const commerceOrder = randomUUID();
  let result;
  try {
    result = await flowProvider.createPayment({
      commerceOrder,
      subject: sponsorship.title,
      amount,
      email,
      urlConfirmation: `${SITE_URL}/api/v1/flow/webhook`,
      urlReturn: `${SITE_URL}/admin/sponsorships`,
    });
  } catch (err) {
    console.error("[flow/checkout] createPayment failed", err);
    return NextResponse.json(
      { error: "Could not start payment" },
      { status: 502 },
    );
  }

  const { error: updateError } = await admin
    .from("gf_sponsorships")
    .update({ flow_token: result.token, payment_status: "pending" })
    .eq("id", sponsorshipId);
  if (updateError) {
    console.error("[flow/checkout] update failed", updateError);
    return NextResponse.json(
      { error: "Could not record payment" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    redirectUrl: `${result.url}?token=${result.token}`,
  });
}
