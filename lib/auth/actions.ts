"use server";

import { revalidatePath } from "next/cache";
import { buscarComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";

export async function actualizarUbicacion(comuna: string) {
  const match = buscarComuna(comuna);
  if (!match) {
    return { error: "No encontramos tu comuna en el catálogo. Revisa la escritura." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("perfiles")
    .update({
      region: match.region,
      comuna: match.comuna,
      zona_agroclimatica: String(match.zonaId),
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo actualizar tu ubicación." };

  revalidatePath("/huerto");
  revalidatePath("/perfil");
  return { ok: true as const, region: match.region, comuna: match.comuna };
}
