"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, MapPin, MousePointerClick, X } from "lucide-react";
import { BotonFichaEspecie } from "@/components/huerto/FichaEspecieSheet";

const CLAVE_HUERTO_ACTIVO = "gf-huerto-activo";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
 *  principal es el satélite; «Agregar árboles» vive UNA sola vez en el header
 *  del lienzo (acción primaria) y planta in situ en el tab activo con el único
 *  endpoint de creación. Sin panel lateral. Sin badge de conteo arriba: el
 *  huerto activo ya se muestra abajo en su card con stepper. */
export function WorkbenchModular({
  huertos,
  arboles,
  asistente,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  /** Botón «Abrir asistente» (lo entrega el server): vive junto a las tabs
   *  del lienzo, que es su contexto, en el hueco del antiguo selector. */
  asistente?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"satelite" | "matriz" | "tres-d">("satelite");
  // «Agregar árboles» global: null = apagado, dbKey = agregando esa especie.
  // Vive aquí para no duplicar el botón en cada tab y no confundirlo con el
  // asistente (terciario). La especie por defecto sale del catálogo.
  const [especieAgregar, setEspecieAgregar] = useState<string | null>(null);
  const agregando = especieAgregar !== null;
  // Estado inicial = primer huerto (igual en server y cliente para hidratar).
  const [huertoId, setHuertoId] = useState<string | null>(huertos[0]?.id ?? null);
  // El id efectivo cae al primer huerto si el seleccionado ya no existe
  // (p. ej. recién eliminado en el satélite antes del refresh).
  const huertoActivoId = huertos.some((h) => h.id === huertoId)
    ? huertoId
    : (huertos[0]?.id ?? null);
  useEffect(() => {
    try {
      if (huertoActivoId) sessionStorage.setItem(CLAVE_HUERTO_ACTIVO, huertoActivoId);
    } catch {
      // Persistencia best-effort: no bloquea el lienzo.
    }
  }, [huertoActivoId]);
  // Huerto recordado: se aplica SOLO tras montar. Leer sessionStorage en el
  // primer render pintaba otro huerto en cliente que en server (hydration
  // mismatch); así el primer pintado coincide y luego retoma donde estaba.
  useEffect(() => {
    try {
      const recordado = sessionStorage.getItem(CLAVE_HUERTO_ACTIVO);
      if (recordado && huertos.some((h) => h.id === recordado)) {
        // set-state-in-effect intencional: sincroniza con el store externo post-hidratación.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHuertoId((prev) => (prev === recordado ? prev : recordado));
      }
    } catch {
      // Sin sessionStorage: se queda el primero.
    }
    // Solo al montar: huertos viene del server y no cambia en esta vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Lienzo del huerto
        </h3>
        {asistente ? (
          <div className="ml-auto [&_button]:h-7 [&_button]:px-2 [&_button]:text-xs [&_button]:text-muted-foreground">
            {asistente}
          </div>
        ) : null}
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
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {agregando ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setEspecieAgregar(null)}
                  aria-label="Dejar de agregar árboles"
                >
                  <X /> Listo
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEspecieAgregar(ESPECIES[0]?.dbKey ?? null)}
                  disabled={huertos.length === 0 || ESPECIES.length === 0}
                  title={
                    huertos.length === 0
                      ? "Dibuja un huerto en el mapa para poder agregar árboles"
                      : "Elige especie y toca el terreno para plantar"
                  }
                >
                  <MousePointerClick /> Agregar árboles
                </Button>
              )}
            </div>
          </div>
          {/* keepMounted: el mapa satelital no se destruye al cambiar de tab,
              así los tiles y la instancia Leaflet se conservan en memoria. */}
          <TabsContent value="satelite" keepMounted className="mt-0">
            <div className="flex flex-col gap-3">
              <TerrenoSection
                huertoId={huertoActivoId}
                onHuertoChange={setHuertoId}
                huertosIniciales={huertos}
                arbolesIniciales={arboles}
                especieAgregar={especieAgregar}
                onEspecieAgregarChange={setEspecieAgregar}
              />
              {leyenda.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {leyenda.map((item) => (
                    <BotonFichaEspecie
                      key={item.especie}
                      dbKey={item.especie}
                      nombre={item.nombre}
                      variante="chip"
                    >
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.nombre}
                      <span className="font-mono text-muted-foreground">×{item.total}</span>
                    </BotonFichaEspecie>
                  ))}
                </div>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="matriz" keepMounted className="mt-0">
            <PlanoHuerto
              huertos={huertos}
              arboles={arboles}
              especies={ESPECIES}
              modoForzado="2d"
              huertoId={huertoActivoId}
              especieAgregar={especieAgregar}
              onEspecieAgregarChange={setEspecieAgregar}
            />
          </TabsContent>
          {/* 3D sin keepMounted a propósito: cada canvas WebGL vivo cuenta
              para el límite del navegador ("Too many active WebGL contexts").
              Satélite (tiles) y 2D (SVG) sí se conservan montados. */}
          <TabsContent value="tres-d" className="mt-0">
            {tab === "tres-d" ? (
              <PlanoHuerto
                huertos={huertos}
                arboles={arboles}
                especies={ESPECIES}
                modoForzado="3d"
                huertoId={huertoActivoId}
                especieAgregar={especieAgregar}
                onEspecieAgregarChange={setEspecieAgregar}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
