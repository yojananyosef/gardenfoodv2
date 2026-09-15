"use client";

import { useState, type ReactNode } from "react";
import { Box, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Arbol, HuertoResumen } from "@/types";

/** Lienzo del huerto a ancho completo (el mapa es lo principal): tabs
 *  satélite / matriz / 3D con el conteo en la cabecera. Sin panel lateral:
 *  plantar se hace tocando el mapa («Marcar árboles» en Terreno) y cada
 *  árbol se edita desde su marcador o la leyenda. */
export function WorkbenchModular({
  huertos,
  arboles,
  slots,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  slots: {
    /** Tab satélite: mapa con dibujo de polígono y resumen de huertos. */
    satelite: ReactNode;
    /** Tab matriz (PlanoHuerto 2D). */
    matriz: ReactNode;
    /** Tab estructura 3D. */
    tresD: ReactNode;
  };
}) {
  const especies = new Set(arboles.map((a) => a.especie)).size;
  const [tab, setTab] = useState<"satelite" | "matriz" | "tres-d">
    (arboles.some((a) => a.huertoId) ? "matriz" : "satelite");

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Lienzo del huerto
        </h3>
        <span className="text-xs text-muted-foreground">
          {especies} {especies === 1 ? "especie" : "especies"} en inventario ·{" "}
          {arboles.length} {arboles.length === 1 ? "árbol" : "árboles"} totales
        </span>
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
          <TabsContent value="satelite" className="mt-0">{slots.satelite}</TabsContent>
          <TabsContent value="matriz" className="mt-0">{slots.matriz}</TabsContent>
          <TabsContent value="tres-d" className="mt-0">{slots.tresD}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
