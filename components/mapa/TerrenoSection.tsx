"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Maximize, MousePointerClick, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { TerrenoMap, type HuertoMapa, type TerrenoMapHandle } from "@/components/mapa/TerrenoMap";
import { EditarArbolDialog } from "@/components/huerto/EditarArbolDialog";
import { actualizarHuerto, crearHuerto, eliminarHuerto } from "@/lib/huerto/huertos";
import { agregarArbolEnMapa } from "@/lib/huerto/huertos";
import { listarEspecies } from "@/lib/huerto/actions";
import {
  formatAreaM2,
  parseTerrenoFeature,
  terrenoAreaM2,
  terrenoCentro,
  type TerrenoFeature,
} from "@/lib/huerto/terreno";
import { FREE_LIMITS, limitesDe, type PlanAcceso } from "@/lib/payments/plans";
import type { Arbol } from "@/types";

type HuertoItem = HuertoMapa & { superficieM2: number };

type OpcionEspecie = { dbKey: string; nombre: string };

/** Card única del huerto activo (nombre editable, superficie, ver en grande)
 *  con stepper ‹ › para ciclar sin lista vertical larga. El cambio usa el
 *  mismo `onHuertoChange` que el selector superior y el click en polígonos,
 *  así card, mapa y contadores quedan sincronizados. */
function CardHuertoActivo({
  huertos,
  huertoId,
  renombrandoId,
  nombreBorrador,
  onNombreBorrador,
  onIniciarRenombre,
  onGuardarNombre,
  onCambiarHuerto,
  urlGoogleMaps,
}: {
  huertos: HuertoItem[];
  huertoId: string | null;
  renombrandoId: string | null;
  nombreBorrador: string;
  onNombreBorrador: (nombre: string) => void;
  onIniciarRenombre: (huerto: HuertoItem) => void;
  onGuardarNombre: (id: string) => void;
  onCambiarHuerto: (id: string) => void;
  urlGoogleMaps: (huerto: HuertoItem) => string;
}) {
  const indice = Math.max(
    0,
    huertos.findIndex((h) => h.id === huertoId),
  );
  const huerto = huertos[indice] ?? huertos[0];
  if (!huerto) return null;
  const total = huertos.length;

  function paso(delta: 1 | -1) {
    if (total < 2) return;
    const siguiente = huertos[(indice + delta + total) % total];
    if (siguiente) onCambiarHuerto(siguiente.id);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {renombrandoId === huerto.id ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onGuardarNombre(huerto.id);
            }}
          >
            <Input
              value={nombreBorrador}
              onChange={(e) => onNombreBorrador(e.target.value)}
              maxLength={60}
              autoFocus
              aria-label="Nombre del huerto"
              className="min-h-9"
            />
            <Button type="submit" variant="outline" size="icon" className="min-h-9 min-w-9" aria-label="Guardar nombre">
              <Check className="size-4" />
            </Button>
          </form>
        ) : (
          <>
            <span className="text-sm font-medium">{huerto.nombre}</span>
            <span className="ml-auto flex items-center gap-1">
              {total > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Huerto anterior"
                    onClick={() => paso(-1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {/* Puntos de salto directo: posición + acceso al N°7 sin
                      ciclar (usuarios con 8+ huertos). Activo destacado. */}
                  <span className="flex max-w-32 flex-wrap items-center justify-center gap-1" role="group" aria-label="Ir a un huerto">
                    {huertos.map((h, i) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onCambiarHuerto(h.id)}
                        aria-label={`Ir a ${h.nombre} (huerto ${i + 1} de ${total})`}
                        aria-current={i === indice ? "true" : undefined}
                        title={`${h.nombre} (${i + 1} de ${total})`}
                        className="flex p-1.5"
                      >
                        <span
                          aria-hidden
                          className={
                            i === indice
                              ? "size-2 rounded-full bg-primary"
                              : "size-2 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/60"
                          }
                        />
                      </button>
                    ))}
                  </span>
                  <span className="sr-only" aria-live="polite">
                    Huerto {indice + 1} de {total}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Huerto siguiente"
                    onClick={() => paso(1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-9 min-w-9 text-muted-foreground hover:text-foreground"
                aria-label={`Renombrar ${huerto.nombre}`}
                onClick={() => onIniciarRenombre(huerto)}
              >
                <Pencil className="size-4" />
              </Button>
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatAreaM2(huerto.superficieM2)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-7 gap-1 px-2 text-xs"
          render={
            <a
              href={urlGoogleMaps(huerto)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Maximize className="size-3" />
          Ver en grande
        </Button>
      </div>
    </div>
  );
}

export function TerrenoSection({
  alto = 520,
  huertoId,
  onHuertoChange,
  huertosIniciales,
  arbolesIniciales,
}: {
  alto?: number;
  /** Huerto activo global (lo controla el Workbench junto a los tabs). */
  huertoId?: string | null;
  onHuertoChange?: (id: string | null) => void;
  /** Datos ya cargados en servidor (/huerto): evitan refetchear huertos+árboles en cliente. */
  huertosIniciales?: { id: string; nombre: string; superficieM2: number; feature: HuertoItem["feature"] | null }[];
  arbolesIniciales?: Arbol[];
}) {
  const router = useRouter();
  const [huertos, setHuertos] = useState<HuertoItem[]>(() =>
    (huertosIniciales ?? []).flatMap((h) =>
      h.feature ? [{ id: h.id, nombre: h.nombre, feature: h.feature, superficieM2: h.superficieM2 }] : [],
    ),
  );
  const [arboles, setArboles] = useState<Arbol[]>(() => arbolesIniciales ?? []);
  const [especies, setEspecies] = useState<OpcionEspecie[]>([]);
  // Si el server ya entregó huertos+árboles, no mostramos esqueleto completo:
  // solo falta el catálogo de especies + límites (rápido).
  const [cargando, setCargando] = useState(!(huertosIniciales && arbolesIniciales));
  const [limiteHuertos, setLimiteHuertos] = useState<number | null>(null);
  const [limiteArboles, setLimiteArboles] = useState<number | null>(null);
  const [modoMarca, setModoMarca] = useState(false);
  const [especieActiva, setEspecieActiva] = useState<string | null>(null);
  const mapaRef = useRef<TerrenoMapHandle>(null);
  const [renombrandoId, setRenombrandoId] = useState<string | null>(null);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [arbolEditando, setArbolEditando] = useState<Arbol | null>(null);

  const tieneIniciales = Boolean(huertosIniciales && arbolesIniciales);
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (tieneIniciales) {
          // Ruta rápida: el server ya dio huertos+árboles; solo faltan
          // especies + plan (sin consultas pesadas a gf_huertos/gf_arboles).
          const [perfilRes, especiesRes] = await Promise.all([
            supabase.from("perfiles").select("plan").eq("id", user.id).maybeSingle(),
            listarEspecies(),
          ]);
          if (active) {
            setEspecies(especiesRes);
            setEspecieActiva((prev) => prev ?? especiesRes[0]?.dbKey ?? null);
            const plan = (perfilRes.data?.plan as PlanAcceso | undefined) ?? "gratuito";
            const limites = limitesDe(plan);
            setLimiteHuertos(limites.huertos);
            setLimiteArboles(limites.arboles);
          }
        } else {
          const [huertosRes, arbolesRes, perfilRes, especiesRes] = await Promise.all([
            supabase
              .from("gf_huertos")
              .select("id, nombre, terreno_geojson, superficie_m2, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: true }),
            supabase
              .from("gf_arboles")
              .select(
                "id, especie, cantidad, fecha_plantacion, observaciones, huerto_id, pos_x, pos_y, created_at",
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: true }),
            supabase.from("perfiles").select("plan").eq("id", user.id).maybeSingle(),
            listarEspecies(),
          ]);
          if (active) {
            const listaHuertos = (huertosRes.data ?? []).flatMap((row) => {
              const feature = parseTerrenoFeature(row.terreno_geojson);
              if (!feature) return [];
              return [
                {
                  id: row.id as string,
                  nombre: (row.nombre as string) ?? "Mi huerto",
                  feature,
                  superficieM2: Number(row.superficie_m2 ?? 0),
                },
              ];
            });
            const listaArboles: Arbol[] = (arbolesRes.data ?? []).map((row) => ({
              id: row.id as string,
              especie: row.especie as string,
              cantidad: Number(row.cantidad ?? 1),
              fechaPlantacion: (row.fecha_plantacion as string | null) ?? null,
              observaciones: (row.observaciones as string | null) ?? null,
              huertoId: (row.huerto_id as string | null) ?? null,
              posX: row.pos_x === null ? null : Number(row.pos_x),
              posY: row.pos_y === null ? null : Number(row.pos_y),
              createdAt: (row.created_at as string) ?? new Date().toISOString(),
            }));
            setHuertos(listaHuertos);
            setArboles(listaArboles);
            setEspecies(especiesRes);
            setEspecieActiva(especiesRes[0]?.dbKey ?? null);
            const plan = (perfilRes.data?.plan as PlanAcceso | undefined) ?? "gratuito";
            const limites = limitesDe(plan);
            setLimiteHuertos(limites.huertos);
            setLimiteArboles(limites.arboles);
          }
        }
      }
      if (active) setCargando(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const puedeDibujar = limiteHuertos === null || huertos.length < limiteHuertos;
  const puedeMarcar = limiteArboles === null || arboles.length < limiteArboles;

  const huertosRef = useRef(huertos);
  useEffect(() => {
    huertosRef.current = huertos;
  }, [huertos]);

  // Los datos del server (router.refresh tras mover/crear/eliminar en 2D, 3D
  // o satélite) son la fuente de verdad: al cambiar las props iniciales se
  // sincronizan al estado local para que el satélite refleje lo movido en 2D.
  const huertosInicialesRef = useRef(huertosIniciales);
  const arbolesInicialesRef = useRef(arbolesIniciales);
  useEffect(() => {
    if (huertosIniciales && huertosIniciales !== huertosInicialesRef.current) {
      huertosInicialesRef.current = huertosIniciales;
      setHuertos(
        huertosIniciales.flatMap((h) =>
          h.feature ? [{ id: h.id, nombre: h.nombre, feature: h.feature, superficieM2: h.superficieM2 }] : [],
        ),
      );
    }
    if (arbolesIniciales && arbolesIniciales !== arbolesInicialesRef.current) {
      arbolesInicialesRef.current = arbolesIniciales;
      setArboles(arbolesIniciales);
    }
  }, [huertosIniciales, arbolesIniciales]);

  // El huerto activo lo controla el Workbench: al cambiar arriba se encuadra
  // el mapa (se salta el primer render, el mapa ya ajusta a todo al montar).
  const huertoIdPrevioRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (huertoIdPrevioRef.current === undefined) {
      huertoIdPrevioRef.current = huertoId ?? null;
      return;
    }
    huertoIdPrevioRef.current = huertoId ?? null;
    if (huertoId) mapaRef.current?.encuadrarHuerto(huertoId);
  }, [huertoId]);

  const mensajeUpsellArboles = useCallback(() => {
    toast.error(
      `Llegaste al límite de ${FREE_LIMITS.arboles} árbol del plan gratuito. Pásate a Huertero para agregar todos los árboles que ves.`,
      {
        action: { label: "Ver planes", onClick: () => router.push("/pricing") },
      },
    );
  }, [router]);

  async function handleCrear(feature: TerrenoFeature): Promise<string | null> {
    const result = await crearHuerto({ feature });
    if (!result.ok) {
      if (result.limite) {
        toast.error(result.error, {
          action: { label: "Ver planes", onClick: () => router.push("/pricing") },
        });
      } else {
        toast.error(result.error);
      }
      return null;
    }
    setHuertos((prev) => [...prev, { ...result.huerto }]);
    onHuertoChange?.(result.huerto.id);
    router.refresh();
    toast.success(`"${result.huerto.nombre}" guardado en el mapa.`);
    return result.huerto.id;
  }

  function handleEditar(id: string, feature: TerrenoFeature) {
    const superficieM2 = Math.round(terrenoAreaM2(feature.geometry.coordinates));
    setHuertos((prev) =>
      prev.map((h) => (h.id === id ? { ...h, feature, superficieM2 } : h)),
    );
    void (async () => {
      const result = await actualizarHuerto(id, { feature });
      if (!result.ok) toast.error(result.error);
    })();
  }

  async function handleEliminar(id: string): Promise<boolean> {
    const huerto = huertosRef.current.find((h) => h.id === id);
    if (!huerto) return false;
    if (
      !window.confirm(
        `¿Eliminar "${huerto.nombre}" del mapa? Se borrará el polígono guardado y sus árboles quedarán sin huerto.`,
      )
    ) {
      return false;
    }
    const result = await eliminarHuerto(id);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setHuertos((prev) => prev.filter((h) => h.id !== id));
    setArboles((prev) =>
      prev.map((a) => (a.huertoId === id ? { ...a, huertoId: null, posX: null, posY: null } : a)),
    );
    const restantes = huertosRef.current.filter((h) => h.id !== id);
    onHuertoChange?.(restantes[0]?.id ?? null);
    router.refresh();
    toast.success("Huerto eliminado.");
    return true;
  }

  function handleLimite() {
    toast.error(
      `Llegaste al límite de ${FREE_LIMITS.huertos} huerto del plan gratuito. Pásate a Huertero para delimitar todos tus huertos.`,
      {
        action: { label: "Ver planes", onClick: () => router.push("/pricing") },
      },
    );
  }

  function alternarModoMarca() {
    if (!modoMarca && !puedeMarcar) {
      mensajeUpsellArboles();
      return;
    }
    setModoMarca((v) => !v);
  }

  async function handleMarcarArbol(
    huertoId: string,
    lat: number,
    lng: number,
  ): Promise<string | null> {
    if (!especieActiva) {
      toast.error("Elige la especie activa para agregar.");
      return null;
    }
    const result = await agregarArbolEnMapa({ huertoId, lat, lng, especie: especieActiva });
    if (!result.ok) {
      if (result.limite) {
        mensajeUpsellArboles();
      } else {
        toast.error(result.error);
      }
      return null;
    }
    const nuevo: Arbol = {
      id: result.arbol.id,
      especie: result.arbol.especie,
      cantidad: 1,
      fechaPlantacion: null,
      observaciones: null,
      huertoId: result.arbol.huertoId,
      posX: result.arbol.posX,
      posY: result.arbol.posY,
      createdAt: new Date().toISOString(),
    };
    setArboles((prev) => [...prev, nuevo]);
    router.refresh();
    return nuevo.id;
  }

  function handleFueraHuerto() {
    toast.error("Agrega dentro de un huerto delimitado.");
  }

  function iniciarRenombre(huerto: HuertoItem) {
    setRenombrandoId(huerto.id);
    setNombreBorrador(huerto.nombre);
  }

  function guardarNombre(id: string) {
    const nombre = nombreBorrador.trim();
    setRenombrandoId(null);
    const actual = huertos.find((h) => h.id === id);
    if (!nombre || !actual || nombre === actual.nombre) return;
    void (async () => {
      const result = await actualizarHuerto(id, { nombre });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHuertos((prev) => prev.map((h) => (h.id === id ? { ...h, nombre } : h)));
      router.refresh();
      toast.success("Nombre actualizado.");
    })();
  }

  /** Detalle del huerto en grande (pestaña nueva): pin sobre el centroide
   *  (q=lat,lng) + satelital directo (t=k) + zoom 18. El pin evita que el
   *  usuario se pierda; el nombre del botón es neutro a propósito. */
  function urlGoogleMaps(huerto: HuertoItem): string {
    const centro = terrenoCentro(huerto.feature.geometry.coordinates);
    return `https://maps.google.com/maps?q=${centro.lat},${centro.lng}&z=18&t=k`;
  }

  if (cargando) {
    // Esqueleto con el mismo alto del contenido real (botonera + mapa) para
    // no provocar layout shift al resolver la carga en cliente.
    return (
      <div
        className="flex flex-col gap-3"
        aria-busy="true"
        aria-label="Cargando terreno"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="ml-auto h-9 w-36 animate-pulse rounded-full bg-muted" />
        </div>
        <div
          className="w-full animate-pulse rounded-md border bg-muted"
          style={{ height: alto }}
        />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {modoMarca ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 p-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <MousePointerClick className="size-4 text-primary" /> Agregando
          </span>
          <Select
            value={especieActiva ?? undefined}
            onValueChange={(value) => setEspecieActiva(value ?? null)}
          >
            <SelectTrigger className="w-48 min-h-9" aria-label="Especie activa para agregar">
              <SelectValue>
                {(value: string | null) =>
                  especies.find((e) => e.dbKey === value)?.nombre ?? "Elige especie…"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {especies.map((e) => (
                <SelectItem key={e.dbKey} value={e.dbKey}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="font-mono text-xs text-muted-foreground">
            {arboles.length} en el mapa
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto min-h-8"
            onClick={() => setModoMarca(false)}
          >
            <X className="size-4" /> Listo
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="ml-auto">
            <Button
              type="button"
              variant={huertos.length > 0 ? "outline" : "secondary"}
              size="sm"
              className="min-h-9 rounded-full"
              onClick={alternarModoMarca}
              disabled={huertos.length === 0}
              title={
                huertos.length === 0
                  ? "Dibuja un huerto en el mapa para poder agregar árboles"
                  : undefined
              }
            >
              <MousePointerClick className="size-4" /> Agregar árboles
            </Button>
          </div>
        </div>
      )}
      <TerrenoMap
        ref={mapaRef}
        alto={alto}
        huertosIniciales={huertos}
        arboles={arboles}
        puedeDibujar={puedeDibujar}
        modoMarca={modoMarca}
        huertoActivoId={huertoId ?? null}
        onSeleccionarHuerto={(id) => onHuertoChange?.(id)}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onLimite={handleLimite}
        onMarcarArbol={handleMarcarArbol}
        onEditarArbol={(id) =>
          setArbolEditando(arboles.find((a) => a.id === id) ?? null)
        }
        onFueraHuerto={handleFueraHuerto}
        nombreArbol={(especie) =>
          especies.find((e) => e.dbKey === especie)?.nombre ?? especie
        }
      />
      {huertos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no delimitas ningún huerto. Activa el ícono de polígono en el mapa
          y toca las esquinas de tu terreno para calcular su superficie.
        </p>
      ) : (
        <CardHuertoActivo
          huertos={huertos}
          huertoId={huertoId ?? null}
          renombrandoId={renombrandoId}
          nombreBorrador={nombreBorrador}
          onNombreBorrador={setNombreBorrador}
          onIniciarRenombre={iniciarRenombre}
          onGuardarNombre={guardarNombre}
          onCambiarHuerto={(id) => {
            // No arrastrar el borrador de renombre a otra card.
            setRenombrandoId(null);
            onHuertoChange?.(id);
          }}
          urlGoogleMaps={urlGoogleMaps}
        />
      )}
      <Dialog
        open={!!arbolEditando}
        onOpenChange={(open) => !open && setArbolEditando(null)}
      >
        {arbolEditando ? (
          <EditarArbolDialog
            key={arbolEditando.id}
            arbol={arbolEditando}
            especies={especies}
            onCerrar={() => setArbolEditando(null)}
            onActualizado={(actualizado) => {
              setArboles((prev) =>
                prev.map((a) => (a.id === actualizado.id ? actualizado : a)),
              );
              router.refresh();
            }}
            onEliminado={() => {
              setArboles((prev) => prev.filter((a) => a.id !== arbolEditando.id));
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
