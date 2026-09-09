"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoSupresion = { ok: true } | { ok: false; error: string };

export async function eliminarMiCuenta(
  confirmacion: string,
): Promise<ResultadoSupresion> {
  if (confirmacion !== "ELIMINAR") {
    return { ok: false, error: "Confirma escribiendo ELIMINAR." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "No autenticado." };
  }
  const uid = user.id;

  try {
    const admin = createAdminClient();

    // Con suscripción activa/trial no se suprime: primero cancelar en Mercado Pago.
    const { data: activas } = await admin
      .from("gf_subscriptions")
      .select("id, status")
      .eq("user_id", uid)
      .in("status", ["active", "trialing"]);
    if (activas && activas.length > 0) {
      return {
        ok: false,
        error:
          "Tienes una suscripción activa. Cancélala en Mercado Pago y espera la confirmación antes de eliminar tu cuenta.",
      };
    }

    // Filas propias (RLS + service-role para tablas sin DELETE propio).
    await supabase.from("gf_tareas").delete().eq("user_id", uid);
    await supabase.from("gf_cultivos").delete().eq("user_id", uid);
    await supabase.from("gf_arboles").delete().eq("user_id", uid);
    await supabase.from("gf_huertos").delete().eq("user_id", uid);
    await supabase.from("gf_registro").delete().eq("user_id", uid);
    await admin.from("gf_user_consents").delete().eq("user_id", uid);
    await admin.from("gf_analytics_events").delete().eq("user_id", uid);
    await admin.from("gf_user_audiences").delete().eq("user_id", uid);

    // El usuario de auth: FK cascade elimina perfiles y lo que cuelgue de él.
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) {
      return { ok: false, error: "No se pudo eliminar la cuenta. Intenta de nuevo." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la cuenta. Intenta de nuevo." };
  }
}
