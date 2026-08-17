import { AlertTriangle, Droplets, Sun, Umbrella } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertaClimatica } from "@/lib/climate";

const ICONO: Record<AlertaClimatica["tipo"], typeof AlertTriangle> = {
  helada: AlertTriangle,
  sequia: Droplets,
  lluvia: Umbrella,
  calor: Sun,
};

const COLOR: Record<AlertaClimatica["severidad"], string> = {
  baja: "border-muted",
  media: "border-amber-300/70",
  alta: "border-red-300/70",
};

export function AlertasClimaticas({ alertas }: { alertas: AlertaClimatica[] }) {
  if (alertas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin alertas climáticas destacadas para tu zona este mes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((a, i) => {
        const Icon = ICONO[a.tipo];
        return (
          <div
            key={`${a.tipo}-${i}`}
            className={cn("flex items-start gap-3 rounded-lg border bg-card px-4 py-3", COLOR[a.severidad])}
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{a.titulo}</span>
              <p className="text-sm text-muted-foreground">{a.detalle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}