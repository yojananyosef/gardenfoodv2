import type { Arbol, Cultivo, HuertoResumen, Tarea, TipoTarea, EstadoTarea } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { parseTerrenoFeature, terrenoCentro } from "@/lib/huerto/terreno";

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
  huerto_id: string | null;
  pos_x: number | null;
  pos_y: number | null;
  created_at: string;
  edad_clase?: string | null;
  copa_m?: number | null;
  metodo_riego?: string | null;
  caudal_l_h?: number | null;
}

export function mapArbol(row: ArbolRow): Arbol {
  return {
    id: row.id,
    especie: row.especie,
    cantidad: row.cantidad,
    fechaPlantacion: row.fecha_plantacion,
    observaciones: row.observaciones,
    huertoId: row.huerto_id,
    posX: row.pos_x,
    posY: row.pos_y,
    createdAt: row.created_at,
    edadClase: (row.edad_clase as Arbol["edadClase"]) ?? null,
    copaM: row.copa_m !== undefined && row.copa_m !== null ? Number(row.copa_m) : null,
    metodoRiego: (row.metodo_riego as Arbol["metodoRiego"]) ?? null,
    caudalLH: row.caudal_l_h !== undefined && row.caudal_l_h !== null ? Number(row.caudal_l_h) : null,
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

  if (error) {
    console.error("[huerto/data] getCultivos: {}", error.message);
    return [];
  }
  return (data as CultivoRow[]).map(mapCultivo);
}

export async function getArboles(userId: string): Promise<Arbol[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_arboles")
    .select(
      "id, especie, cantidad, fecha_plantacion, observaciones, huerto_id, pos_x, pos_y, created_at, edad_clase, copa_m, metodo_riego, caudal_l_h",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[huerto/data] getArboles: {}", error.message);
    return [];
  }
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

  if (error) {
    console.error("[huerto/data] getTareasDelDia: {}", error.message);
    return [];
  }
  return (data as TareaRow[]).map(mapTarea);
}

export async function getTareasDelMes(
  userId: string,
  mes: string,
  anio: number,
): Promise<Tarea[]> {
  const inicio = `${anio}-${mes}-01`;
  const fin = new Date(anio, Number(mes) + 1, 1).toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_tareas")
    .select("id, fecha, especie, tipo, texto, origen_id, estado, created_at")
    .eq("user_id", userId)
    .gte("fecha", inicio)
    .lt("fecha", fin)
    .order("fecha", { ascending: true });

  if (error) {
    console.error("[huerto/data] getTareasDelMes: {}", error.message);
    return [];
  }
  return (data as TareaRow[]).map(mapTarea);
}

export async function getHuertos(userId: string): Promise<HuertoResumen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gf_huertos")
    .select("id, nombre, terreno_geojson, superficie_m2, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[huerto/data] getHuertos: {}", error.message);
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((row) => {
    const feature = parseTerrenoFeature(row.terreno_geojson);
    return {
      id: row.id as string,
      nombre: (row.nombre as string) ?? "Mi huerto",
      superficieM2: Number(row.superficie_m2 ?? 0),
      centro: feature ? terrenoCentro(feature.geometry.coordinates) : null,
      feature,
    };
  });
}

export async function getPerfil(userId: string): Promise<{
  comuna: string | null;
  zonaAgroclimatica: string | null;
  plan: string;
  huertoModo: string | null;
  asistenteCompletadoAt: string | null;
  tipoSuelo: string | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("comuna, zona_agroclimatica, plan, huerto_modo, asistente_completado_at, tipo_suelo")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    comuna: data.comuna ?? null,
    zonaAgroclimatica: data.zona_agroclimatica ?? null,
    plan: data.plan ?? "gratuito",
    huertoModo: (data.huerto_modo as string | null) ?? null,
    asistenteCompletadoAt: data.asistente_completado_at ?? null,
    tipoSuelo: (data.tipo_suelo as string | null) ?? null,
  };
}