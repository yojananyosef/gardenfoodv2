"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  FREE_LIMITS,
  puedeAgregarArbol,
  puedeAgregarCultivo,
  type PlanAcceso,
} from "@/lib/payments/plans";

async function getPlanDe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<PlanAcceso> {
  const { data } = await supabase
    .from("perfiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  return (data?.plan as PlanAcceso | undefined) ?? "gratuito";
}

const AGREGAR_CULTIVO = z.object({
  especie: z.string().min(1).max(80),
  cantidad: z.number().int().min(1).max(1000).default(1),
});

export async function agregarCultivo(input: { especie: string; cantidad?: number }) {
  const parsed = AGREGAR_CULTIVO.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const plan = await getPlanDe(supabase, user.id);
  if (plan === "gratuito") {
    const { count } = await supabase
      .from("gf_cultivos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!puedeAgregarCultivo(count ?? 0, plan)) {
      return {
        error: `Llegaste al límite de ${FREE_LIMITS.cultivos} cultivos del plan gratuito. Pásate a Huertero para cultivar sin límites.`,
        limite: true as const,
      };
    }
  }

  const { error } = await supabase
    .from("gf_cultivos")
    .insert({ user_id: user.id, especie: parsed.especie, cantidad: parsed.cantidad });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tienes esa especie en tu huerto." };
    }
    return { error: "No se pudo agregar el cultivo." };
  }

  revalidatePath("/huerto");
  return { ok: true as const };
}

export async function eliminarCultivo(especie: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_cultivos")
    .delete()
    .eq("user_id", user.id)
    .eq("especie", especie);

  if (error) return { error: "No se pudo eliminar el cultivo." };

  revalidatePath("/huerto");
  return { ok: true as const };
}

const CICLO_ESTADO: Record<string, "pendiente" | "en_proceso" | "completada"> = {
  pendiente: "en_proceso",
  en_proceso: "completada",
  completada: "pendiente",
};

export async function avanzarEstadoTarea(id: string, estadoActual: string) {
  const siguiente = CICLO_ESTADO[estadoActual];
  if (!siguiente) return { error: "Estado inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_tareas")
    .update({ estado: siguiente })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar la tarea." };

  revalidatePath("/huerto");
  revalidatePath("/calendario");
  return { ok: true as const };
}

export async function eliminarTarea(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_tareas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo eliminar la tarea." };

  revalidatePath("/huerto");
  revalidatePath("/calendario");
  return { ok: true as const };
}

const AGREGAR_TAREA = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  especie: z.string().nullable().optional(),
  tipo: z.enum(["riego", "nutricion", "sanidad", "personalizada"]),
  texto: z.string().min(1).max(300),
  origenId: z.string().nullable().optional(),
});

export async function agregarTarea(input: z.infer<typeof AGREGAR_TAREA>) {
  const parsed = AGREGAR_TAREA.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("gf_tareas").insert({
    user_id: user.id,
    fecha: parsed.fecha,
    especie: parsed.especie ?? null,
    tipo: parsed.tipo,
    texto: parsed.texto,
    origen_id: parsed.origenId ?? null,
    estado: "pendiente",
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath("/huerto");
  revalidatePath("/calendario");
  return { ok: true as const };
}

const AGREGAR_ARBOL = z.object({
  especie: z.string().min(1).max(80),
  cantidad: z.number().int().min(1).max(1000).default(1),
  fechaPlantacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  observaciones: z.string().max(500).nullable().optional(),
});

export async function agregarArbol(input: z.infer<typeof AGREGAR_ARBOL>) {
  const parsed = AGREGAR_ARBOL.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const plan = await getPlanDe(supabase, user.id);
  if (plan === "gratuito") {
    const { count } = await supabase
      .from("gf_arboles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!puedeAgregarArbol(count ?? 0, plan)) {
      return {
        error: `Llegaste al límite de ${FREE_LIMITS.arboles} árbol del plan gratuito. Pásate a Huertero para registrar sin límites.`,
        limite: true as const,
      };
    }
  }

  const { error } = await supabase.from("gf_arboles").insert({
    user_id: user.id,
    especie: parsed.especie,
    cantidad: parsed.cantidad,
    fecha_plantacion: parsed.fechaPlantacion ?? null,
    observaciones: parsed.observaciones ?? null,
  });

  if (error) return { error: "No se pudo agregar el árbol." };

  revalidatePath("/huerto");
  return { ok: true as const };
}

export async function actualizarArbol(
  id: string,
  input: { cantidad?: number; fechaPlantacion?: string | null; observaciones?: string | null },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_arboles")
    .update({
      cantidad: input.cantidad,
      fecha_plantacion: input.fechaPlantacion ?? null,
      observaciones: input.observaciones ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar el árbol." };

  revalidatePath("/huerto");
  return { ok: true as const };
}

export async function eliminarArbol(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_arboles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo eliminar el árbol." };

  revalidatePath("/huerto");
  return { ok: true as const };
}