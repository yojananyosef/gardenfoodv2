import { notFound } from "next/navigation";
import { FichaEspecieView } from "@/components/especies/FichaEspecieView";
import { esMuestraGratuis, getEspeciePorSlug, getFicha } from "@/lib/agronomy";
import { getComunas, getZonas } from "@/lib/agronomy/catalogos";
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

  // El catálogo lo carga el servidor y viaja por props: son 346 filas con
  // lectura pública, y bajarlas desde el navegador en cada ficha sería un
  // roundtrip que el servidor ya tenía. La ficha necesita la zona de riego de
  // la comuna del visitante, que antes salía de un `if` sobre el número de zona.
  //
  // Las zonas van por props por lo mismo, y son solo 20 filas. Antes eran un
  // `Record` a nivel de módulo y las tabs «Fenología» e «Info» lo leían sin
  // pedir nada.
  const [comunas, zonas] = await Promise.all([getComunas(), getZonas()]);

  return (
    <FichaEspecieView especie={especie} ficha={ficha} locked={locked} comunas={comunas} zonas={zonas} />
  );
}
