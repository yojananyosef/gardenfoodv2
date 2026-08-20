import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { sponsorshipUpdateSchema } from "@/lib/ads/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = sponsorshipUpdateSchema.safeParse(body);
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

  const { id } = await params;
  const { data, error } = await supabase
    .from("gf_sponsorships")
    .update({
      ...(parsed.data.adUnitId !== undefined && { ad_unit_id: parsed.data.adUnitId }),
      ...(parsed.data.adPartnerId !== undefined && { ad_partner_id: parsed.data.adPartnerId }),
      ...(parsed.data.screen !== undefined && { screen: parsed.data.screen }),
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.ctaUrl !== undefined && { cta_url: parsed.data.ctaUrl }),
      ...(parsed.data.ctaLabel !== undefined && { cta_label: parsed.data.ctaLabel }),
      ...(parsed.data.imageUrl !== undefined && { image_url: parsed.data.imageUrl }),
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
      ...(parsed.data.sortOrder !== undefined && { sort_order: parsed.data.sortOrder }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sponsorship: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabase.from("gf_sponsorships").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}