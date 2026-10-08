"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, LayoutGrid, MapPin, MousePointerClick, X } from "lucide-react";
import { BotonFichaEspecie } from "@/components/huerto/FichaEspecieSheet";

const CLAVE_HUERTO_ACTIVO = "gf-huerto-activo";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanoHuerto } from "@/components/huerto/PlanoHuerto";
import { SelectorEspecie } from "@/components/huerto/SelectorEspecie";
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
  // Dos estados separados, a propósito:
  // - `especie`: qué se planta. Lo elige el selector grande, siempre visible.
  // - `plantando`: si el mapa acepta toques para crear árboles.
  //
  // Estaban juntos en un solo valor, y eso hacía que elegir una especie no
  // hiciera nada visible hasta que se apretaba «Agregar árboles»: el selector
  // grande quedaba inerte. Ahora elegir especie se ve al instante, y apagar el
  // modo NO borra la elección, para poder plantar diez árboles seguidos sin
  // re-elegir.
  const [especie, setEspecie] = useState<string | null>(null);
  const [plantando, setPlantando] = useState(false);
  const agregando = plantando;
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
      <CardContent className="p-5 sm:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-4">
          <div className="flex flex-nowrap items-center gap-2">
            <TabsList className="min-w-0 flex-1 justify-start overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="satelite" className="min-h-9 gap-1.5 rounded-lg px-3" title="Terreno (satélite)" aria-label="Terreno (satélite)">
                <MapPin className="size-4" /> Terreno
              </TabsTrigger>
              <TabsTrigger value="matriz" className="min-h-9 gap-1.5 rounded-lg px-3" title="Posicionar árboles" aria-label="Posicionar árboles">
                <LayoutGrid className="size-4" /> Posicionar
              </TabsTrigger>
              <TabsTrigger value="tres-d" className="min-h-9 gap-1.5 rounded-lg px-3" title="Visualización 3D" aria-label="Visualización 3D">
                <Box className="size-4" /> 3D
              </TabsTrigger>
            </TabsList>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {agregando ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-9 rounded-full"
                  onClick={() => setPlantando(false)}
                  aria-label="Dejar de agregar árboles"
                >
                  <X /> Listo
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-9 rounded-full"
                  // Sin especie elegida se usa la primera del catálogo, para que
                  // el botón nunca sea un no-op: el usuario igual ve en el
                  // selector qué se va a plantar.
                  onClick={() => {
                    if (!especie) setEspecie(ESPECIES[0]?.dbKey ?? null);
                    setPlantando(true);
                  }}
                  disabled={huertos.length === 0 || ESPECIES.length === 0}
                  title={
                    huertos.length === 0
                      ? "Dibuja un huerto en el mapa para poder agregar árboles"
                      : "Toca el terreno para plantar"
                  }
                  aria-label="Agregar árboles"
                >
                  <MousePointerClick /> <span className="hidden sm:inline">Agregar árboles</span><span className="sm:hidden">Agregar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Barra de plantado: UNA sola, condicional, y con todo lo que significa
              «estoy plantando» adentro — la especie, el contador y la
              instrucción. Antes el selector y el contador vivían acá de
              permanentes y la instrucción aparecía abajo en el mapa: dos
              lugares para el mismo estado, que es lo que producía la sensación
              de duplicación.

              Se muestra al apretar «Agregar árboles» y no antes: el mapa en
              reposo es para MIRAR el huerto, y una fila de acción permanente
              encima sugiere que habría que estar plantando todo el tiempo. La
              decisión de qué plantar pertenece a la acción, no al reposo.

              El selector baja de 128×36 px que tenía dentro del mapa a 48 px
              de alto, porque acá no hay mapa apretando el espacio. */}
          {agregando ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2">
                <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline">
                  Para plantar
                </span>
                <SelectorEspecie
                  valor={especie}
                  onChange={setEspecie}
                  deshabilitado={huertos.length === 0}
                  className="flex-1 sm:max-w-xs"
                />
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {arboles.length} en el mapa
                </span>
              </div>
              <span className="text-xs text-muted-foreground sm:flex-1">
                Toca tu terreno para plantar
              </span>
            </div>
          ) : null}
          {/* keepMounted: el mapa satelital no se destruye al cambiar de tab,
              así los tiles y la instancia Leaflet se conservan en memoria. */}
          <TabsContent value="satelite" keepMounted className="mt-0">
            <div className="flex flex-col gap-3">
              <TerrenoSection
                huertoId={huertoActivoId}
                onHuertoChange={setHuertoId}
                huertosIniciales={huertos}
                arbolesIniciales={arboles}
                especieAgregar={especie}
                plantando={plantando}
                onPlantarChange={setPlantando}
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
              especieAgregar={especie}
              plantando={plantando}
              onPlantarChange={setPlantando}
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
                especieAgregar={especie}
                plantando={plantando}
                onPlantarChange={setPlantando}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
