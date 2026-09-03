import type { Arbol, Cultivo, Tarea, TipoTarea, EstadoTarea } from "@/types";
import { createClient } from "@/lib/supabase/server";

interface CultivoRow {
  id: string;
  especie: string;
  cantidad: number;
  created_at: string;
}

interface ArbolRow {
  id: string;
  especie: string;
  cantidad: number;
  fecha_plantacion: string | null;
  observaciones: string | null;
  created_at: string;
}

export function mapArbol(row: ArbolRow): Arbol {
  return {
    id: row.id,
    especie: row.especie,
    cantidad: row.cantidad,
    fechaPlantacion: row.fecha_plantacion,
    observaciones: row.observaciones,
    createdAt: row.created_at,
  };
}

interface TareaRow {
  id: string;
  fecha: string;
  especie: string | null;
  tipo: TipoTarea;
  texto: string;
  origen_id: string | null;
  estado: EstadoTarea;
  created_at: string;
}

export function mapCultivo(row: CultivoRow): Cultivo {
  return {
    id: row.id,
    especie: row.especie,
    cantidad: row.cantidad,
    createdAt: row.created_at,
  };
}

export function mapTarea(row: TareaRow): Tarea {
  return {
    id: row.id,
    fecha: row.fecha,
    especie: row.especie,
    tipo: row.tipo,
    texto: row.texto,
    origenId: row.origen_id,
    estado: row.estado,
    createdAt: row.created_at,
  };
}

export async function getCultivos(userId: string): Promise<Cultivo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_cultivos")
    .select("id, especie, cantidad, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as CultivoRow[]).map(mapCultivo);
}

export async function getArboles(userId: string): Promise<Arbol[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_arboles")
    .select("id, especie, cantidad, fecha_plantacion, observaciones, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as ArbolRow[]).map(mapArbol);
}

export async function getTareasDelDia(
  userId: string,
  fecha: string,
): Promise<Tarea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_tareas")
    .select("id, fecha, especie, tipo, texto, origen_id, estado, created_at")
    .eq("user_id", userId)
    .eq("fecha", fecha)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data as TareaRow[]).map(mapTarea);
}

export async function getTareasDelMes(
  userId: string,
  mes: string,
  anio: number,
): Promise<Tarea[]> {
  const inicio = `${anio}-${mes}-01`;
  const siguiente = new Date(anio, Number(mes), 1);
  const fin = new Date(anio, Number(mes) + 1, 1).toISOString().slice(0, 10);
  void siguiente;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_tareas")
    .select("id, fecha, especie, tipo, texto, origen_id, estado, created_at")
    .eq("user_id", userId)
    .gte("fecha", inicio)
    .lt("fecha", fin)
    .order("fecha", { ascending: true });

  if (error) return [];
  return (data as TareaRow[]).map(mapTarea);
}

export async function getPerfil(userId: string): Promise<{
  comuna: string | null;
  zonaAgroclimatica: string | null;
  plan: string;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("comuna, zona_agroclimatica, plan")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    comuna: data.comuna ?? null,
    zonaAgroclimatica: data.zona_agroclimatica ?? null,
    plan: data.plan ?? "gratuito",
  };
}