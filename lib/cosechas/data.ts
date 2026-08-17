import type { RegistroCosecha } from "@/types";
import { createClient } from "@/lib/supabase/server";

interface RegistroRow {
  id: string;
  fecha: string;
  especie: string;
  nota: string | null;
  produccion_kg: number | null;
  created_at: string;
}

export function mapRegistro(row: RegistroRow): RegistroCosecha {
  return {
    id: row.id,
    fecha: row.fecha,
    especie: row.especie,
    nota: row.nota,
    produccionKg: row.produccion_kg,
    createdAt: row.created_at,
  };
}

export async function getRegistros(userId: string): Promise<RegistroCosecha[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_registro")
    .select("id, fecha, especie, nota, produccion_kg, created_at")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error) return [];
  return (data as RegistroRow[]).map(mapRegistro);
}