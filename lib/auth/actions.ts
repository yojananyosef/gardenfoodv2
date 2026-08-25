"use server";

import { revalidatePath } from "next/cache";
import { buscarComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";
import { parseTerrenoFeature, terrenoAreaM2 } from "@/lib/huerto/terreno";

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

export async function guardarTerreno(terreno: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  if (terreno === null) {
    const { error } = await supabase
      .from("perfiles")
      .update({ terreno_geojson: null, superficie_m2: 0 })
      .eq("id", user.id);
    if (error) return { error: "No se pudo borrar el terreno." };
    revalidatePath("/perfil");
    return { ok: true as const };
  }

  const feature = parseTerrenoFeature(terreno);
  if (!feature) {
    return { error: "El polígono dibujado no es un terreno válido." };
  }

  const superficieM2 = Math.round(terrenoAreaM2(feature.geometry.coordinates));
  const { error } = await supabase
    .from("perfiles")
    .update({ terreno_geojson: feature, superficie_m2: superficieM2 })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar el terreno." };

  revalidatePath("/perfil");
  return { ok: true as const, superficieM2 };
}
