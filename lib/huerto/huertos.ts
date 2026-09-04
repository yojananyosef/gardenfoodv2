"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPlanDe } from "@/lib/huerto/actions";
import {
  parseTerrenoFeature,
  terrenoAreaM2,
  type TerrenoFeature,
} from "@/lib/huerto/terreno";
import { FREE_LIMITS, puedeAgregarHuerto } from "@/lib/payments/plans";

const NOMBRE_MAX = 60;

const NOMBRE_HUERTO = z
  .string()
  .trim()
  .min(1, "El nombre no puede estar vacío.")
  .max(NOMBRE_MAX, `El nombre puede tener hasta ${NOMBRE_MAX} caracteres.`);

export type HuertoGuardado = {
  id: string;
  nombre: string;
  feature: TerrenoFeature;
  superficieM2: number;
};

export type CrearHuertoResult =
  | { ok: true; huerto: HuertoGuardado }
  | { ok: false; error: string; limite?: true };

export type ActualizarHuertoResult =
  | { ok: true; nombre?: string; superficieM2?: number }
  | { ok: false; error: string };

export type EliminarHuertoResult = { ok: true } | { ok: false; error: string };

async function sincronizarSuperficiePerfil(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("gf_huertos")
    .select("superficie_m2")
    .eq("user_id", userId);
  const suma = (data ?? []).reduce(
    (acc, row) => acc + Number(row.superficie_m2 ?? 0),
    0,
  );
  const { error } = await supabase
    .from("perfiles")
    .update({ superficie_m2: Math.round(suma) })
    .eq("id", userId);
  return !error;
}

async function siguienteNombre(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { count } = await supabase
    .from("gf_huertos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const total = count ?? 0;
  return total === 0 ? "Mi huerto" : `Huerto ${total + 1}`;
}

export async function crearHuerto(input: {
  nombre?: string;
  feature: unknown;
}): Promise<CrearHuertoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const feature = parseTerrenoFeature(input.feature);
  if (!feature) {
    return { ok: false, error: "El polígono dibujado no es un terreno válido." };
  }

  const plan = await getPlanDe(supabase, user.id);
  const { count } = await supabase
    .from("gf_huertos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (!puedeAgregarHuerto(count ?? 0, plan)) {
    return {
      ok: false,
      error: `Llegaste al límite de ${FREE_LIMITS.huertos} huerto del plan gratuito. Pásate a Huertero para delimitar todos tus huertos.`,
      limite: true,
    };
  }

  const nombreParsed = NOMBRE_HUERTO.safeParse(input.nombre ?? "");
  const nombre =
    nombreParsed.success ? nombreParsed.data : await siguienteNombre(supabase, user.id);
  const superficieM2 = Math.round(terrenoAreaM2(feature.geometry.coordinates));

  const { data, error } = await supabase
    .from("gf_huertos")
    .insert({ user_id: user.id, nombre, terreno_geojson: feature, superficie_m2: superficieM2 })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo guardar el huerto." };

  await sincronizarSuperficiePerfil(supabase, user.id);
  revalidatePath("/perfil");
  revalidatePath("/huerto");
  return {
    ok: true,
    huerto: { id: String(data.id), nombre, feature, superficieM2 },
  };
}

export async function actualizarHuerto(
  id: string,
  input: { nombre?: string; feature?: unknown },
): Promise<ActualizarHuertoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const patch: Record<string, unknown> = {};

  if (input.nombre !== undefined) {
    const nombreParsed = NOMBRE_HUERTO.safeParse(input.nombre);
    if (!nombreParsed.success) {
      return {
        ok: false,
        error: nombreParsed.error.issues[0]?.message ?? "Nombre inválido.",
      };
    }
    patch.nombre = nombreParsed.data;
  }

  if (input.feature !== undefined) {
    const feature = parseTerrenoFeature(input.feature);
    if (!feature) {
      return { ok: false, error: "El polígono dibujado no es un terreno válido." };
    }
    patch.terreno_geojson = feature;
    patch.superficie_m2 = Math.round(terrenoAreaM2(feature.geometry.coordinates));
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase
    .from("gf_huertos")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "No se pudo actualizar el huerto." };

  if (patch.superficie_m2 !== undefined) {
    await sincronizarSuperficiePerfil(supabase, user.id);
  }
  revalidatePath("/perfil");
  revalidatePath("/huerto");
  return {
    ok: true,
    nombre: patch.nombre as string | undefined,
    superficieM2: patch.superficie_m2 as number | undefined,
  };
}

export async function eliminarHuerto(id: string): Promise<EliminarHuertoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("gf_huertos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "No se pudo eliminar el huerto." };

  await sincronizarSuperficiePerfil(supabase, user.id);
  revalidatePath("/perfil");
  revalidatePath("/huerto");
  return { ok: true };
}
