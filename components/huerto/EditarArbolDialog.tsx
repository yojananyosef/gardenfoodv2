"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";
import { BotonFichaEspecie } from "@/components/huerto/FichaEspecieSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { actualizarArbol, eliminarArbol } from "@/lib/huerto/actions";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import { cn } from "@/lib/utils";
import type { Arbol } from "@/types";

export type OpcionEspecie = { dbKey: string; nombre: string };

export function nombreArbol(especie: string): string {
  return getEspeciePorDbKey(especie)?.nombre ?? especie;
}

export function EditarArbolDialog({
  arbol,
  especies,
  onCerrar,
  onActualizado,
  onEliminado,
}: {
  arbol: Arbol;
  especies: OpcionEspecie[];
  onCerrar: () => void;
  onActualizado?: (arbol: Arbol) => void;
  onEliminado?: () => void;
}) {
  const router = useRouter();
  const [especie, setEspecie] = useState(arbol.especie);
  const [fecha, setFecha] = useState(arbol.fechaPlantacion ?? "");
  const [observaciones, setObservaciones] = useState(arbol.observaciones ?? "");
  const [pending, startTransition] = useTransition();
  // Los detalles parten expandidos solo si el árbol ya tiene datos.
  const [detallesAbiertos, setDetallesAbiertos] = useState(
    Boolean(arbol.fechaPlantacion || arbol.observaciones),
  );

  function guardar() {
    startTransition(async () => {
      const result = await actualizarArbol(arbol.id, {
        especie,
        fechaPlantacion: fecha ? fecha : null,
        observaciones: observaciones.trim() ? observaciones.trim() : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol actualizado.");
      onActualizado?.({ ...arbol, especie, fechaPlantacion: fecha ? fecha : null, observaciones: observaciones.trim() ? observaciones.trim() : null });
      onCerrar();
      router.refresh();
    });
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar este ${nombreArbol(arbol.especie)} del inventario?`)) {
      return;
    }
    startTransition(async () => {
      const result = await eliminarArbol(arbol.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol eliminado.");
      onEliminado?.();
      onCerrar();
      router.refresh();
    });
  }

  return (
    <DialogContent className="max-w-md">
      <DialogTitle className="text-lg font-semibold">
        {nombreArbol(arbol.especie)}
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Árbol individual. Cada unidad se edita por separado.
      </DialogDescription>
      <div className="mt-2 flex flex-col gap-3">
        {/* Puente E3 primero: ficha en sheet sobre la misma página */}
        <BotonFichaEspecie dbKey={arbol.especie} nombre={nombreArbol(arbol.especie)} />
        <button
          type="button"
          onClick={() => setDetallesAbiertos((v) => !v)}
          aria-expanded={detallesAbiertos}
          className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50"
        >
          Agrega más detalles a tu árbol
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              detallesAbiertos && "rotate-180",
            )}
          />
        </button>
        {detallesAbiertos ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-especie">Especie</Label>
              <Select value={especie} onValueChange={(value) => setEspecie(value ?? "")}>
                <SelectTrigger id="plano-especie" className="w-full min-h-11">
                  <SelectValue>
                    {(value: string | null) =>
                      especies.find((e) => e.dbKey === value)?.nombre ?? "Elige una especie…"
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-fecha">Fecha de plantación</Label>
              <Input
                id="plano-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-obs">Observaciones</Label>
              <Input
                id="plano-obs"
                value={observaciones}
                maxLength={500}
                onChange={(e) => setObservaciones(e.target.value)}
                className="min-h-11"
              />
            </div>
            <Button type="button" className="min-h-11 w-full" onClick={guardar} disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive"
          onClick={eliminar}
          disabled={pending}
        >
          <Trash2 data-icon="inline-start" /> Eliminar
        </Button>
      </div>
    </DialogContent>
  );
}
