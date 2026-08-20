import { RecomendacionesView } from "@/components/recomendaciones/RecomendacionesView";
import { getEspeciesPorZona, getZonaDeComuna, getZonaIdDeComuna } from "@/lib/agronomy";
import { getPerfil } from "@/lib/huerto/data";
import { createClient } from "@/lib/supabase/server";

export default async function RecomendadasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const perfil = await getPerfil(user.id);
  const comuna = perfil?.comuna ?? null;
  const zonaId = getZonaIdDeComuna(comuna ?? undefined);
  const zona = getZonaDeComuna(comuna);
  const fallback = !zonaId && !!comuna;
  // getZonaDeComuna already falls back to zone 7 if unknown; for stats we need zonaId or 7
  const effectiveZonaId = zonaId ?? 7;
  const { si, riesgo, no } = getEspeciesPorZona(effectiveZonaId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Recomendadas</h1>
        <p className="text-sm text-muted-foreground">Qué puedes cultivar en tu comuna</p>
      </div>
      <RecomendacionesView si={si} riesgo={riesgo} no={no} zonaNombre={zona?.nombre ?? "Santiago Norte"} comuna={comuna} isFallback={fallback} />
    </div>
  );
}
