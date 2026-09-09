import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getOverview } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const overview = await getOverview();
  return NextResponse.json({
    totalUsuarios: overview.total,
    gratuitos: overview.gratuitos,
    funnel: overview.funnel,
    mrr: overview.mrr,
    activos30d: overview.activos30d,
    eventos24h: overview.eventos24h,
    topComunas: overview.topComunas,
    ultimaSincronizacion: overview.ultimaSincronizacion,
  });
}
