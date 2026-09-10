"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import type { Arbol } from "@/types";
import { cn } from "@/lib/utils";

interface ListaArbolesAgrupadaProps {
  arboles: Arbol[];
  onEliminar: (id: string) => void;
}

interface GrupoEspecie {
  especie: string;
  nombre: string;
  filas: Arbol[];
  fecha: string | null;
}

/** Agrupa las filas del inventario por especie (R2): Durazno ×16 en una fila,
 *  no 16 filas idénticas. Expandible para operar ejemplares individuales. */
export function ListaArbolesAgrupada({ arboles, onEliminar }: ListaArbolesAgrupadaProps) {
  const [abiertos, setAbiertos] = useState<string[]>([]);

  if (arboles.length === 0) return null;

  const grupos = new Map<string, GrupoEspecie>();
  for (const a of arboles) {
    const existente = grupos.get(a.especie);
    if (existente) {
      existente.filas.push(a);
      if (existente.fecha === null && a.fechaPlantacion) existente.fecha = a.fechaPlantacion;
    } else {
      grupos.set(a.especie, {
        especie: a.especie,
        nombre: getEspeciePorDbKey(a.especie)?.nombre ?? a.especie,
        filas: [a],
        fecha: a.fechaPlantacion,
      });
    }
  }
  const ordenados = [...grupos.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );

  function toggle(especie: string) {
    setAbiertos((prev) =>
      prev.includes(especie) ? prev.filter((e) => e !== especie) : [...prev, especie],
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {ordenados.map((g) => {
        const abierto = abiertos.includes(g.especie);
        const enPlano = g.filas.filter((f) => f.huertoId).length;
        const sinUbicar = g.filas.length - enPlano;
        return (
          <li key={g.especie} className="rounded-lg border bg-card">
            <button
              type="button"
              onClick={() => toggle(g.especie)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={abierto}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {g.nombre} <span className="text-muted-foreground">×{g.filas.length}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {g.fecha ? `Plantado: ${g.fecha}` : "Sin fecha de plantación"}
                  {enPlano > 0 ? ` · ${enPlano} en plano` : ""}
                  {sinUbicar > 0 ? ` · ${sinUbicar} sin ubicar` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/especie/especies/${g.especie}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Ver ficha de la especie
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
                  className={cn("size-4 text-muted-foreground transition-transform", abierto && "rotate-180")}
                />
              </div>
            </button>
            {abierto ? (
              <ul className="flex flex-col gap-1 border-t px-4 py-2">
                {g.filas.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {a.especie}{" "}
                      {a.fechaPlantacion ? `· plantado ${a.fechaPlantacion}` : ""}
                      {a.huertoId ? (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-[11px]">
                          <MapPin className="size-3" /> en plano
                        </span>
                      ) : (
                        <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px]">
                          sin ubicar
                        </span>
                      )}
                      {a.observaciones ? ` · ${a.observaciones}` : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar ejemplar de ${g.nombre}`}
                      onClick={() => onEliminar(a.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
