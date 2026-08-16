import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const segment = url.searchParams.get("segment");
  const tier = url.searchParams.get("tier");
  const phenology = url.searchParams.get("phenology");
  const crop = url.searchParams.get("crop");
  const region = url.searchParams.get("region");
  const comuna = url.searchParams.get("comuna");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    Math.max(Number(url.searchParams.get("pageSize") ?? 50), 1),
    200,
  );

  let query = supabase
    .from("gf_user_audiences")
    .select("*, perfiles(region, comuna)")
    .order("total_ad_impressions", { ascending: false });

  if (segment) query = query.contains("commercial_segments", [segment]);
  if (tier) query = query.eq("purchasing_power_tier", tier);
  if (phenology) query = query.eq("last_active_phenology_stage", phenology);
  if (crop) query = query.eq("primary_interest_crop", crop);
  if (region) query = query.eq("perfiles.region", region);
  if (comuna) query = query.eq("perfiles.comuna", comuna);

  const from = (page - 1) * pageSize;
  const { data, error } = await query.range(from, from + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    page,
    pageSize,
    audiences: data ?? [],
  });
}