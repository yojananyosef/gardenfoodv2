"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import { cn } from "@/lib/utils";
import type { Arbol, HuertoResumen } from "@/types";

type GrupoEspecie = {
  especie: string;
  nombre: string;
  filas: Arbol[];
};

/** Desglose del inventario por especie (repone el agrupado del panel
 *  eliminado): filas «Nombre ×N» expandibles a ejemplares individuales,
 *  con estado en plano/sin ubicar y puente a la ficha de la especie.
 *  Solo lectura: la edición vive en los marcadores del mapa/plano. */
export function DetalleEspecies({
  arboles,
  huertos,
}: {
  arboles: Arbol[];
  huertos: HuertoResumen[];
}) {
  const [seccionAbierta, setSeccionAbierta] = useState(false);
  const [abiertos, setAbiertos] = useState<string[]>([]);

  if (arboles.length === 0) return null;

  const grupos = new Map<string, GrupoEspecie>();
  for (const a of arboles) {
    const existente = grupos.get(a.especie);
    if (existente) {
      existente.filas.push(a);
    } else {
      grupos.set(a.especie, {
        especie: a.especie,
        nombre: getEspeciePorDbKey(a.especie)?.nombre ?? a.especie,
        filas: [a],
      });
    }
  }
  const ordenados = [...grupos.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );
  const nombreHuerto = (id: string | null) =>
    huertos.find((h) => h.id === id)?.nombre ?? "Sin huerto";

  function toggle(especie: string) {
    setAbiertos((prev) =>
      prev.includes(especie)
        ? prev.filter((e) => e !== especie)
        : [...prev, especie],
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setSeccionAbierta((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={seccionAbierta}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sprout className="size-4 text-primary" />
          Detalle por especie
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {ordenados.length} especie{ordenados.length === 1 ? "" : "s"} ·{" "}
            {arboles.length} árbol{arboles.length === 1 ? "" : "es"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            seccionAbierta && "rotate-180",
          )}
        />
      </button>
      {seccionAbierta ? (
        <ul className="flex flex-col gap-2 border-t px-4 py-3">
          {ordenados.map((g) => {
            const abierto = abiertos.includes(g.especie);
            const enPlano = g.filas.filter((f) => f.huertoId).length;
            const sinUbicar = g.filas.length - enPlano;
            return (
              <li key={g.especie} className="rounded-lg border bg-background">
                <button
                  type="button"
                  onClick={() => toggle(g.especie)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                  aria-expanded={abierto}
                >
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      {g.nombre}{" "}
                      <span className="text-muted-foreground">×{g.filas.length}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {enPlano > 0 ? `${enPlano} en plano` : ""}
                      {enPlano > 0 && sinUbicar > 0 ? " · " : ""}
                      {sinUbicar > 0 ? `${sinUbicar} sin ubicar` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <a
                      href={`/especie/especies/${g.especie}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      Ver ficha
                    </a>
                    <Badge
                      variant={sinUbicar === 0 ? "secondary" : "outline"}
                      className={
                        sinUbicar === 0
                          ? "rounded-full bg-emerald-500/10 text-emerald-700"
                          : "rounded-full bg-amber-500/10 text-amber-700"
                      }
                    >
                      {sinUbicar === 0 ? "completo" : "en curso"}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        abierto && "rotate-180",
                      )}
                    />
                  </span>
                </button>
                {abierto ? (
                  <ul className="flex flex-col gap-1 border-t px-4 py-2">
                    {g.filas.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {nombreHuerto(a.huertoId)}
                          {a.fechaPlantacion
                            ? ` · plantado ${a.fechaPlantacion}`
                            : ""}
                          {a.observaciones ? ` · ${a.observaciones}` : ""}
                        </span>
                        {a.huertoId ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-[11px]">
                            <MapPin className="size-3" /> en plano
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px]">
                            sin ubicar
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
