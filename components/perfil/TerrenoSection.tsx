"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, MousePointerClick, Pencil, X } from "lucide-react";
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
import { TerrenoMap, type HuertoMapa } from "@/components/perfil/TerrenoMap";
import { EditarArbolDialog } from "@/components/huerto/EditarArbolDialog";
import { actualizarHuerto, crearHuerto, eliminarHuerto } from "@/lib/huerto/huertos";
import { agregarArbolEnMapa } from "@/lib/huerto/huertos";
import { listarEspecies } from "@/lib/huerto/actions";
import {
  formatAreaM2,
  formatCoordenadas,
  parseTerrenoFeature,
  terrenoAreaM2,
  terrenoCentro,
  type TerrenoFeature,
} from "@/lib/huerto/terreno";
import { FREE_LIMITS, limitesDe, type PlanAcceso } from "@/lib/payments/plans";
import type { Arbol } from "@/types";

type HuertoItem = HuertoMapa & { superficieM2: number };

type OpcionEspecie = { dbKey: string; nombre: string };

export function TerrenoSection() {
  const router = useRouter();
  const [huertos, setHuertos] = useState<HuertoItem[]>([]);
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [especies, setEspecies] = useState<OpcionEspecie[]>([]);
  const [cargando, setCargando] = useState(true);
  const [limiteHuertos, setLimiteHuertos] = useState<number | null>(null);
  const [limiteArboles, setLimiteArboles] = useState<number | null>(null);
  const [modoMarca, setModoMarca] = useState(false);
  const [especieActiva, setEspecieActiva] = useState<string | null>(null);
  const [renombrandoId, setRenombrandoId] = useState<string | null>(null);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [arbolEditando, setArbolEditando] = useState<Arbol | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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
      if (active) setCargando(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const puedeDibujar = limiteHuertos === null || huertos.length < limiteHuertos;
  const puedeMarcar = limiteArboles === null || arboles.length < limiteArboles;

  const huertosRef = useRef(huertos);
  useEffect(() => {
    huertosRef.current = huertos;
  }, [huertos]);

  function mensajeUpsellArboles() {
    toast.error(
      `Llegaste al límite de ${FREE_LIMITS.arboles} árbol del plan gratuito. Pásate a Huertero para marcar todos los árboles que ves.`,
      {
        action: { label: "Ver planes", onClick: () => router.push("/pricing") },
      },
    );
  }

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
      toast.error("Elige la especie activa para marcar.");
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
    return nuevo.id;
  }

  function handleFueraHuerto() {
    toast.error("Marca dentro de un huerto delimitado.");
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
      toast.success("Nombre actualizado.");
    })();
  }

  async function copiarCoordenadas(huerto: HuertoItem) {
    const texto = formatCoordenadas(
      terrenoCentro(huerto.feature.geometry.coordinates),
    );
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(huerto.id);
      window.setTimeout(() => setCopiadoId(null), 1500);
    } catch {
      toast.error("No se pudieron copiar las coordenadas.");
    }
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {modoMarca ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 p-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <MousePointerClick className="size-4 text-primary" /> Marcando
          </span>
          <Select
            value={especieActiva ?? undefined}
            onValueChange={(value) => setEspecieActiva(value ?? null)}
          >
            <SelectTrigger className="w-48 min-h-9" aria-label="Especie activa para marcar">
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
            {arboles.length} marcado{arboles.length === 1 ? "" : "s"}
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
        <div>
          <Button
            type="button"
            variant={huertos.length > 0 ? "outline" : "secondary"}
            size="sm"
            className="min-h-9"
            onClick={alternarModoMarca}
            disabled={huertos.length === 0}
            title={
              huertos.length === 0
                ? "Dibuja un huerto en el mapa para poder marcar árboles"
                : undefined
            }
          >
            <MousePointerClick className="size-4" /> Marcar árboles
          </Button>
        </div>
      )}
      <TerrenoMap
        huertosIniciales={huertos}
        arboles={arboles}
        puedeDibujar={puedeDibujar}
        modoMarca={modoMarca}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onLimite={handleLimite}
        onMarcarArbol={handleMarcarArbol}
        onEditarArbol={(id) =>
          setArbolEditando(arboles.find((a) => a.id === id) ?? null)
        }
        onFueraHuerto={handleFueraHuerto}
      />
      {huertos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no delimitas ningún huerto. Activa el ícono de polígono en el mapa
          y toca las esquinas de tu terreno para calcular su superficie.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {huertos.map((huerto) => (
            <li
              key={huerto.id}
              className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                {renombrandoId === huerto.id ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      guardarNombre(huerto.id);
                    }}
                  >
                    <Input
                      value={nombreBorrador}
                      onChange={(e) => setNombreBorrador(e.target.value)}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-9 min-w-9 text-muted-foreground hover:text-foreground"
                      aria-label={`Renombrar ${huerto.nombre}`}
                      onClick={() => iniciarRenombre(huerto)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatAreaM2(huerto.superficieM2)}
                </span>
                <span className="font-mono">
                  {formatCoordenadas(terrenoCentro(huerto.feature.geometry.coordinates))}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-7 gap-1 px-2 text-xs"
                  onClick={() => copiarCoordenadas(huerto)}
                >
                  {copiadoId === huerto.id ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copiadoId === huerto.id ? "Copiadas" : "Copiar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
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
            onActualizado={(actualizado) =>
              setArboles((prev) =>
                prev.map((a) => (a.id === actualizado.id ? actualizado : a)),
              )
            }
            onEliminado={() =>
              setArboles((prev) => prev.filter((a) => a.id !== arbolEditando.id))
            }
          />
        ) : null}
      </Dialog>
    </div>
  );
}
