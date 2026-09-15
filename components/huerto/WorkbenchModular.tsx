"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Box, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanoHuerto } from "@/components/huerto/PlanoHuerto";
import { TerrenoSection } from "@/components/mapa/TerrenoSection";
import { ESPECIES, getEspeciePorDbKey } from "@/lib/agronomy";
import { colorDeEspecie } from "@/lib/huerto/plano";
import type { Arbol, HuertoResumen } from "@/types";

function nombreDeEspecie(especie: string): string {
  return getEspeciePorDbKey(especie)?.nombre ?? especie;
}

/** Lienzo del huerto a ancho completo (el mapa es lo principal): la vista
 *  principal es el satélite; «Agregar árboles» está disponible en los 3 tabs
 *  (cada tab planta in situ con el único endpoint de creación). Sin panel
 *  lateral. El selector de huerto es único y global, junto a los tabs. */
export function WorkbenchModular({
  huertos,
  arboles,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
}) {
  const [tab, setTab] = useState<"satelite" | "matriz" | "tres-d">("satelite");
  const [huertoId, setHuertoId] = useState<string | null>(huertos[0]?.id ?? null);
  // El id efectivo cae al primer huerto si el seleccionado ya no existe
  // (p. ej. recién eliminado en el satélite antes del refresh).
  const huertoActivoId = huertos.some((h) => h.id === huertoId)
    ? huertoId
    : (huertos[0]?.id ?? null);

  // Leyenda igual que en los tabs 2D/3D: chips por especie del huerto activo.
  const leyenda = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const a of arboles) {
      if (huertoActivoId && a.huertoId !== huertoActivoId) continue;
      conteo.set(a.especie, (conteo.get(a.especie) ?? 0) + 1);
    }
    return [...conteo.entries()]
      .map(([especie, total]) => ({
        especie,
        total,
        color: colorDeEspecie(especie),
        nombre: nombreDeEspecie(especie),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [arboles, huertoActivoId]);

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Lienzo del huerto
        </h3>
        <Badge variant="outline" className="ml-auto rounded-full">
          {huertos.length} {huertos.length === 1 ? "huerto" : "huertos"}
        </Badge>
      </div>
      <CardContent className="p-4 sm:p-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="min-w-0 flex-1 justify-start overflow-x-auto rounded-xl bg-muted p-1 sm:flex-none">
              <TabsTrigger value="satelite" className="gap-1.5 rounded-lg">
                <MapPin className="size-3.5" /> Terreno (satélite)
              </TabsTrigger>
              <TabsTrigger value="matriz" className="gap-1.5 rounded-lg">
                <Box className="size-3.5" /> Posicionar árboles
              </TabsTrigger>
              <TabsTrigger value="tres-d" className="gap-1.5 rounded-lg">
                <Box className="size-3.5" /> Visualización 3D
              </TabsTrigger>
            </TabsList>
            {huertos.length > 1 ? (
              <Select
                value={huertoActivoId ?? undefined}
                onValueChange={(value) => setHuertoId(value ?? null)}
              >
                <SelectTrigger className="ml-auto w-52 min-h-9" aria-label="Huerto activo">
                  <SelectValue>
                    {(value: string | null) =>
                      huertos.find((h) => h.id === value)?.nombre ?? "Elige un huerto…"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {huertos.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          <TabsContent value="satelite" className="mt-0">
            <div className="flex flex-col gap-3">
              <TerrenoSection huertoId={huertoActivoId} onHuertoChange={setHuertoId} />
              {leyenda.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {leyenda.map((item) => (
                    <Link
                      key={item.especie}
                      href={`/especie/especies/${item.especie}`}
                      title={`Ver ficha de ${item.nombre}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs transition-colors hover:bg-muted/50"
                    >
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.nombre}
                      <span className="font-mono text-muted-foreground">×{item.total}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="matriz" className="mt-0">
            <PlanoHuerto
              huertos={huertos}
              arboles={arboles}
              especies={ESPECIES}
              modoForzado="2d"
              huertoId={huertoActivoId}
            />
          </TabsContent>
          <TabsContent value="tres-d" className="mt-0">
            <PlanoHuerto
              huertos={huertos}
              arboles={arboles}
              especies={ESPECIES}
              modoForzado="3d"
              huertoId={huertoActivoId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
