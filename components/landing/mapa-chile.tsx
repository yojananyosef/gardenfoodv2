"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ESPECIES } from "@/lib/agronomy/especies";
import { VIABILIDAD } from "@/lib/agronomy/viabilidad";

// Contorno simplificado de Chile (Natural Earth, decimado; ~90 puntos).
const CHILE_PATH =
  "M80.5,51.8 L84.7,70.0 L92.5,68.2 L93.9,71.5 L90.1,85.3 L78.3,91.8 L78.7,113.9 L76.4,118.1 L79.7,123.3 L72.0,131.5 L64.9,143.9 L61.0,156.0 L62.1,168.8 L55.4,182.4 L60.4,205.2 L63.2,207.7 L63.2,219.8 L57.0,232.7 L57.2,243.8 L49.0,252.4 L49.1,264.6 L52.3,277.5 L45.9,282.3 L40.4,307.7 L42.2,323.8 L37.9,326.5 L40.4,341.8 L45.3,346.8 L41.7,352.3 L46.8,355.0 L47.9,360.0 L43.2,362.5 L44.4,370.2 L40.4,387.8 L34.7,399.0 L35.9,405.7 L32.5,414.1 L24.2,420.0 L25.1,434.0 L28.9,438.8 L36.1,437.9 L35.9,447.8 L40.4,455.6 L66.6,457.3 L76.7,459.4 L67.0,459.3 L52.0,467.3 L50.3,479.7 L45.7,480.0 L33.5,475.7 L7.6,458.9 L4.2,450.5 L7.2,442.8 L1.8,434.0 L0.4,411.4 L5.0,398.7 L16.5,388.5 L0.0,384.6 L10.3,372.9 L14.0,350.9 L26.1,355.6 L31.7,328.2 L24.4,324.7 L21.1,341.2 L14.2,339.3 L17.6,320.4 L21.3,295.9 L26.3,286.8 L23.2,273.9 L22.3,259.0 L26.9,258.6 L33.5,237.2 L41.0,216.1 L45.6,196.3 L43.1,176.5 L46.3,165.6 L45.0,149.3 L51.4,133.1 L53.3,107.5 L60.2,50.5 L59.4,28.8 L57.1,10.2 L62.7,6.8 L65.6,0.0 L70.9,9.0 L72.4,18.5 L78.1,24.1 L74.6,37.0Z";

type Banda = {
  id: string;
  nombre: string;
  clima: string;
  zonas: number[];
  y0: number;
  y1: number;
  fill: string;
  activo: string;
};

const BANDAS: Banda[] = [
  { id: "norte", nombre: "Norte árido", clima: "Desértico, sin heladas, riego obligatorio", zonas: [1, 2], y0: 0, y1: 82, fill: "rgba(245, 158, 11, 0.16)", activo: "rgba(245, 158, 11, 0.45)" },
  { id: "norte-chico", nombre: "Norte Chico", clima: "Semiárido, heladas leves de invierno", zonas: [3, 4], y0: 82, y1: 144, fill: "rgba(249, 115, 22, 0.16)", activo: "rgba(249, 115, 22, 0.45)" },
  { id: "centro", nombre: "Centro", clima: "Mediterráneo, estaciones marcadas", zonas: [5, 6, 7, 8, 9], y0: 144, y1: 221, fill: "rgba(16, 185, 129, 0.16)", activo: "rgba(16, 185, 129, 0.45)" },
  { id: "centro-sur", nombre: "Centro-Sur", clima: "Mediterráneo húmedo, veranos secos", zonas: [10, 11, 12, 13, 14], y0: 221, y1: 288, fill: "rgba(20, 184, 166, 0.16)", activo: "rgba(20, 184, 166, 0.45)" },
  { id: "sur", nombre: "Sur", clima: "Templado lluvioso, alta presión de hongos", zonas: [15, 16, 17, 18, 19], y0: 288, y1: 365, fill: "rgba(56, 189, 248, 0.16)", activo: "rgba(56, 189, 248, 0.45)" },
  { id: "patagonia", nombre: "Zona Austral", clima: "Frío, lluvia y viento — solo especies muy rústicas", zonas: [20], y0: 365, y1: 480, fill: "rgba(100, 116, 139, 0.18)", activo: "rgba(100, 116, 139, 0.5)" },
];

// Solo módulos hoja (sin barrel): evita mandar fichas.ts al bundle del cliente.
function facilesDe(banda: Banda) {
  return ESPECIES.filter(
    (e) =>
      e.dificultad === "Fácil" &&
      banda.zonas.some((z) => VIABILIDAD[e.dbKey]?.[z]?.v === "si"),
  );
}

export function MapaChile() {
  const [activa, setActiva] = useState<string>("centro");
  const banda = BANDAS.find((b) => b.id === activa) ?? BANDAS[2];
  const faciles = useMemo(() => facilesDe(banda), [banda]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox="0 0 94 480"
          className="h-[380px] w-auto sm:h-[440px]"
          role="img"
          aria-label="Mapa esquemático de Chile dividido en 6 bandas climáticas"
        >
          <defs>
            <clipPath id="mapa-chile-clip">
              <path d={CHILE_PATH} />
            </clipPath>
          </defs>
          <g clipPath="url(#mapa-chile-clip)">
            {BANDAS.map((b) => (
              <rect
                key={b.id}
                x={-10}
                y={b.y0}
                width={114}
                height={b.y1 - b.y0}
                fill={b.id === activa ? b.activo : b.fill}
                className="cursor-pointer transition-[fill] duration-150"
                onMouseEnter={() => setActiva(b.id)}
                onClick={() => setActiva(b.id)}
              />
            ))}
          </g>
          <path
            d={CHILE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            className="text-foreground/25"
          />
        </svg>
        <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Elegir banda climática">
          {BANDAS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiva(b.id)}
              onMouseEnter={() => setActiva(b.id)}
              aria-pressed={b.id === activa}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                b.id === activa
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {b.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge className="gap-1 rounded-full">
            <MapPin className="size-3" /> {banda.nombre}
          </Badge>
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {faciles.length} fáciles viables
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{banda.clima}</p>
        {faciles.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {faciles.map((e) => (
              <Link
                key={e.slug}
                href={`/especies/${e.slug}`}
                className="group flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="flex flex-col">
                  {e.nombre}
                  <span className="text-[11px] font-normal text-muted-foreground">{e.grupo}</span>
                </span>
                <ArrowRight className="size-3.5 text-primary opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Aquí casi nada se da “fácil”: parte con especies de guía en zonas de riesgo.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Esquema orientativo en 6 bandas. Tu resultado real se calcula con tu comuna:{" "}
          <Link href="/registro" className="font-medium underline underline-offset-2">
            elige entre las 346
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
