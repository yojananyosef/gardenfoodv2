import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getTotalUsuarios, getFunnel, getMRR, getEventos24h, getTopComunas } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [totalUsuarios, funnel, mrr, eventos24h, topComunas] = await Promise.all([
    getTotalUsuarios(),
    getFunnel(),
    getMRR(),
    getEventos24h(),
    getTopComunas(5),
  ]);
  return NextResponse.json({ totalUsuarios, funnel, mrr, eventos24h, topComunas });
}
