"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { avanzarEstadoTarea } from "@/lib/huerto/actions";
import type { Tarea } from "@/types";

export const ETIQUETA_TIPO: Record<Tarea["tipo"], string> = {
  riego: "Riego",
  nutricion: "Nutrición",
  sanidad: "Sanidad",
  personalizada: "Personalizada",
};

const ESTADOS = ["pendiente", "en_proceso", "completada"] as const;

function nombreEspecie(especie: string | null): string | null {
  if (!especie) return null;
  const porSlug: Record<string, string> = {
    duraznero: "Durazno",
    ciruelo: "Ciruela",
    cerezo: "Cereza",
    damasco: "Damasco",
    nectarino: "Nectarín",
    manzano: "Manzana",
    peral: "Pera",
    membrillo: "Membrillo",
    limonero: "Limón",
    naranjo: "Naranja",
    mandarino: "Mandarina",
    pomelo: "Pomelo",
    nogal: "Nogal",
    almendro: "Almendra",
    higuera: "Higo",
    granado: "Granada",
    caqui: "Caqui",
    vid: "Vid",
    arandano: "Arándano",
    olivo: "Olivo",
    frutilla: "Frutilla",
    frambuesa: "Frambuesa",
    mora: "Mora",
    kiwi: "Kiwi",
    "avellano-europeo": "Avellano europeo",
    "nispero-japones": "Níspero japonés",
    chirimoya: "Chirimoya",
    lucuma: "Lúcuma",
    "papayo-chileno": "Papayo chileno",
    palto: "Palto",
  };
  return porSlug[especie] ?? especie;
}

export function TareaCard({ tarea }: { tarea: Tarea }) {
  const [, startTransition] = useTransition();
  const esCompletada = tarea.estado === "completada";

  function handleAvanzar() {
    startTransition(async () => {
      const result = await avanzarEstadoTarea(tarea.id, tarea.estado);
      if (result.error) {
        return;
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border bg-card px-4 py-3",
        esCompletada && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {ETIQUETA_TIPO[tarea.tipo]}
          </span>
          {tarea.especie ? (
            <span className="text-xs font-medium text-foreground">
              {nombreEspecie(tarea.especie)}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-foreground">{tarea.texto}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          esCompletada
            ? "Reabrir tarea"
            : `Marcar ${ETIQUETA_TIPO[tarea.tipo].toLowerCase()} como completada`
        }
        className="min-h-12 min-w-12 shrink-0"
        onClick={handleAvanzar}
      >
        {esCompletada ? (
          <CheckCircle2 className="size-5 text-primary" aria-hidden />
        ) : (
          <Circle className="size-5 text-muted-foreground" aria-hidden />
        )}
      </Button>
    </div>
  );
}

export function TareasDelDia({ tareas }: { tareas: Tarea[] }) {
  const [optimistic, setOptimistic] = useOptimistic(tareas);
  const [, startTransition] = useTransition();

  function handleAvanzar(tarea: Tarea) {
    const siguiente =
      ESTADOS[(ESTADOS.indexOf(tarea.estado) + 1) % ESTADOS.length];
    setOptimistic((prev) =>
      prev.map((t) => (t.id === tarea.id ? { ...t, estado: siguiente } : t)),
    );
    startTransition(async () => {
      const result = await avanzarEstadoTarea(tarea.id, tarea.estado);
      if (result.error) return;
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay tareas programadas para hoy.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {optimistic.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-lg border bg-card px-4 py-3",
            t.estado === "completada" && "opacity-60",
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {ETIQUETA_TIPO[t.tipo]}
              </span>
              {t.especie ? (
                <span className="text-xs font-medium text-foreground">
                  {nombreEspecie(t.especie)}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-foreground">{t.texto}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Marcar ${ETIQUETA_TIPO[t.tipo].toLowerCase()} como completada`}
            className="min-h-12 min-w-12 shrink-0"
            onClick={() => handleAvanzar(t)}
          >
            {t.estado === "completada" ? (
              <CheckCircle2 className="size-5 text-primary" aria-hidden />
            ) : (
              <Circle className="size-5 text-muted-foreground" aria-hidden />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}