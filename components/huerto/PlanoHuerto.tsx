"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MapPin, RefreshCw } from "lucide-react";
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
import {
  colorDeEspecie,
  crearVistaPlano,
  expandirUnidades,
  posAVista,
} from "@/lib/huerto/plano";
import { formatAreaM2 } from "@/lib/huerto/terreno";
import { getEspeciePorDbKey, type Especie } from "@/lib/agronomy";
import type { Arbol, HuertoResumen } from "@/types";

type Modo = "2d" | "3d";

const TRANSICION =
  "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
const ISO = "rotateX(60deg) rotateZ(45deg)";
const ISO_INVERSA = "rotateZ(-45deg) rotateX(-60deg)";

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
}: {
  huertos: HuertoResumen[];
  arboles: Arbol[];
  especies: Especie[];
}) {
  const router = useRouter();
  const [huertoId, setHuertoId] = useState<string | null>(huertos[0]?.id ?? null);
  const [modo, setModo] = useState<Modo>("2d");
  const [editando, setEditando] = useState<Arbol | null>(null);
  const [pending, startTransition] = useTransition();

  const huerto = huertos.find((h) => h.id === huertoId) ?? huertos[0] ?? null;
  const arbolesPlano = useMemo(
    () => (huerto ? arboles.filter((a) => a.huertoId === huerto.id) : []),
    [arboles, huerto],
  );
  const feature = huerto?.feature ?? null;
  const vista = useMemo(
    () => (feature ? crearVistaPlano(feature.geometry.coordinates) : null),
    [feature],
  );
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
          <Select value={huerto?.id ?? undefined} onValueChange={setHuertoId}>
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
          <div className="flex items-center rounded-lg border p-0.5" role="group" aria-label="Modo de vista">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`min-h-8 rounded-md px-2.5 ${modo === "2d" ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
              onClick={() => setModo("2d")}
              aria-pressed={modo === "2d"}
            >
              2D
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`min-h-8 rounded-md px-2.5 ${modo === "3d" ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
              onClick={() => setModo("3d")}
              aria-pressed={modo === "3d"}
            >
              3D
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={sincronizar}
            disabled={pending || !huerto?.feature || nadaPorSincronizar}
          >
            <RefreshCw className={pending ? "animate-spin" : undefined} />
            {pending
              ? "Sincronizando…"
              : arbolesPlano.length > 0
                ? `Completar matriz${unidadesNuevas > 0 ? ` (${unidadesNuevas})` : ""}`
                : `Sincronizar árboles${unidadesNuevas > 0 ? ` (${unidadesNuevas})` : ""}`}
          </Button>
        </div>
      </div>

      <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-b from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/30">
        <div
          className="relative h-[86%] w-[86%]"
          style={{
            transformStyle: "preserve-3d",
            transform: modo === "3d" ? ISO : "none",
            transition: TRANSICION,
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
                <path d={LINEAS_MATRIZ} stroke="currentColor" strokeWidth={0.15} className="text-foreground" opacity={0.12} fill="none" />
                <path
                  d={vista.path}
                  fillRule="evenodd"
                  className="fill-emerald-500/15 stroke-emerald-600 dark:stroke-emerald-400"
                  strokeWidth={0.7}
                  strokeLinejoin="round"
                />
              </svg>
              {arbolesPlano.map((arbol) => {
                const p = posAVista({ x: arbol.posX ?? 0.5, y: arbol.posY ?? 0.5 }, vista);
                return (
                  <button
                    key={arbol.id}
                    type="button"
                    onClick={() => setEditando(arbol)}
                    aria-label={`Editar ${nombreDeEspecie(arbol.especie)} en el plano`}
                    className="absolute z-10"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      transformStyle: "preserve-3d",
                      transform:
                        modo === "3d"
                          ? "translate(-50%, -80%) translateZ(20px)"
                          : "translate(-50%, -80%)",
                      transition: TRANSICION,
                    }}
                  >
                    <span
                      className="block outline-none transition-transform hover:scale-125 focus-visible:scale-125"
                      style={{
                        transform: modo === "3d" ? ISO_INVERSA : undefined,
                        transition: TRANSICION,
                      }}
                    >
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
            <p className="text-sm text-muted-foreground">
              Este huerto no tiene un polígono válido en el mapa.
            </p>
          )}
          {vista && arbolesPlano.length === 0 ? (
            <p className="pointer-events-none absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 text-center text-xs text-muted-foreground">
              {nadaPorSincronizar
                ? "Aún no tienes árboles. Regístralos en el inventario y luego sincroniza para distribuirlos en la matriz."
                : `Tienes ${unidadesNuevas} árbol${unidadesNuevas === 1 ? "" : "es"} por sincronizar. Pulsa «Sincronizar árboles».`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {arbolesPlano.length} árbol{arbolesPlano.length === 1 ? "" : "es"} en el
          plano · Superficie: {huerto ? formatAreaM2(huerto.superficieM2) : "—"}
        </span>
        <span>Toca un árbol para editarlo · Sincronizar reparte tu inventario en la matriz</span>
      </div>

      {leyenda.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {leyenda.map((item) => (
            <span
              key={item.especie}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {nombreDeEspecie(item.especie)}
              <span className="font-mono text-muted-foreground">×{item.total}</span>
            </span>
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

