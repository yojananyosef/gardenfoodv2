"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Droplets, Lock, Scissors, Sprout } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES, REGIONES, ZONAS, ZONAS_EXTRA } from "@/lib/landing/zonas";
import {
  esRegionExploracionLibre,
  puedeExplorarRegion,
} from "@/lib/payments/plans";

const ACCION_ICON = {
  Podar: Scissors,
  Regar: Droplets,
  Fertilizar: Sprout,
} as const;

export function ZoneWidget({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [regionName, setRegionName] = useState<string | null>(null);
  const [comunaName, setComunaName] = useState<string | null>(null);

  const region = regionName ? REGIONES.find((r) => r.nombre === regionName) ?? null : null;
  const regionBloqueada = region ? !puedeExplorarRegion(region.nombre, { isAuthenticated }) : false;
  const comuna =
    region && !regionBloqueada && comunaName
      ? region.comunas.find((c) => c.nombre === comunaName) ?? null
      : null;

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
            {REGIONES.map((r) => {
              // Se mantiene seleccionable a propósito: elegir una bloqueada
              // muestra la tarjeta con CTA a login/registro (patrón /explorar).
              const libre = esRegionExploracionLibre(r.nombre) || isAuthenticated;
              return (
                <SelectItem key={r.nombre} value={r.nombre}>
                  <span className="flex items-center gap-1.5">
                    {r.nombre}
                    {!libre ? (
                      <Lock className="size-3 text-muted-foreground" aria-label="Requiere cuenta" />
                    ) : null}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={comunaName}
          onValueChange={(v) => {
            if (v !== null) setComunaName(v);
          }}
          disabled={!region || regionBloqueada}
        >
          <SelectTrigger className="w-full sm:w-52" size="default">
            <SelectValue
              placeholder={regionBloqueada ? "Región con candado" : region ? "Comuna" : "Elige una región"}
            />
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

      {!isAuthenticated ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3 shrink-0" aria-hidden />
          <span>Exploración libre: Metropolitana · Ñuble · O&rsquo;Higgins. El resto se desbloquea con cuenta gratis.</span>
        </p>
      ) : null}

      {regionBloqueada && region ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-muted">
              <Lock className="size-3.5" aria-hidden />
            </span>
            {region.nombre} está bloqueada en exploración libre
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Crea tu cuenta gratis para desbloquear las 16 regiones y ver el calendario de tu comuna.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/registro?next=/"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Crear cuenta gratis
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/login?next=/"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      ) : comuna ? (
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