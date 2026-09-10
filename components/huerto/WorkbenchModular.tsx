"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Box, MapPin, Search, Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaArbolesAgrupada } from "@/components/huerto/ListaArbolesAgrupada";
import { eliminarArbol } from "@/lib/huerto/actions";
import type { Arbol, HuertoResumen } from "@/types";

/** Banco de trabajo modular (Propuesta B1): panel único de cultivos y árboles
 *  a la izquierda + lienzo grande con tabs (satélite / matriz / 3D) a la
 *  derecha. El buscador filtra las filas de especie; «Repartir sin ubicar»
 *  salta al tab de la matriz. */
export function WorkbenchModular({
  huertos,
  arboles,
  slots,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  slots: {
    /** Formulario compacto de alta de árbol (R2, alta única). */
    registrarArbol: ReactNode;
    /** Bloque de cultivos (agregar + lista), reutilizado del dashboard. */
    cultivos: ReactNode;
    /** Tab satélite: mapa con dibujo de polígono y resumen de huertos. */
    satelite: ReactNode;
    /** Tab matriz (PlanoHuerto 2D). */
    matriz: ReactNode;
    /** Tab estructura 3D. */
    tresD: ReactNode;
  };
}) {
  const sinUbicar = arboles.filter(
    (a) => a.huertoId === null || a.posX === null || a.posY === null,
  ).length;
  const sinHuertos = huertos.length === 0;
  const [tab, setTab] = useState<"satelite" | "matriz" | "tres-d">
    (arboles.some((a) => a.huertoId) ? "matriz" : "satelite");
  const [q, setQ] = useState("");
  const filtro = q.trim().toLowerCase();

  // Filas agrupadas filtradas por el buscador del panel.
  const arbolesVisibles = useMemo(() => {
    if (!filtro) return arboles;
    return arboles.filter((a) => (a.especie ?? "").toLowerCase().includes(filtro));
  }, [arboles, filtro]);

  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
      {/* ─── Panel único: cultivos y árboles (R2) ─── */}
      <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sprout className="size-4 text-primary" /> Cultivos y árboles
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <span className="font-heading block text-2xl leading-none">
                  {new Set(arboles.map((a) => a.especie)).size}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  especies en inventario
                </span>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <span className="font-heading block text-2xl leading-none">{arboles.length}</span>
                <span className="text-[11px] text-muted-foreground">árboles totales</span>
              </div>
            </div>

            {arboles.length > 0 ? (
              <label className="relative block">
                <span className="sr-only">Buscar especie en tu inventario</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar especie…"
                  className="rounded-xl pl-9"
                />
              </label>
            ) : null}

            <div className="max-h-[420px] overflow-y-auto pr-1">
              {arboles.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
                  Sin árboles aún: registra uno aquí abajo y luego sincronízalo
                  con el plano.
                </p>
              ) : arbolesVisibles.length === 0 ? (
                <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
                  Sin coincidencias para «{q}».
                </p>
              ) : (
                <ListaArbolesAgrupada arboles={arbolesVisibles} onEliminar={(id) => void eliminarArbol(id)} />
              )}
            </div>

            {slots.registrarArbol}
          </CardContent>
        </Card>

        {slots.cultivos}

        {/* Acciones rápidas del banco (B1) */}
        <div className="flex flex-col gap-2">
          <Button
            variant={tab === "matriz" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setTab("matriz")}
            disabled={arboles.length === 0 || sinHuertos}
          >
            <Sprout className="size-4" />
            {sinHuertos
              ? "Delimita tu huerto primero"
              : sinUbicar > 0
                ? `Repartir ${sinUbicar} sin ubicar (matriz)`
                : "Repartir sin ubicar (matriz)"}
          </Button>
          <p className="px-1 text-[11px] text-muted-foreground">
            Los ejemplares sin ubicar quedan listados en el panel y se reparten
            en la matriz del tab «Posicionar árboles».
          </p>
        </div>
      </aside>

      {/* ─── Lienzo grande: satélite / matriz / 3D (R1 + R4) ─── */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" /> Lienzo del huerto
          </h3>
          <Badge variant="outline" className="rounded-full">
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
    </div>
  );
}
