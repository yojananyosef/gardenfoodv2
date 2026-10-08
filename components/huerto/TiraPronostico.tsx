import { cn } from "@/lib/utils";
import {
  UMBRAL_LLUVIA_PCT,
  diaSemanaDe,
  fechaCorta,
  hoyLocal,
  type DiaPronostico,
} from "@/lib/climate/alertas";
import { condicionDe } from "@/lib/climate/condiciones";
import { IconoClima } from "./IconoClima";

const NOMBRE_DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const NOMBRE_MES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const conDecimal = (n: number) => n.toFixed(0);

/**
 * Los próximos días: ícono, máxima, mínima y probabilidad de lluvia.
 *
 * Es lo que el socio pidió cuando dijo que quería el pronóstico «como en las
 * apps de clima». Antes de esta versión no mostraba ni una temperatura: solo
 * promedios anuales de la zona y un contador de alertas. Y en su primera versión
 * tenía los números pero sin ícono, que es exactamente lo que la deja sin decir
 * nada: `17° / 11° / 100%` no dice si es sol o si son tres chubascos. Con el
 * ícono del código WMO, que venía en la misma respuesta y no costaba nada, la
 * celda pasa a leerse sola.
 *
 * El día actual se marca con un anillo. La probabilidad de lluvia se pinta solo
 * cuando llega al umbral, porque un «0%» repetido siete veces es ruido.
 */
export function TiraPronostico({ dias }: { dias: DiaPronostico[] }) {
  if (!dias.length) return null;
  const hoy = hoyLocal();

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {dias.map((d) => {
        const esHoy = d.fecha === hoy;
        const [, mes, dia] = d.fecha.split("-").map(Number);
        const condicion = condicionDe(d.codigo);
        const lluvia = d.probLluvia >= UMBRAL_LLUVIA_PCT;

        return (
          <div
            key={d.fecha}
            title={`${fechaCorta(d.fecha)}: ${condicion.etiqueta.toLowerCase()}, mínima ${conDecimal(d.min)}°, máxima ${conDecimal(d.max)}°, ${d.probLluvia}% de lluvia`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-center",
              esHoy ? "border-primary bg-primary/5" : "bg-card",
            )}
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              {esHoy ? "Hoy" : NOMBRE_DIA[diaSemanaDe(d.fecha)]}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {dia} {NOMBRE_MES[mes - 1]}
            </span>
            <IconoClima
              icono={condicion.icono}
              className="my-0.5 size-7 text-foreground/80"
            />
            <span className="text-lg font-bold leading-none tabular-nums">
              {conDecimal(d.max)}°
            </span>
            <span className="text-sm font-semibold leading-none tabular-nums text-muted-foreground">
              {conDecimal(d.min)}°
            </span>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                lluvia ? "font-medium text-primary" : "text-muted-foreground/60",
              )}
            >
              {lluvia ? `${d.probLluvia}%` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Etiqueta larga de un día, para el tooltip de cada celda. */
export function etiquetaDia(d: DiaPronostico): string {
  return `${fechaCorta(d.fecha)}: mínima ${conDecimal(d.min)}°, máxima ${conDecimal(d.max)}°, ${d.probLluvia}% de lluvia`;
}