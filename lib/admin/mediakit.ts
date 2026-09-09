import { createClient } from "@/lib/supabase/server";

export interface SegmentoKit {
  etiqueta: string;
  total: number;
}

export interface MediaKitData {
  generado: string;
  kMinimo: number;
  porSegmento: SegmentoKit[];
  porTier: SegmentoKit[];
  porEspecie: SegmentoKit[];
  porRegion: SegmentoKit[];
  bajoUmbral: number;
}

interface RpcEtiqueta {
  etiqueta: string;
  total: number;
}

interface RpcKit {
  generado: string;
  k_minimo: number;
  por_segmento: RpcEtiqueta[] | null;
  por_tier: RpcEtiqueta[] | null;
  por_especie: RpcEtiqueta[] | null;
  por_region: RpcEtiqueta[] | null;
  bajo_umbral: number;
}

// Agregación con k-anonymity en SQL (admin_media_kit, migración 0023):
// solo devuelve segmentos con >= k usuarios; nada individual.
export async function getMediaKit(): Promise<MediaKitData> {
  const vacio: MediaKitData = {
    generado: "",
    kMinimo: 50,
    porSegmento: [],
    porTier: [],
    porEspecie: [],
    porRegion: [],
    bajoUmbral: 0,
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_media_kit");
    if (error || !data) {
      console.error("[admin/mediakit] RPC admin_media_kit falló:", error?.message);
      return vacio;
    }

    const rpc = data as unknown as RpcKit;
    const map = (rows: RpcEtiqueta[] | null): SegmentoKit[] =>
      (rows ?? []).map((r) => ({ etiqueta: r.etiqueta, total: r.total ?? 0 }));

    return {
      generado: rpc.generado ?? "",
      kMinimo: rpc.k_minimo ?? 50,
      porSegmento: map(rpc.por_segmento),
      porTier: map(rpc.por_tier),
      porEspecie: map(rpc.por_especie),
      porRegion: map(rpc.por_region),
      bajoUmbral: rpc.bajo_umbral ?? 0,
    };
  } catch (err) {
    console.error("[admin/mediakit] error inesperado:", err);
    return vacio;
  }
}
