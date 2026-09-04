"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPinOff, Trash2 } from "lucide-react";
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

  function quitarDelPlano() {
    startTransition(async () => {
      const result = await actualizarArbol(arbol.id, { huertoId: null });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol quitado del plano.");
      onActualizado?.({ ...arbol, huertoId: null, posX: null, posY: null });
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="plano-especie">Especie</Label>
          <Select value={especie} onValueChange={(value) => setEspecie(value ?? "")}>
            <SelectTrigger id="plano-especie" className="w-full min-h-11">
              <SelectValue placeholder="Elige una especie…" />
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={quitarDelPlano}
            disabled={pending || !arbol.huertoId}
          >
            <MapPinOff data-icon="inline-start" /> Quitar del plano
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={eliminar}
            disabled={pending}
          >
            <Trash2 data-icon="inline-start" /> Eliminar
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
