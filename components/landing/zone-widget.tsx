"use client";

import { useMemo, useState } from "react";
import { Droplets, Scissors, Sprout } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES, REGIONES, ZONAS, ZONAS_EXTRA } from "@/lib/landing/zonas";

const ACCION_ICON = {
  Podar: Scissors,
  Regar: Droplets,
  Fertilizar: Sprout,
} as const;

export function ZoneWidget() {
  const [regionName, setRegionName] = useState<string | null>(null);
  const [comunaName, setComunaName] = useState<string | null>(null);

  const region = regionName ? REGIONES.find((r) => r.nombre === regionName) ?? null : null;
  const comuna =
    region && comunaName ? region.comunas.find((c) => c.nombre === comunaName) ?? null : null;

  const mes = useMemo(() => new Date().getMonth(), []);
  const tareas = comuna ? ZONAS[comuna.zona]?.[mes] ?? [] : [];
  const zonaExtra = comuna ? ZONAS_EXTRA[comuna.zona] ?? [] : [];

  function handleRegionChange(value: string | null) {
    if (value === null) return;
    setRegionName(value);
    setComunaName(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={regionName} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-full sm:w-52" size="default">
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent>
            {REGIONES.map((r) => (
              <SelectItem key={r.nombre} value={r.nombre}>
                {r.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={comunaName}
          onValueChange={(v) => {
            if (v !== null) setComunaName(v);
          }}
          disabled={!region}
        >
          <SelectTrigger className="w-full sm:w-52" size="default">
            <SelectValue placeholder={region ? "Comuna" : "Elige una región"} />
          </SelectTrigger>
          <SelectContent>
            {region?.comunas.map((c) => (
              <SelectItem key={c.nombre} value={c.nombre}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {comuna ? (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              {comuna.nombre} · {comuna.zona}
            </p>
            <p className="font-heading text-xs tracking-wide text-muted-foreground">
              {MESES[mes]}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {zonaExtra.join(" · ")}
          </p>

          {tareas.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {tareas.map((tarea, i) => {
                const Icon = ACCION_ICON[tarea.accion];
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium">{tarea.accion}. </span>
                      {tarea.detalle}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Pausa invernal: prepara el compost y planifica la primavera.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Elige tu región y comuna para ver el calendario de tu zona.
        </p>
      )}
    </div>
  );
}