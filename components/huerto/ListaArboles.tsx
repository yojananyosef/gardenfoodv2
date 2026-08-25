"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarArbol } from "@/lib/huerto/actions";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import type { Arbol } from "@/types";

export function ListaArboles({ arboles }: { arboles: Arbol[] }) {
  const [optimistic, setOptimistic] = useOptimistic(arboles);
  const [, startTransition] = useTransition();

  function handleEliminar(id: string) {
    startTransition(async () => {
      setOptimistic((prev) => prev.filter((a) => a.id !== id));
      const result = await eliminarArbol(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol eliminado.");
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes árboles en tu inventario. Agrega tu primer árbol arriba.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {optimistic.map((a) => {
        const nombre = getEspeciePorDbKey(a.especie)?.nombre ?? a.especie;
        return (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{nombre}</span>
              <span className="text-xs text-muted-foreground">
                {a.cantidad} {a.cantidad === 1 ? "planta" : "plantas"}
                {a.fechaPlantacion ? ` · Plantado: ${a.fechaPlantacion}` : ""}
                {a.observaciones ? ` · ${a.observaciones}` : ""}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${nombre}`}
              className="min-h-12 min-w-12 text-muted-foreground hover:text-destructive"
              onClick={() => handleEliminar(a.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
