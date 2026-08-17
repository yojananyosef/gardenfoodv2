"use client";

import { useState, useOptimistic, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DIAS_SEMANA_CORTA,
  MESES,
  fechaISO,
  grillaDelMes,
} from "@/lib/fechas";
import { agregarTarea, avanzarEstadoTarea, eliminarTarea } from "@/lib/huerto/actions";
import { ETIQUETA_TIPO } from "@/components/huerto/TareasDelDia";
import type { Tarea, TipoTarea } from "@/types";

export interface Sugerencia {
  dbKey: string;
  tipo: TipoTarea;
  descripcion: string;
  mes: string;
}

interface Props {
  tareasMes: Tarea[];
  sugerencias: Sugerencia[];
  anioInicial: number;
  mesInicial: number;
}

export function CalendarioView({
  tareasMes,
  sugerencias,
  anioInicial,
  mesInicial,
}: Props) {
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(mesInicial);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [textoCustom, setTextoCustom] = useState("");
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(tareasMes);

  const hoy = new Date();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();
  const celdas = grillaDelMes(anio, mes);

  const diaActual = esMesActual ? hoy.getDate() : null;
  const fechaSel = diaSeleccionado ? fechaISO(anio, mes, diaSeleccionado) : null;

  function cambiarMes(delta: number) {
    const siguiente = new Date(anio, mes + delta, 1);
    setAnio(siguiente.getFullYear());
    setMes(siguiente.getMonth());
    setDiaSeleccionado(null);
  }

  function tareasDelDia(dia: number): Tarea[] {
    const iso = fechaISO(anio, mes, dia);
    return optimistic.filter((t) => t.fecha === iso);
  }

  function handleAvanzar(tarea: Tarea) {
    const estados = ["pendiente", "en_proceso", "completada"] as const;
    const siguiente = estados[(estados.indexOf(tarea.estado) + 1) % estados.length];
    setOptimistic((prev) =>
      prev.map((t) => (t.id === tarea.id ? { ...t, estado: siguiente } : t)),
    );
    startTransition(async () => {
      const result = await avanzarEstadoTarea(tarea.id, tarea.estado);
      if (result.error) toast.error(result.error);
    });
  }

  function handleEliminar(tarea: Tarea) {
    setOptimistic((prev) => prev.filter((t) => t.id !== tarea.id));
    startTransition(async () => {
      const result = await eliminarTarea(tarea.id);
      if (result.error) toast.error(result.error);
    });
  }

  function handleAgregarCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaSel || !textoCustom.trim()) return;
    startTransition(async () => {
      const result = await agregarTarea({
        fecha: fechaSel,
        tipo: "personalizada",
        texto: textoCustom.trim(),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTextoCustom("");
      toast.success("Tarea agregada.");
    });
  }

  function agregarSugerencia(s: Sugerencia) {
    if (!fechaSel) return;
    const yaExiste = optimistic.some(
      (t) => t.origenId === `${s.dbKey}-${s.tipo}` && t.fecha === fechaSel,
    );
    if (yaExiste) return;
    startTransition(async () => {
      const result = await agregarTarea({
        fecha: fechaSel,
        especie: s.dbKey,
        tipo: s.tipo,
        texto: s.descripcion,
        origenId: `${s.dbKey}-${s.tipo}`,
      });
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mes anterior"
          className="min-h-12 min-w-12"
          onClick={() => cambiarMes(-1)}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <h2 className="font-fraunces text-xl font-semibold">
          {MESES[mes]} {anio}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mes siguiente"
          className="min-h-12 min-w-12"
          onClick={() => cambiarMes(1)}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA_CORTA.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[11px] font-medium uppercase text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) {
            return <div key={`v-${i}`} className="h-12" />;
          }
          const tareas = tareasDelDia(dia);
          const esHoy = dia === diaActual;
          const esSel = dia === diaSeleccionado;
          return (
            <button
              key={dia}
              type="button"
              onClick={() => setDiaSeleccionado(dia)}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                esSel
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-transparent hover:border-muted hover:bg-muted",
                esHoy && "ring-2 ring-primary/60",
              )}
            >
              <span>{dia}</span>
              {tareas.length > 0 ? (
                <span className="mt-0.5 flex gap-0.5">
                  {tareas.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        t.estado === "completada" ? "bg-primary" : "bg-amber-400",
                      )}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {fechaSel ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            {new Date(`${fechaSel}T00:00:00`).toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>

          <div className="flex flex-col gap-2">
            {tareasDelDia(diaSeleccionado!).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin tareas para este día.
              </p>
            ) : (
              tareasDelDia(diaSeleccionado!).map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg border bg-card px-4 py-3",
                    t.estado === "completada" && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {ETIQUETA_TIPO[t.tipo]}
                    </span>
                    <p className="text-sm text-foreground">{t.texto}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-12 text-muted-foreground"
                      onClick={() => handleAvanzar(t)}
                    >
                      {t.estado === "completada" ? "Completada" : "Marcar"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-12 text-muted-foreground hover:text-destructive"
                      onClick={() => handleEliminar(t)}
                    >
                      Borrar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAgregarCustom} className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="tarea-custom" className="text-xs">
                Agregar tarea personalizada
              </Label>
              <Input
                id="tarea-custom"
                value={textoCustom}
                onChange={(e) => setTextoCustom(e.target.value)}
                placeholder="Ej: Airear compost"
                className="min-h-12"
              />
            </div>
            <Button type="submit" className="mt-5 min-h-12 shrink-0">
              <Plus className="size-4" aria-hidden />
              <span className="sr-only">Agregar</span>
            </Button>
          </form>

          {sugerencias.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold">
                Sugerencias agronómicas · {MESES[mes]}
              </h4>
              {sugerencias.map((s, i) => {
                const yaAgregada = optimistic.some(
                  (t) =>
                    t.origenId === `${s.dbKey}-${s.tipo}` && t.fecha === fechaSel,
                );
                return (
                  <div
                    key={`${s.dbKey}-${s.tipo}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {ETIQUETA_TIPO[s.tipo]}
                      </span>
                      <p className="text-sm text-foreground">{s.descripcion}</p>
                    </div>
                    <Button
                      type="button"
                      variant={yaAgregada ? "secondary" : "outline"}
                      size="sm"
                      className="min-h-12 shrink-0"
                      disabled={yaAgregada}
                      onClick={() => agregarSugerencia(s)}
                    >
                      {yaAgregada ? "Agregada" : "Agregar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Toca un día para ver sus tareas y sugerencias.
        </p>
      )}
    </div>
  );
}