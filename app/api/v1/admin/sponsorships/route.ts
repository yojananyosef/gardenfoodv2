import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { sponsorshipSchema } from "@/lib/ads/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { data, error } = await supabase
    .from("gf_sponsorships")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sponsorships: data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = sponsorshipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sponsorship payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("gf_sponsorships")
    .insert({
      ad_unit_id: parsed.data.adUnitId,
      ad_partner_id: parsed.data.adPartnerId,
      screen: parsed.data.screen,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      cta_url: parsed.data.ctaUrl ?? null,
      cta_label: parsed.data.ctaLabel ?? null,
      image_url: parsed.data.imageUrl ?? null,
      active: parsed.data.active ?? true,
      sort_order: parsed.data.sortOrder ?? 0,
      amount: parsed.data.amount ?? 0,
      targeting: parsed.data.targeting ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sponsorship: data }, { status: 201 });
}