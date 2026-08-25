"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

export function AlertasBar({ data }: { data: { tipo: string; count: number; fill: string }[] }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground">Sin alertas para graficar — mes estable.</p>;
  return (
    <ChartContainer config={{ count: { label: "alertas", color: "var(--destructive)" } }} className="h-[140px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="tipo" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
