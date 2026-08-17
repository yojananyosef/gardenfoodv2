"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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