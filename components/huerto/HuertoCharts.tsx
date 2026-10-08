"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

export function TareasDonut({ data }: { data: { name: string; value: number; fill: string }[] }) {
  if (data.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sin tareas para graficar</p>;
  return (
    <>
      <ChartContainer config={{ value: { label: "tareas" } }} className="mx-auto h-[160px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} strokeWidth={2} />
        </PieChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {data.map((d) => (
          <span key={d.name} className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs">
            <span className="size-2 rounded-full" style={{ background: d.fill }} /> {d.name}: {d.value}
          </span>
        ))}
      </div>
    </>
  );
}

/*
 * No hay gráfico de alertas, y es a propósito.
 *
 * existed uno de barras con «días con alerta por tipo». En la práctica siempre
 * tenía una sola barra —casi siempre «lluvia»— con un número que la tira de 7
 * días de arriba ya mostraba celda por celda, y que la lista de alertas de abajo
 * volvía a enumerar con su fecha. Un gráfico de un solo dato no agrega nada:
 * le roba altura a la pantalla y le hace creer al usuario que hay más de lo que
 * hay. Para qué graficar cuando el dato cabe en una frase: `resumenAlertas()`
 * en `lib/climate/alertas.ts` dice «5 días con aviso» en el badge.
 */