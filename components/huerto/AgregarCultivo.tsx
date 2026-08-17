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
import { agregarCultivo } from "@/lib/huerto/actions";
import type { Especie } from "@/lib/agronomy";

export function AgregarCultivo({ especies }: { especies: Especie[] }) {
  const [especie, setEspecie] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especie) {
      toast.error("Selecciona una especie.");
      return;
    }
    const cant = Math.max(1, Math.min(1000, Number(cantidad) || 1));
    startTransition(async () => {
      const result = await agregarCultivo({ especie, cantidad: cant });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cultivo agregado a tu huerto.");
      setEspecie(null);
      setCantidad("1");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="especie">Especie</Label>
        <Select value={especie ?? undefined} onValueChange={setEspecie}>
          <SelectTrigger id="especie" className="w-full min-h-12">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="cantidad">Cantidad de plantas</Label>
        <Input
          id="cantidad"
          type="number"
          min={1}
          max={1000}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="min-h-12"
        />
      </div>
      <Button type="submit" className="min-h-12 w-full" disabled={pending}>
        {pending ? "Agregando…" : "Agregar al huerto"}
      </Button>
    </form>
  );
}