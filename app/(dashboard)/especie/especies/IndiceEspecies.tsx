"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Leaf, Search, Trees, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Especie } from "@/lib/agronomy";

/** Tarjetas del índice de especies con buscador client-side (E4).
 *  Server ya trajo el estado por especie; aquí solo filtra/las muestra. */
export function IndiceEspecies({
  fichas,
  otras,
  enUso,
}: {
  fichas: {
    especie: Especie;
    momentoActual: string | null;
    cantidad: number;
  }[];
  otras: {
    especie: Especie;
    cantidad: number;
  }[];
  enUso: string[];
}) {
  const [q, setQ] = useState("");

  const qnorm = q.trim().toLowerCase();

  const fichasVisibles = useMemo(
    () => fichas.filter((f) => f.especie.nombre.toLowerCase().includes(qnorm)),
    [fichas, qnorm],
  );
  const otrasVisibles = useMemo(
    () => otras.filter((o) => o.especie.nombre.toLowerCase().includes(qnorm)),
    [otras, qnorm],
  );
  const sinResultados = q.trim() !== "" && fichasVisibles.length === 0 && otrasVisibles.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block w-full max-w-sm">
        <span className="sr-only">Buscar especie</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar especie…"
          className="rounded-xl pl-9"
        />
        {q ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </label>

      {sinResultados ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Sin coincidencias para «{q}».
            </p>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setQ("")}>
              Limpiar filtro
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fichasVisibles.map(({ especie, momentoActual, cantidad }) => (
          <Link
            key={especie.dbKey}
            href={`/especie/especies/${especie.dbKey}`}
            className="group"
          >
            <Card className="h-full rounded-2xl transition-shadow group-hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-heading text-base font-semibold">{especie.nombre}</span>
                    <span className="text-xs text-muted-foreground">ficha completa de cuidados</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                    activo
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="rounded-full">
                    <Trees className="size-3" />
                    {cantidad > 0 ? `${cantidad} en tu huerto` : "sin ejemplares"}
                  </Badge>
                  {momentoActual ? (
                    <Badge className="rounded-full">
                      <Leaf className="size-3" /> {momentoActual}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {otrasVisibles.map(({ especie, cantidad }) => (
          <Link key={especie.dbKey} href={`/especie/especies/${especie.dbKey}`} className="group">
            <Card className="h-full rounded-2xl bg-muted/30 transition-shadow group-hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-heading text-base font-semibold">{especie.nombre}</span>
                    <span className="text-xs text-muted-foreground">ficha básica</span>
                  </div>
                  {enUso.includes(especie.dbKey) ? (
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                      en tu huerto
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="rounded-full">
                    <Trees className="size-3" />
                    {cantidad > 0 ? `${cantidad} en tu huerto` : "sin ejemplares"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* E4: tarjeta dashed de puente al asistente (R2) */}
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex h-full flex-col gap-3 p-4">
            <div className="flex flex-col">
              <span className="font-heading text-base font-semibold">¿Qué árbol tienes en casa?</span>
              <span className="text-xs text-muted-foreground">
                Asistente del huerto con tarjetas con la foto de la fruta — crea tu inventario y
                trae la ficha de cuidados de paso.
              </span>
            </div>
            <Button size="sm" className="w-fit rounded-full" render={<Link href="/huerto" />}>
              Crear mi huerto con tarjetas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
