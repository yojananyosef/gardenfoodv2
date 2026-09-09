"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { agregarCultivo } from "@/lib/huerto/actions";
import type { Especie } from "@/lib/agronomy";
import { cn } from "@/lib/utils";

interface AgregarEspecieTarjetasProps {
  especies: Especie[];
  uso?: { actual: number; limite: number | "ilimitado" };
}

/**
 * Alta por tarjetas de fruta (patrón del socio): tocas la especie que tienes
 * en la mano y se agrega al huerto en una aplicación — sin formularios, con
 * buscador para las demás especies del catálogo.
 */
export function AgregarEspecieTarjetas({ especies, uso }: AgregarEspecieTarjetasProps) {
  const [query, setQuery] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);
  const [agregadas, setAgregadas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return especies;
    return especies.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.dbKey.toLowerCase().includes(q),
    );
  }, [especies, query]);

  const limiteAlcanzado =
    uso && typeof uso.limite === "number" ? uso.actual >= uso.limite : false;

  async function agregar(especie: Especie) {
    if (guardando) return;
    if (limiteAlcanzado) return;
    setGuardando(especie.dbKey);
    setError(null);
    const res = await agregarCultivo({ especie: especie.dbKey, cantidad: 1 });
    setGuardando(null);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setAgregadas((prev) => [...prev, especie.dbKey]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="Buscar especie"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué árbol tienes en casa? (durazno, limón…)"
          className="h-10 w-full rounded-full border bg-card pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {query ? (
          <button
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {limiteAlcanzado ? (
        <p className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Alcanzaste el límite de especies de tu plan gratuito. Quita una existente o mejora tu plan.
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="grid max-h-[320px] gap-2 overflow-y-auto sm:grid-cols-2">
        {resultados.map((e) => {
          const hecho = agregadas.includes(e.dbKey);
          return (
            <button
              key={e.dbKey}
              onClick={() => agregar(e)}
              disabled={hecho || guardando !== null || limiteAlcanzado}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors",
                hecho ? "border-primary/50 bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.imagen} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-none">{e.nombre}</span>
                  <span className="truncate text-xs text-muted-foreground">{e.grupo}</span>
                </span>
              </span>
              <Badge variant={hecho ? "default" : "outline"} className="shrink-0 rounded-full">
                {hecho ? "listo" : "agregar"}
              </Badge>
            </button>
          );
        })}
        {resultados.length === 0 ? (
          <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
            Sin resultados para «{query}».
          </p>
        ) : null}
      </div>
    </div>
  );
}
