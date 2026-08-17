"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const AGREGAR_REGISTRO = z.object({
  especie: z.string().min(1).max(80),
  produccionKg: z.number().min(0).nullable().optional(),
  nota: z.string().max(500).nullable().optional(),
});

export async function agregarRegistro(input: {
  especie: string;
  produccionKg?: number | null;
  nota?: string | null;
}) {
  const parsed = AGREGAR_REGISTRO.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("gf_registro").insert({
    user_id: user.id,
    especie: parsed.especie,
    produccion_kg: parsed.produccionKg ?? null,
    nota: parsed.nota ?? null,
  });

  if (error) return { error: "No se pudo guardar el registro." };

  revalidatePath("/cosechas");
  return { ok: true as const };
}

export async function eliminarRegistro(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("gf_registro")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo eliminar el registro." };

  revalidatePath("/cosechas");
  return { ok: true as const };
}