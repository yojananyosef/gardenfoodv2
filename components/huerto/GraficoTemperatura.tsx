"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HoraClima } from "@/lib/climate/alertas";
import { condicionDe } from "@/lib/climate/condiciones";
import { cn } from "@/lib/utils";

/**
 * La curva de temperatura por hora.
 *
 * Este es el gráfico que faltaba. El que había antes era de barras con un
 * único dato («lluvia: 5 días») y un eje entero de 0 a 8: se leía como mucho
 * más info de la que tenía. Un gráfico de un dato no informa, ocupa.
 *
 * La curva tiene forma porque los datos la tienen: sube de madrugada, baja de
 * tarde, y en un pronóstico de helada se ve el valle donde cae la mínima. Es el
 * mismo criterio con el que funciona el gráfico de Google, y no es que copiémoslo
 * — es que los grados por hora son la única forma de ver un valle de mínima, que
 * es justo el dato que decide si hay que proteger los brotes.
 *
 * Las barras de probabilidad van en el mismo eje X pero como segunda serie: la
 * lluvia y la temperatura son la misma pregunta por dos caras (¿cuánto llueve? y
 * ¿cuánto refresca?), y separarlas en dos gráficos los desconecta.
 */
const CONFIG: ChartConfig = {
  temp: { label: "Temperatura", color: "var(--chart-4)" },
  probLluvia: { label: "Prob. de lluvia", color: "var(--chart-3)" },
};

export function GraficoTemperatura({
  horas,
  umbral,
  className,
}: {
  horas: HoraClima[];
  /** Umbral de helada de la zona, para dibujar la línea de referencia. */
  umbral: number | null;
  className?: string;
}) {
  if (horas.length < 2) return null;

  // El eje empieza en el suelo de helada, no en 0: con una curva entre -3 y 18
  // °C, partir de 0 aplasta la parte baja —que es justo la que importa en
  // invierno— y deja la línea pegada al techo.
  const temps = horas.map((h) => h.temp);
  const min = Math.min(...temps, ...(umbral != null ? [umbral] : []));
  const max = Math.max(...temps);
  const piso = Math.floor(min) - 1;
  const techo = Math.ceil(max) + 1;

  const datos = horas.map((h) => ({
    hora: h.hora,
    etiqueta: `${Number(h.hora.slice(11, 13))}h`,
    temp: h.temp,
    probLluvia: h.probLluvia,
    condicion: condicionDe(h.codigo).etiqueta,
  }));

  const conHelada = umbral != null && umbral <= min;
  // Una línea de referencia por debajo de todo el rango no informa de nada; solo
  // aparece si el pronóstico realmente se acerca o la cruza.
  const referencia = conHelada ? umbral : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ChartContainer config={CONFIG} className="h-[150px] w-full">
        <ComposedChart data={datos} margin={{ top: 6, left: -20, right: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            // Una hora de cada tres: en 360 px caben 24 etiquetas de 4 caracteres
            // y se pisan. La curve queda entera.
            interval={2}
            tick={{ fontSize: 10 }}
          />
          {/* Eje de temperatura, el que tiene números a la izquierda. */}
          <YAxis
            yAxisId="temp"
            domain={[piso, techo]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            width={34}
          />
          {/* Eje de probabilidad: sin números. La escala va de 0 a 100 pero
              mostrar «100%» al lado de un «17 °C» en la misma pantalla confunde;
              las barras se leen por la altura contra la barra de arriba. */}
          <YAxis yAxisId="lluvia" domain={[0, 100]} hide />
          <ChartTooltip
            content={<TooltipCustomizado />}
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          />
          {referencia != null ? (
            <ReferenceLine
              y={referencia}
              stroke="var(--destructive)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          ) : null}
          <Bar
            yAxisId="lluvia"
            dataKey="probLluvia"
            fill="var(--chart-3)"
            fillOpacity={0.35}
            radius={[3, 3, 0, 0]}
            maxBarSize={10}
            isAnimationActive={false}
          />
          <Area
            yAxisId="temp"
            dataKey="temp"
            type="monotone"
            stroke="var(--chart-4)"
            strokeWidth={2}
            fill="var(--chart-4)"
            fillOpacity={0.12}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-chart-4" />
          Temperatura
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-chart-3/50" />
          Probabilidad de lluvia
        </span>
        {referencia != null ? (
          <span className="flex items-center gap-1.5 text-destructive">
            <span className="h-0 w-4 border-t border-dashed border-destructive" />
            Umbral de helada ({referencia} °C)
          </span>
        ) : null}
        <span className="ml-auto">
          Mínima {piso + 1}° · máxima {techo - 1}°
        </span>
      </div>
    </div>
  );
}

/**
 * Tooltip con la condición del día.
 *
 * `ChartTooltipContent` por sí solo muestra el número. Agregar la frase —«Luvia
 * ligera», «Chubascos»— es lo que convierte el punto en algo que el usuario puede
 * acting sobre: no puede regar «23 grados», sí puede decidir con «chubascos a
 * primera hora».
 */
function TooltipCustomizado(props: {
  active?: boolean;
  payload?: { payload: { etiqueta: string; temp: number; probLluvia: number; condicion: string } }[];
}) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{p.etiqueta}</p>
      <p className="mt-0.5 font-mono tabular-nums">{Math.round(p.temp)} °C</p>
      <p className="text-muted-foreground">{p.condicion}</p>
      <p className="text-muted-foreground">{p.probLluvia}% de lluvia</p>
    </div>
  );
}