"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectorHuertoProps {
  huertos: { id: string; nombre: string; superficieM2: number }[];
  activoId: string | null;
  className?: string;
}

/**
 * Selector global de huerto (R5): el filtro de arriba que responde —
 * contadores, plano y «¿qué sigue?». Persistente vía query param,
 * estable al cruzar el toggle guiado ↔ modular.
 */
export function SelectorHuerto({ huertos, activoId, className }: SelectorHuertoProps) {
  const router = useRouter();

  if (huertos.length < 2) return null;

  function elegir(value: string | null) {
    const id = value ?? "todos";
    const url = new URL(window.location.href);
    if (id === "todos") url.searchParams.delete("huerto");
    else url.searchParams.set("huerto", id);
    router.replace(url.pathname + url.search, { scroll: false });
  }

  return (
    <div className={className ?? "inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm"}>
      <MapPin className="size-3.5 text-muted-foreground" />
      <Select value={activoId ?? "todos"} onValueChange={elegir}>
        <SelectTrigger className="h-8 w-52 rounded-full border-none bg-transparent shadow-none">
          <SelectValue placeholder="Todos los huertos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los huertos</SelectItem>
          {huertos.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.nombre} · {Math.round(h.superficieM2)} m²
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
