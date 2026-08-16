"use client";

import { useTrackedView } from "@/hooks/useTrackedView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SPECIES_INFO: Record<string, { nombre: string; detalle: string }> = {
  durazno: {
    nombre: "Duraznero",
    detalle:
      "Requiere poda de formación en invierno, riego moderado y fertilización con fósforo en floración. Etapa fenológica actual: brotación.",
  },
  frutilla: {
    nombre: "Frutilla",
    detalle:
      "Prefiere suelo ácido y riego por goteo. Fertilizante orgánico recomendado: guano rojo en dosis de 200 g/m².",
  },
};

export default function EspeciePage({ params }: { params: { slug: string } }) {
  const ref = useTrackedView<HTMLDivElement>({
    name: "VIEW_FICHA",
    especieId: params.slug,
  });
  const info = SPECIES_INFO[params.slug] ?? {
    nombre: params.slug,
    detalle: "Ficha técnica de la especie.",
  };

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{info.nombre}</CardTitle>
          <CardDescription>Ficha técnica</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{info.detalle}</p>
        </CardContent>
      </Card>
    </div>
  );
}