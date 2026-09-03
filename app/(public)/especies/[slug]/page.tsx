import { notFound } from "next/navigation";
import { FichaEspecieView } from "@/components/especies/FichaEspecieView";
import { esMuestraGratuis, getEspeciePorSlug, getFicha } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";

export default async function EspeciePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const especie = getEspeciePorSlug(slug);
  if (!especie) notFound();

  const ficha = getFicha(especie.dbKey);
  if (!ficha) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locked = !user && !esMuestraGratuis(slug);

  return <FichaEspecieView especie={especie} ficha={ficha} locked={locked} />;
}
