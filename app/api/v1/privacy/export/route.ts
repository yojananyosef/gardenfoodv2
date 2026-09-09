import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ARSOP — portabilidad (LPDP art. 7): el titular descarga todos sus datos en JSON.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const uid = user.id;
  const [perfiles, huertos, cultivos, tareas, arboles, subscriptions, consents, registro] =
    await Promise.all([
      supabase.from("perfiles").select("*").eq("id", uid),
      supabase.from("gf_huertos").select("*").eq("user_id", uid),
      supabase.from("gf_cultivos").select("*").eq("user_id", uid),
      supabase.from("gf_tareas").select("*").eq("user_id", uid),
      supabase.from("gf_arboles").select("*").eq("user_id", uid),
      supabase.from("gf_subscriptions").select("*").eq("user_id", uid),
      supabase.from("gf_user_consents").select("*").eq("user_id", uid),
      supabase.from("gf_registro").select("*").eq("user_id", uid),
    ]);

  // RLS no permite SELECT propio de eventos (solo service-role) → admin client.
  let eventos: unknown[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("gf_analytics_events")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    eventos = (data as unknown[]) ?? [];
  } catch {
    eventos = [];
  }

  const exporte = {
    generadoEn: new Date().toISOString(),
    titular: { id: uid, email: user.email },
    datos: {
      perfil: perfiles.data ?? [],
      huertos: huertos.data ?? [],
      cultivos: cultivos.data ?? [],
      tareas: tareas.data ?? [],
      arboles: arboles.data ?? [],
      suscripciones: subscriptions.data ?? [],
      consentimientos: consents.data ?? [],
      registroCosechas: registro.data ?? [],
      eventosTelemetria: eventos,
    },
    errores: [perfiles.error, huertos.error, cultivos.error, tareas.error, arboles.error, subscriptions.error, consents.error, registro.error]
      .filter(Boolean)
      .map((e) => (e as { message: string }).message),
  };

  const nombre = `gardenfood-datos-${uid.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(exporte, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
