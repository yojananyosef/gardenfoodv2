import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Sun,
  SunMedium,
  type LucideIcon,
} from "lucide-react";

import type { ClaveIcono } from "@/lib/climate/condiciones";
import { cn } from "@/lib/utils";

/**
 * WMO → ícono de lucide.
 *
 * Vive aparte de `lib/climate/condiciones.ts` para que ese archivo siga siendo
 * puro y testeable sin React: acá solo se traduce la clave a un componente.
 *
 * Los colores no salen de una paleta inventada: el azul es el de la precipitación
 * y el ámbar el del sol, los dos que ya usa la app en las tarjetas de cosecha. Un
 * ícono de clima con color propio se leería como algo que el resto de la app no
 * usa, y a simple vista es ruido.
 */
const ICONO: Record<ClaveIcono, LucideIcon> = {
  sol: Sun,
  "mayormente-sol": SunMedium,
  "parcial-nublado": CloudSun,
  nublado: Cloud,
  niebla: CloudFog,
  llovizna: CloudDrizzle,
  lluvia: CloudRain,
  chubascos: CloudSunRain,
  nieve: CloudSnow,
  tormenta: CloudLightning,
  granizo: CloudHail,
};

/** Tamaño y color por defecto; el llamador puede sobrescribirlos. */
export function IconoClima({
  icono,
  className,
}: {
  icono: ClaveIcono;
  className?: string;
}) {
  const Comp = ICONO[icono] ?? Cloud;
  return (
    <Comp
      aria-hidden
      className={cn("size-6 text-muted-foreground", className)}
    />
  );
}

export { ICONO as ICONOS_CLIMA };