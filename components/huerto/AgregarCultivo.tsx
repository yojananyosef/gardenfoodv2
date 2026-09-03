"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";
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

type Uso = { actual: number; limite: number | null };

export function AgregarCultivo({ especies, uso }: { especies: Especie[]; uso?: Uso }) {
  const [especie, setEspecie] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const enLimite = !!uso && uso.limite !== null && uso.actual >= uso.limite;

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
        if ("limite" in result && result.limite) {
          toast.error(result.error, {
            action: { label: "Ver planes", onClick: () => router.push("/pricing") },
          });
        } else {
          toast.error(result.error);
        }
        return;
      }
      toast.success("Cultivo agregado a tu huerto.");
      setEspecie(null);
      setCantidad("1");
    });
  }

  if (enLimite) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            Límite gratuito alcanzado ({uso?.limite}/{uso?.limite} cultivos)
          </p>
          <p className="text-xs text-muted-foreground">
            Pásate a Huertero para cultivos ilimitados, sin anuncios y logros de cosecha.
          </p>
        </div>
        <Button render={<Link href="/pricing" />}>Ver planes</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="especie">Especie</Label>
          {uso && uso.limite !== null ? (
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {uso.actual}/{uso.limite} en plan gratuito
            </span>
          ) : null}
        </div>
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
