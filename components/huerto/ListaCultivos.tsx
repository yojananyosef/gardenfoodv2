"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarCultivo } from "@/lib/huerto/actions";
import type { CultivoLite } from "@/lib/huerto/nombres";

export function ListaCultivos({ cultivos }: { cultivos: CultivoLite[] }) {
  const [optimistic, setOptimistic] = useOptimistic(cultivos);
  const [, startTransition] = useTransition();

  function handleEliminar(especie: string) {
    setOptimistic((prev) => prev.filter((c) => c.especie !== especie));
    startTransition(async () => {
      const result = await eliminarCultivo(especie);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cultivo eliminado.");
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes cultivos. Agrega tu primera especie arriba.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {optimistic.map((c) => (
        <li
          key={c.especie}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium">{c.nombre ?? c.especie}</span>
            {c.grupo ? (
              <span className="text-xs text-muted-foreground">{c.grupo}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {c.cantidad} {c.cantidad === 1 ? "planta" : "plantas"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${c.nombre ?? c.especie}`}
              className="min-h-12 min-w-12 text-muted-foreground hover:text-destructive"
              onClick={() => handleEliminar(c.especie)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}