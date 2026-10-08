import { Droplets, Sunrise, Sunset, Wind } from "lucide-react";

import type { Ahora, DiaPronostico } from "@/lib/climate/alertas";
import { condicionDe } from "@/lib/climate/condiciones";
import { cn } from "@/lib/utils";
import { IconoClima } from "./IconoClima";

/**
 * «Ahora»: la temperatura grande, la frase del tiempo y los tres números.
 *
 * Es el bloque que Google pone arriba y que faltaba acá. Antes de esto la
 * pantalla empezaba con una tira de siete celdas iguales: siete veces lo mismo,
 * ninguna respondiendo «¿qué tiempo hace ahora?».
 *
 * Los tres datos de al lado —humedad, viento, sensación térmica— no son adorno:
 * los tres cambian una decisión de riego. La humedad alta y la sensación por
 * debajo de la temperatura señalan que la evapotranspiración va a ser más baja
 * que la de la fórmula, y el viento cambia cuánto se pierde en el turno de riego.
 */
export function AhoraClima({
  actual,
  hoy,
}: {
  actual: Ahora;
  hoy?: DiaPronostico | null;
}) {
  const condicion = condicionDe(actual.codigo);
  const sinCampo = (v: number | null | undefined) => v == null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex items-center gap-4">
        <IconoClima icono={condicion.icono} className="size-14 shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            {/* `tabular-nums` para que el número no baile cuando cambia de
                9 a 10 grados: el bloque está al lado del ícono y un dígito de
                más lo corría. */}
            <span className="font-heading text-5xl font-semibold leading-none tabular-nums">
              {Math.round(actual.temp)}
            </span>
            <span className="text-2xl font-normal text-muted-foreground">°C</span>
          </div>
          <span className="mt-1 text-sm font-medium">{condicion.etiqueta}</span>
        </div>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Dato
          icono={Droplets}
          etiqueta="Humedad"
          valor={sinCampo(actual.humedad) ? null : `${actual.humedad}%`}
          nota={hoy && (hoy.mmLluvia ?? 0) > 0 ? `${hoy.mmLluvia?.toFixed(0)} mm previstos` : null}
        />
        <Dato
          icono={Wind}
          etiqueta="Viento"
          valor={sinCampo(actual.viento) ? null : `${Math.round(actual.viento)} km/h`}
          nota={hoy && (hoy.viento ?? 0) > 35 ? "Ramas con riesgo" : null}
        />
        <Dato
          icono={null}
          etiqueta="Sensación"
          valor={
            sinCampo(actual.sensacion)
              ? null
              : `${Math.round(actual.sensacion)}°`
          }
          nota={
            actual.sensacion != null && actual.sensacion < actual.temp - 1
              ? "Más fresco de lo que marca"
              : null
          }
        />
        <Dato
          icono={hoy?.uv && hoy.uv >= 8 ? Sunrise : Sunset}
          etiqueta={hoy?.uv && hoy.uv >= 8 ? "UV máximo" : "Luz del día"}
          valor={
            hoy?.uv != null
              ? String(Math.round(hoy.uv))
              : hoy?.amanecer
                ? `${hoy.amanecer.slice(11, 16)}–${hoy.atardecer?.slice(11, 16) ?? "?"}`
              : null
          }
          nota={hoy?.uv != null && hoy.uv >= 8 ? "Proteger a media tarde" : null}
        />
      </dl>
    </div>
  );
}

function Dato({
  icono: Icono,
  etiqueta,
  valor,
  nota,
}: {
  icono: typeof Droplets | null;
  etiqueta: string;
  valor: string | null;
  nota: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icono ? <Icono className="size-3" aria-hidden /> : null}
        {etiqueta}
      </dt>
      <dd
        className={cn(
          "font-mono text-sm tabular-nums",
          valor ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        {/* Un guion en vez de un hueco: se ve que no hay dato, y no parece un
            espacio que se olvidó de rellenar. */}
        {valor ?? "—"}
        {nota ? (
          <span className="ml-1.5 font-sans text-[11px] text-muted-foreground">
            {nota}
          </span>
        ) : null}
      </dd>
    </div>
  );
}