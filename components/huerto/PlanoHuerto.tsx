"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MapPin, Maximize, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { EditarArbolDialog } from "@/components/huerto/EditarArbolDialog";
import { IconoArbol } from "@/components/huerto/IconoArbol";
import { sincronizarPlanoHuerto } from "@/lib/huerto/huertos";
import { moverArbol } from "@/lib/huerto/actions";
import {
  ALTO_VISTA,
  ANCHO_VISTA,
  MARGEN_VISTA,
  bboxEnMetros,
  colorDeEspecie,
  crearVistaPlano,
  expandirUnidades,
  posAVista,
} from "@/lib/huerto/plano";
import { formatAreaM2 } from "@/lib/huerto/terreno";
import { getEspeciePorDbKey, type Especie } from "@/lib/agronomy";
import type { Arbol, HuertoResumen } from "@/types";

type Modo = "2d" | "3d";

const PlanoHuerto3D = dynamic(
  () => import("@/components/huerto/PlanoHuerto3D").then((m) => m.PlanoHuerto3D),
  { ssr: false, loading: () => <p className="text-xs text-muted-foreground">Cargando 3D…</p> },
);

const TEXTURA_TIERRA = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="t"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 0.31  0 0 0 0 0.38  0 0 0 0 0.17  0 0 0 0.6 0"/></filter><rect width="220" height="220" filter="url(#t)"/></svg>`,
)})`;
const TEXTURA_TIERRA_GRUESA = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="t"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.14  0 0 0 0.45 0"/></filter><rect width="140" height="140" filter="url(#t)"/></svg>`,
)})`;

const LINEAS_MATRIZ = Array.from(
  { length: 9 },
  (_, i) => `M${(i + 1) * 10} 0 V100 M0 ${(i + 1) * 10} H100`,
).join(" ");

function nombreDeEspecie(especie: string): string {
  return getEspeciePorDbKey(especie)?.nombre ?? especie;
}

export function PlanoHuerto({
  huertos,
  arboles,
  especies,
  modoForzado,
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  especies: Especie[];
  /** Cuando el lienzo (tabs) controla el modo, se fuerza y se oculta el toggle interno. */
  modoForzado?: "2d" | "3d";
}) {
  const router = useRouter();
  const [huertoId, setHuertoId] = useState<string | null>(huertos[0]?.id ?? null);
  const [modoInterno, setModoInterno] = useState<Modo>("2d");
  const modo: Modo = modoForzado ?? modoInterno;
  const setModo = (m: Modo) => setModoInterno(m);
  const [editando, setEditando] = useState<Arbol | null>(null);
  const [pending, startTransition] = useTransition();
  // Zoom/pan del 2D: el plano ocupa más pantalla y se puede explorar.
  const [zoom2d, setZoom2d] = useState(1);
  const [pan2d, setPan2d] = useState({ x: 0, y: 0 });
  const [arrastrando2d, setArrastrando2d] = useState(false);
  const panRef = useRef<{ x: number; y: number; px: number; py: number; activo: boolean } | null>(null);
  const marco2dRef = useRef<HTMLDivElement>(null);
  const platoRef = useRef<HTMLDivElement>(null);
  // Reubicación manual por árbol (R7): posiciones optimistas + drag activo.
  // Se guardan con el huerto activo para no mezclar huertos sin effects.
  const [posLocales, setPosLocales] = useState<Record<string, { x: number; y: number; h: string }>>({});
  const [arbolArrastrado, setArbolArrastrado] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    movido: boolean;
  } | null>(null);

  const en3d = modo === "3d";

  function elegirHuerto(id: string | null) {
    setHuertoId(id);
    setZoom2d(1);
    setPan2d({ x: 0, y: 0 });
    setPosLocales({});
  }

  // Rueda → zoom (listener no pasivo para poder prevenir el scroll).
  useEffect(() => {
    if (en3d) return;
    const el = marco2dRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom2d((z) => Math.max(0.6, Math.min(2.8, z * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [en3d]);

  function iniciarPan2d(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-arbol-id]")) return;
    if ((e.target as HTMLElement).closest("button")) return;
    panRef.current = { x: e.clientX, y: e.clientY, px: pan2d.x, py: pan2d.y, activo: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moverPan2d(e: React.PointerEvent<HTMLDivElement>) {
    const arr = panRef.current;
    if (!arr) return;
    const dx = e.clientX - arr.x;
    const dy = e.clientY - arr.y;
    if (!arr.activo && Math.hypot(dx, dy) > 4) {
      arr.activo = true;
      setArrastrando2d(true);
    }
    if (arr.activo) setPan2d({ x: arr.px + dx, y: arr.py + dy });
  }

  function terminarPan2d() {
    panRef.current = null;
    setArrastrando2d(false);
  }

  // --- Drag & drop de árboles (R7): mover marcador y guardar al soltar ---
  function posDesdeEvento(e: React.PointerEvent, fallback: { x: number; y: number }) {
    const plato = platoRef.current;
    if (!plato) return fallback;
    const rect = plato.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return fallback;
    const anchoUtil = ANCHO_VISTA - 2 * MARGEN_VISTA;
    const altoUtil = ALTO_VISTA - 2 * MARGEN_VISTA;
    const pX = ((e.clientX - rect.left) / rect.width) * ANCHO_VISTA;
    const pY = ((e.clientY - rect.top) / rect.height) * ALTO_VISTA;
    return {
      x: Math.max(0, Math.min(1, (pX - MARGEN_VISTA) / anchoUtil)),
      // Y invertida: pos.y=1 (norte) arriba, pos.y=0 (sur) abajo.
      y: Math.max(0, Math.min(1, (ALTO_VISTA - MARGEN_VISTA - pY) / altoUtil)),
    };
  }

  function iniciarArrastreArbol(e: React.PointerEvent<HTMLButtonElement>, arbol: Arbol) {
    e.stopPropagation();
    e.preventDefault();
    const local = posLocales[arbol.id];
    const mismaHuerta = local && local.h === (arbol.huertoId ?? "");
    const orig = mismaHuerta
      ? { x: local.x, y: local.y }
      : { x: arbol.posX ?? 0.5, y: arbol.posY ?? 0.5 };
    dragRef.current = {
      id: arbol.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: orig.x,
      origY: orig.y,
      movido: false,
    };
    setArbolArrastrado(arbol.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moverArrastreArbol(e: React.PointerEvent<HTMLButtonElement>, arbol: Arbol) {
    const drag = dragRef.current;
    if (!drag || drag.id !== arbol.id) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 4 && !drag.movido) return;
    drag.movido = true;
    const orig = { x: drag.origX, y: drag.origY };
    const nueva = posDesdeEvento(e, orig);
    const h = arbol.huertoId ?? "";
    setPosLocales((prev) => ({ ...prev, [arbol.id]: { ...nueva, h } }));
  }

  function terminarArrastreArbol(e: React.PointerEvent<HTMLButtonElement>, arbol: Arbol) {
    const drag = dragRef.current;
    dragRef.current = null;
    setArbolArrastrado(null);
    if (!drag || drag.id !== arbol.id) return;
    // Clic corto (sin mover): abre el diálogo como antes.
    if (!drag.movido) {
      setEditando(arbol);
      return;
    }
    const destino = posDesdeEvento(e, { x: arbol.posX ?? 0.5, y: arbol.posY ?? 0.5 });
    const redondeado = {
      x: Math.round(Math.max(0, Math.min(1, destino.x)) * 1000) / 1000,
      y: Math.round(Math.max(0, Math.min(1, destino.y)) * 1000) / 1000,
    };
    setPosLocales((prev) => ({ ...prev, [arbol.id]: { ...redondeado, h: arbol.huertoId ?? "" } }));
    startTransition(async () => {
      const result = await moverArbol(arbol.id, redondeado);
      if (!result || "error" in result) {
        const mensaje = result && "error" in result ? result.error : "No se pudo mover el árbol.";
        toast.error(mensaje);
        // Revertir al valor del servidor.
        setPosLocales((prev) => {
          const copia = { ...prev };
          delete copia[arbol.id];
          return copia;
        });
        return;
      }
      toast.success("Árbol reubicado.");
      router.refresh();
    });
  }

  function cancelarArrastreArbol(arbol: Arbol) {
    if (dragRef.current?.id !== arbol.id) return;
    dragRef.current = null;
    setArbolArrastrado(null);
    setPosLocales((prev) => {
      const copia = { ...prev };
      delete copia[arbol.id];
      return copia;
    });
  }

  function centrar2d() {
    setZoom2d(1);
    setPan2d({ x: 0, y: 0 });
  }

  const huerto = huertos.find((h) => h.id === huertoId) ?? huertos[0] ?? null;
  const arbolesPlano = useMemo(
    () => (huerto ? arboles.filter((a) => a.huertoId === huerto.id) : []),
    [arboles, huerto],
  );
  // Se derivan en render (sin effects): solo aplican al huerto del árbol
  // y se ignoran cuando el servidor ya las confirmó.
  const arbolesPlanoConPos = useMemo(
    () =>
      arbolesPlano.map((a) => {
        const local = posLocales[a.id];
        if (!local || local.h !== (a.huertoId ?? "")) return a;
        const sx = a.posX ?? 0.5;
        const sy = a.posY ?? 0.5;
        if (Math.abs(local.x - sx) < 0.0005 && Math.abs(local.y - sy) < 0.0005) return a;
        return { ...a, posX: local.x, posY: local.y };
      }),
    [arbolesPlano, posLocales],
  );
  const feature = huerto?.feature ?? null;
  const vista = useMemo(
    () => (feature ? crearVistaPlano(feature.geometry.coordinates) : null),
    [feature],
  );

  const clipId = useId().replace(/[^a-zA-Z0-9]/g, "");
  // Aspecto real en metros: el plato y el polígono comparten proyección.
  // Sin esto, un huerto alargado/diagonal se ve como un rombo flotando
  // sobre un rectángulo genérico (preserveAspectRatio="none" lo estiraba).
  const aspectoTerreno = useMemo(() => {
    if (!vista) return 16 / 9;
    try {
      const m = bboxEnMetros(vista.bbox);
      if (!Number.isFinite(m.aspecto) || m.aspecto <= 0) return 16 / 9;
      return Math.max(0.35, Math.min(3.5, m.aspecto));
    } catch {
      return 16 / 9;
    }
  }, [vista]);
  const unidadesALanzar = useMemo(
    () =>
      expandirUnidades(
        arboles
          .filter((a) => !a.huertoId || a.huertoId === huerto?.id)
          .map((a) => ({ especie: a.especie, cantidad: a.cantidad })),
      ).length,
    [arboles, huerto?.id],
  );
  const unidadesNuevas = useMemo(
    () =>
      expandirUnidades(
        arboles
          .filter((a) => !a.huertoId)
          .map((a) => ({ especie: a.especie, cantidad: a.cantidad })),
      ).length,
    [arboles],
  );
  const nadaPorSincronizar = unidadesALanzar === 0 && arbolesPlano.length === 0;
  const leyenda = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const a of arbolesPlano) {
      conteo.set(a.especie, (conteo.get(a.especie) ?? 0) + 1);
    }
    return [...conteo.entries()].map(([especie, total]) => ({
      especie,
      total,
      color: colorDeEspecie(especie),
    }));
  }, [arbolesPlano]);

  function sincronizar() {
    if (!huerto || !huerto.feature) return;
    if (unidadesALanzar === 0) {
      toast.error("No hay árboles para sincronizar. Registra árboles en tu inventario.");
      return;
    }
    if (
      !window.confirm(
        `Sincronizar plano: tus ${unidadesALanzar} árbol(es) se convertirán en unidades individuales y se distribuirán en la matriz de "${huerto.nombre}". ¿Continuar?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await sincronizarPlanoHuerto(huerto.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Plano sincronizado: ${result.total} árboles en la matriz.`);
      router.refresh();
    });
  }

  if (huertos.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Delimita un huerto en el mapa de tu perfil para poder ver su plano con
          la matriz de árboles.
        </p>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full" render={<Link href="/perfil" />}>
          Ir al mapa <MapPin data-icon="inline-end" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {huertos.length > 1 ? (
          <Select value={huerto?.id ?? undefined} onValueChange={elegirHuerto}>
            <SelectTrigger className="w-52 min-h-9" aria-label="Huerto del plano">
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
        ) : (
          <span className="text-sm font-medium">{huerto?.nombre}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className={modoForzado ? "hidden" : "flex items-center rounded-lg border p-0.5"} role="group" aria-label="Modo de vista">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`min-h-8 rounded-md px-2.5 ${modo === "2d" ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
              onClick={() => setModo("2d")}
              aria-pressed={modo === "2d"}
            >
              Posicionar árboles
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`min-h-8 rounded-md px-2.5 ${modo === "3d" ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
              onClick={() => setModo("3d")}
              aria-pressed={modo === "3d"}
            >
              Visualización 3D
            </Button>
          </div>
          {unidadesNuevas > 0 ? (
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={sincronizar}
              disabled={pending || !huerto?.feature}
              title="Los ejemplares antiguos sin posición se reparten en el mapa"
            >
              <RefreshCw className={pending ? "animate-spin" : undefined} />
              {pending
                ? "Ubicando…"
                : `Ubicar ${unidadesNuevas} pendiente${unidadesNuevas === 1 ? "" : "s"} en el mapa`}
            </Button>
          ) : null}
        </div>
      </div>

      {en3d ? (
        <div className="relative h-[480px] overflow-hidden rounded-xl border bg-[#0b1a12] md:h-[600px]">
          {vista && feature ? (
            <PlanoHuerto3D
              coordinates={feature.geometry.coordinates}
              arboles={arbolesPlano.map((a) => ({
                id: a.id,
                especie: a.especie,
                posX: a.posX ?? 0.5,
                posY: a.posY ?? 0.5,
              }))}
              onEditar={(id) => {
                const encontrado = arbolesPlano.find((a) => a.id === id);
                if (encontrado) setEditando(encontrado);
              }}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-emerald-50/80">
              Este huerto no tiene un polígono válido en el mapa.
            </p>
          )}
        </div>
      ) : (
      <div
        ref={marco2dRef}
        className={`relative h-[480px] overflow-hidden rounded-xl border bg-gradient-to-b from-sky-100 to-emerald-50 md:h-[600px] dark:from-sky-950/50 dark:to-emerald-950/30 ${
          arrastrando2d ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "none" }}
        onPointerDown={iniciarPan2d}
        onPointerMove={moverPan2d}
        onPointerUp={terminarPan2d}
        onPointerCancel={terminarPan2d}
      >
          {/* Controles de zoom */}
          <div className="absolute left-2 top-2 z-30 flex items-center gap-1 rounded-full border bg-white/90 p-1 shadow-sm">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-7 rounded-full px-0"
              onClick={() => setZoom2d((z) => Math.max(0.6, z / 1.2))}
              aria-label="Acercar menos"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-11 text-center font-mono text-[11px] text-muted-foreground">
              {Math.round(zoom2d * 100)}%
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-7 rounded-full px-0"
              onClick={() => setZoom2d((z) => Math.min(2.8, z * 1.2))}
              aria-label="Acercar más"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-7 rounded-full px-0"
              onClick={centrar2d}
              disabled={zoom2d === 1 && pan2d.x === 0 && pan2d.y === 0}
              aria-label="Centrar plano"
              title="Centrar plano"
            >
              <Maximize className="size-4" />
            </Button>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{
              transform: `translate(${pan2d.x}px, ${pan2d.y}px) scale(${zoom2d})`,
              transition: arrastrando2d ? "none" : "transform 200ms ease-out",
            }}
          >
          <div
            ref={platoRef}
            className="relative max-h-full rounded-md shadow-[0_18px_35px_rgba(0,0,0,0.30)]"
            style={{
              aspectRatio: `${aspectoTerreno}`,
              height: aspectoTerreno >= 1.4 ? "auto" : "88%",
              width: aspectoTerreno >= 1.4 ? "88%" : "auto",
              maxWidth: "100%",
              backgroundColor: "#4c5a2c",
              backgroundImage: `${TEXTURA_TIERRA}, ${TEXTURA_TIERRA_GRUESA}, linear-gradient(155deg, #5e6f36, #42501f)`,
              backgroundBlendMode: "soft-light, overlay, normal",
              backgroundSize: "220px 220px, 140px 140px, cover",
            }}
          >
          {vista ? (
            <>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full"
                aria-hidden
              >
                <defs>
                  <clipPath id={`plano-${clipId}`}>
                    <path d={vista.path} clipRule="evenodd" />
                  </clipPath>
                </defs>
                {/* Plato base: textura tierra a todo el bbox */}
                <rect x="0" y="0" width="100" height="100" fill="transparent" />
                {/* Relleno + grilla RECORTADOS al polígono: ya no flotan como segunda capa */}
                <g clipPath={`url(#plano-${clipId})`}>
                  <rect x="0" y="0" width="100" height="100" className="fill-emerald-200/30" />
                  <path d={LINEAS_MATRIZ} stroke="currentColor" strokeWidth={0.15} className="text-white" opacity={0.22} fill="none" />
                </g>
                {/* Borde del polígono: la única línea que define el huerto */}
                <path
                  d={vista.path}
                  fill="none"
                  fillRule="evenodd"
                  className="stroke-lime-100"
                  strokeWidth={0.9}
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              </svg>
              {arbolesPlanoConPos.map((arbol) => {
                const p = posAVista({ x: arbol.posX ?? 0.5, y: arbol.posY ?? 0.5 }, vista);
                const activo = arbolArrastrado === arbol.id;
                return (
                  <button
                    key={arbol.id}
                    type="button"
                    data-arbol-id={arbol.id}
                    onPointerDown={(e) => iniciarArrastreArbol(e, arbol)}
                    onPointerMove={(e) => moverArrastreArbol(e, arbol)}
                    onPointerUp={(e) => terminarArrastreArbol(e, arbol)}
                    onPointerCancel={() => cancelarArrastreArbol(arbol)}
                    aria-label={`Mover ${nombreDeEspecie(arbol.especie)} en el plano (arrastrar) o editar con un toque`}
                    className={`absolute z-10 ${activo ? "z-20" : ""}`}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      transform: "translate(-50%, -80%)",
                      touchAction: "none",
                      cursor: activo ? "grabbing" : "grab",
                    }}
                  >
                      <span className={`block outline-none transition-transform hover:scale-125 focus-visible:scale-125 ${activo ? "scale-125" : ""}`}>
                        <IconoArbol
                          especie={arbol.especie}
                          className="block h-9 w-7 drop-shadow-md"
                        />
                      </span>
                  </button>
                );
              })}
            </>
          ) : (
            <p className="text-sm text-emerald-50/80">
              Este huerto no tiene un polígono válido en el mapa.
            </p>
          )}
          {vista && arbolesPlano.length === 0 && (nadaPorSincronizar || unidadesNuevas > 0) ? (
            <p className="pointer-events-none absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 text-center text-xs text-emerald-50/85">
              {nadaPorSincronizar
                ? "Aún no tienes árboles. En el tab Terreno (satélite) pulsa «Marcar árboles» y toca tu terreno para plantarlos."
                : `Tienes ${unidadesNuevas} árbol${unidadesNuevas === 1 ? "" : "es"} sin ubicar. Pulsa «Ubicar ${unidadesNuevas} pendiente${unidadesNuevas === 1 ? "" : "s"} en el mapa».`}
            </p>
          ) : null}
          </div>
          </div>
      </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {arbolesPlano.length} árbol{arbolesPlano.length === 1 ? "" : "es"} en el
          plano · Superficie: {huerto ? formatAreaM2(huerto.superficieM2) : "—"}
        </span>
        <span>{en3d ? "En 3D, arrastra para orbitar · rueda para zoom · clic en un árbol para editarlo" : "Planta en el tab Terreno (satélite) con «Marcar árboles» · arrastra un árbol para reubicarlo (se guarda al soltar) · clic corto para editarlo · arrastra el fondo para mover el plano"}</span>
      </div>

      {leyenda.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {leyenda.map((item) => (
            <Link
              key={item.especie}
              href={`/especie/especies/${item.especie}`}
              title={`Ver ficha de ${nombreDeEspecie(item.especie)}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs transition-colors hover:bg-muted/50"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {nombreDeEspecie(item.especie)}
              <span className="font-mono text-muted-foreground">×{item.total}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        {editando ? (
          <EditarArbolDialog
            key={editando.id}
            arbol={editando}
            especies={especies}
            onCerrar={() => setEditando(null)}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

