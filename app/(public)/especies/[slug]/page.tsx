import { notFound } from "next/navigation";
import { FichaEspecieView } from "@/components/especies/FichaEspecieView";
import { getEspeciePorSlug, getFicha } from "@/lib/agronomy";

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

  return <FichaEspecieView especie={especie} ficha={ficha} />;
}