import { Droplets, Sun, ThermometerSun, Umbrella } from "lucide-react";

import { cn } from "@/lib/utils";
import { agruparAlertas, fechaCorta } from "@/lib/climate/alertas";

/**
 * Alertas agrupadas por tipo.
 *
 * Con el pronóstico es fácil tener cinco días de lluvia seguidos. Desplegados
 * son cinco filas idénticas —«Lluvia probable», la misma explicación cinco
 * veces— que ocupan media pantalla para decir «llueve el 7, 8, 9, 12 y 13».
 * Agrupadas son una línea con los días adentro, y cuando aparecen dos tipos
 * distintos (una helada y lluvia) se ven las dos, con la más grave arriba.
 *
 * El ícono no se pinta por tipo sino por día: si el agrupado es de «lluvia» pero
 * el martes fue un chubasco y el jueves llovizna, el ícono único mentiría sobre
 * dos de los días que nombra.
 */
export function AlertasClimaticas({
  alertas,
}: {
  alertas: import("@/lib/climate/alertas").AlertaClimatica[];
}) {
  if (alertas.length === 0) return null;

  const grupos = agruparAlertas(alertas);

  return (
    <div className="flex flex-col gap-2">
      {grupos.map((g) => (
        <div
          key={g.tipo}
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-card px-4 py-3",
            g.severidad === "alta"
              ? "border-red-300/70"
              : g.severidad === "media"
                ? "border-amber-300/70"
                : "border-muted",
          )}
        >
          <IconoTipo tipo={g.tipo} className="mt-0.5 size-5 shrink-0" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium">{g.titulo}</span>
              <span className="text-xs text-muted-foreground">
                {g.fechas.length ? diasEnTexto(g.fechas) : "sin día: promedio de la zona"}
              </span>
            </span>
            {/* El detalle del primer día, con la fecha reescrita: decía «100% de
                probabilidad en octubre. El riego al pie se puede saltear ese
                día», y al agrupar el singular queda raro y además promises que
                los cinco días bajan igual de probabilidad. */}
            <p className="text-sm text-muted-foreground">
              {detalleEnPlural(g.detalle, g.fechas.length)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function IconoTipo({ tipo, className }: { tipo: string; className?: string }) {
  const props = { className, "aria-hidden": true } as const;
  switch (tipo) {
    case "helada":
      return <ThermometerSun {...props} />;
    case "lluvia":
      return <Umbrella {...props} />;
    case "calor":
      return <Sun {...props} />;
    default:
      return <Droplets {...props} />;
  }
}

/** «mié 7, jue 8 y mar 13». Con muchos días, se recorta. */
function diasEnTexto(fechas: string[]): string {
  const dias = fechas.map(fechaCorta);
  if (dias.length <= 3) return dias.join(", ");
  return `${dias.slice(0, 3).join(", ")} y ${dias.length - 3} más`;
}

/**
 * Adapta el detalle al número de días agrupados.
 *
 * El texto se escribe para un día («ese día», la probabilidad de ese día). Con
 * cinco días agrupados, «100% de probabilidad» miente: el martes puede ser 73%.
 * Se reemplaza la cifra por el rango real, que es lo que el usuario puede usar.
 */
function detalleEnPlural(detalle: string, dias: number): string {
  if (dias <= 1) return detalle;

  const rango = detalle.match(/^(\d+)% de probabilidad/);
  if (!rango) return detalle.replace(/\bese día\b/, "esos días");

  return detalle
    .replace(/^\d+% de probabilidad/, `hasta ${rango[1]}% de probabilidad`)
    .replace(/\bese día\b/, "esos días");
}