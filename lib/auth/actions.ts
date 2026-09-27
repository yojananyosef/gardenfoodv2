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

const SUELOS = ["G", "MG", "M", "F"] as const;
const ORIGENES_SUELO = ["quiz", "manual"] as const;

export async function actualizarSuelo(tipoSuelo: string, origen: string) {
  if (!(SUELOS as readonly string[]).includes(tipoSuelo)) {
    return { error: "Tipo de suelo inválido. Elige entre las 4 opciones del test de la cinta." };
  }
  if (!(ORIGENES_SUELO as readonly string[]).includes(origen)) {
    return { error: "Origen inválido." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("perfiles")
    .update({
      tipo_suelo: tipoSuelo,
      suelo_origen: origen,
      suelo_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar tu tipo de suelo." };

  revalidatePath("/huerto");
  revalidatePath("/perfil");
  return { ok: true as const };
}
