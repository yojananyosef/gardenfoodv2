import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  plan: z.enum(["gratuito", "huertero", "cosecha", "full", "admin"]).optional(),
  subscription_status: z.enum(["inactive", "trialing", "pending", "active", "canceled"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const [perfil, cultivos, tareas, registros, arboles, subs] = await Promise.all([
    admin.from("perfiles").select("plan, subscription_status").eq("id", id).maybeSingle(),
    admin.from("gf_cultivos").select("especie, cantidad").eq("user_id", id),
    admin.from("gf_tareas").select("estado").eq("user_id", id),
    admin.from("gf_registro").select("produccion_kg").eq("user_id", id),
    admin.from("gf_arboles").select("especie").eq("user_id", id),
    admin.from("gf_subscriptions").select("plan, interval, status, provider_subscription_id").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
  ]);
  return NextResponse.json({
    perfil: perfil.data ?? { plan: "gratuito", subscription_status: null },
    cultivos: cultivos.data ?? [],
    tareas: tareas.data ?? [],
    registros: registros.data ?? [],
    arboles: arboles.data ?? [],
    subs: subs.data ?? [],
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await isAdmin(supabase)) || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (parsed.data.plan) update.plan = parsed.data.plan;
  if (parsed.data.subscription_status) update.subscription_status = parsed.data.subscription_status;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("perfiles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  console.log(`[admin] ${user.id} -> ${id} plan=${parsed.data.plan} status=${parsed.data.subscription_status}`);
  return NextResponse.json({ ok: true });
}
