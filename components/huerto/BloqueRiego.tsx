import { Droplets } from "lucide-react";

import type { DiaRiego } from "@/lib/climate/riego";
import { diasDeRiego, fraseRiego, UMBRAL_MINIMO_MM } from "@/lib/climate/riego";
import { cn } from "@/lib/utils";

const NOMBRE_DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const diaDe = (fecha: string) => NOMBRE_DIA[new Date(`${fecha}T12:00:00Z`).getUTCDay()];

/**
 * Cuánta agua reponer, en milímetros.
 *
 * Es el bloque con el que esta pantalla le gana a un pronóstico general. Google
 * te dice que van a hacer 17°; esto dice cuántos milímetros reponer, que es lo
 * que el usuario tiene que hacer el domingo con una manguera en la mano.
 *
 * Se muestran solo los días que de verdad piden riego, ordenados de más a menos:
 * una lista de siete días con «0 mm» al lado de «3,4 mm» esconde el único número
 * que importa.
 *
 * NO es la dosis final: falta el coeficiente de cultivo por especie y la
 * infiltración del suelo. `lib/climate/riego.ts` lo documenta y concentra el
 * supuesto.
 */
export function BloqueRiego({ dias }: { dias: DiaRiego[] }) {
  const conRiego = diasDeRiego(dias);
  const sinEt0 = dias.every((d) => !d.et0);

  if (sinEt0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Riego estimado no disponible: el pronóstico no trajo evapotranspiración.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Droplets className="size-3" />
          Riego estimado
        </span>
        <span className="font-mono text-sm font-medium tabular-nums">
          {fraseRiego(dias)}
        </span>
      </div>

      {conRiego.length ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {conRiego.map((d) => (
            <li
              key={d.fecha}
              className="flex items-baseline gap-1.5 text-xs"
              title={
                d.lluvia > 0
                  ? `Evapotranspiración ${d.et0.toFixed(1).replace(".", ",")} mm, lluvia ${d.lluvia.toFixed(1).replace(".", ",")} mm`
                  : `Evapotranspiración ${d.et0.toFixed(1).replace(".", ",")} mm, sin lluvia prevista`
              }
            >
              <span className="text-muted-foreground">{diaDe(d.fecha)}</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  // El día más intenso se destaca: es el que define la carga de
                  // agua del fin de semana.
                  d.riego >= 4 ? "font-semibold text-foreground" : "text-foreground/80",
                )}
              >
                {d.riego.toFixed(1).replace(".", ",")} mm
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ningún día supera {UMBRAL_MINIMO_MM} mm: la lluvia cubre la demanda.
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Según la evapotranspiración del pronóstico y la lluvia prevista, con el
        factor de cultivo de un frutal adulto. El volumen final depende de la
        especie y de cuánto entre el suelo.
      </p>
    </div>
  );
}