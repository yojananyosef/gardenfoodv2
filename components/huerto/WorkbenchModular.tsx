"use client";

import { useRef, useState } from "react";
import { Box, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanoHuerto } from "@/components/huerto/PlanoHuerto";
import { TerrenoSection, type TerrenoSectionHandle } from "@/components/mapa/TerrenoSection";
import { ESPECIES } from "@/lib/agronomy";
import { formatAreaM2, formatCoordenadas } from "@/lib/huerto/terreno";
import type { Arbol, HuertoResumen } from "@/types";

/** Lienzo del huerto a ancho completo (el mapa es lo principal): la vista
 *  principal es el satélite; «Marcar árboles» está disponible en los 3 tabs
 *  (desde matriz/3D salta al satélite y activa el modo marca: flujo único
 *  de plantado tocando el terreno). Sin panel lateral. */
export function WorkbenchModular({
  huertos,
  arboles,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
}) {
  const [tab, setTab] = useState<"satelite" | "matriz" | "tres-d">("satelite");
  const terrenoRef = useRef<TerrenoSectionHandle>(null);

  function irAMarcar() {
    setTab("satelite");
    terrenoRef.current?.activarMarca();
  }

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
          <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
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
          <TabsContent value="satelite" className="mt-0">
            <div className="flex flex-col gap-3">
              <TerrenoSection ref={terrenoRef} />
              {huertos.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {huertos.map((h) => (
                    <li
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-2"
                    >
                      <span className="grid gap-0.5">
                        <span className="text-sm font-medium">{h.nombre}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {h.centro ? formatCoordenadas(h.centro) : "—"}
                        </span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatAreaM2(h.superficieM2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="matriz" className="mt-0">
            <PlanoHuerto huertos={huertos} arboles={arboles} especies={ESPECIES} modoForzado="2d" onMarcar={irAMarcar} />
          </TabsContent>
          <TabsContent value="tres-d" className="mt-0">
            <PlanoHuerto huertos={huertos} arboles={arboles} especies={ESPECIES} modoForzado="3d" onMarcar={irAMarcar} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
