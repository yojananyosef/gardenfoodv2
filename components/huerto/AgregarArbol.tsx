"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { agregarArbol } from "@/lib/huerto/actions";
import type { Especie } from "@/lib/agronomy";

export function AgregarArbol({ especies }: { especies: Especie[] }) {
  const [especie, setEspecie] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const [fechaPlantacion, setFechaPlantacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especie) {
      toast.error("Selecciona una especie.");
      return;
    }
    const cant = Math.max(1, Math.min(1000, Number(cantidad) || 1));
    startTransition(async () => {
      const result = await agregarArbol({
        especie,
        cantidad: cant,
        fechaPlantacion: fechaPlantacion ? fechaPlantacion : null,
        observaciones: observaciones.trim() ? observaciones.trim() : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol agregado a tu inventario.");
      setEspecie(null);
      setCantidad("1");
      setFechaPlantacion("");
      setObservaciones("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="arbol-especie">Especie</Label>
        <Select value={especie ?? undefined} onValueChange={setEspecie}>
          <SelectTrigger id="arbol-especie" className="w-full min-h-12">
            <SelectValue placeholder="Elige una especie…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {especies.map((e) => (
              <SelectItem key={e.dbKey} value={e.dbKey}>
                {e.nombre} — {e.clima}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="arbol-cantidad">Cantidad</Label>
          <Input
            id="arbol-cantidad"
            type="number"
            min={1}
            max={1000}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="min-h-12"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="arbol-fecha">Fecha de plantación</Label>
          <Input
            id="arbol-fecha"
            type="date"
            value={fechaPlantacion}
            onChange={(e) => setFechaPlantacion(e.target.value)}
            className="min-h-12"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="arbol-obs">Observaciones</Label>
        <Input
          id="arbol-obs"
          value={observaciones}
          maxLength={500}
          onChange={(e) => setObservaciones(e.target.value)}
          className="min-h-12"
        />
      </div>
      <Button type="submit" className="min-h-12 w-full" disabled={pending}>
        {pending ? "Agregando…" : "Agregar árbol"}
      </Button>
    </form>
  );
}
