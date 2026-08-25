"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import type { EspeciePorZona } from "@/lib/agronomy";

function ViabBadge({ v }: { v: string }) {
  if (v === "si") return <Badge className="bg-emerald-600 text-white">Recomendado</Badge>;
  if (v === "riesgo") return <Badge className="bg-amber-500 text-white">Con riesgo</Badge>;
  return <Badge variant="secondary">No recomendado</Badge>;
}

function Section({ title, items }: { title: string; items: EspeciePorZona[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title} — {items.length}</h3>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((e) => (
            <li key={e.slug} className="overflow-hidden rounded-lg border bg-card">
              <Link href={`/especies/${e.slug}`} className="flex gap-3 p-3 hover:bg-muted">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.imagen} alt={e.nombre} width={48} height={48} className="h-12 w-12 object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{e.nombre}</span>
                    <ViabBadge v={e.viabilidad} />
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{e.descripcion}</span>
                  {e.viabRazon ? <span className="text-[11px] text-muted-foreground italic">{e.viabRazon}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  si: EspeciePorZona[];
  riesgo: EspeciePorZona[];
  no: EspeciePorZona[];
  zonaNombre: string;
  comuna: string | null;
  isFallback?: boolean;
};

export function RecomendacionesView({ si, riesgo, no, zonaNombre, comuna, isFallback }: Props) {
  if (!comuna) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>¿Qué puedo cultivar?</CardTitle>
          <CardDescription>Configura tu comuna para ver recomendaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ve a tu perfil y guarda tu comuna. Usamos tu zona agroclimática para filtrar las 30 especies.</p>
          <Link href="/perfil" className="mt-3 inline-flex text-sm font-medium text-primary underline">Ir a perfil</Link>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "Recomendadas", value: si.length, fill: "var(--primary)" },
    { name: "Con riesgo", value: riesgo.length, fill: "var(--chart-2)" },
    { name: "No recomendadas", value: no.length, fill: "var(--muted)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader>
          <CardTitle>Recomendadas para {zonaNombre}</CardTitle>
          <CardDescription>{comuna} {isFallback ? "· zona por defecto (Santiago Norte)" : ""} — 30 especies clasificadas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />{si.length} recomendadas</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-700"><span className="size-2 rounded-full bg-amber-500" />{riesgo.length} con riesgo</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground">{no.length} no recomendadas</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Basado en viabilidad por zona agroclimática — filtrado para tu comuna, no genérico.</p>
          </div>
          <ChartContainer config={{ value: { label: "especies" } }} className="mx-auto h-[140px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} strokeWidth={2} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Section title="Recomendadas" items={si} />
      <Section title="Con riesgo" items={riesgo} />
      <Section title="No recomendadas" items={no} />
    </div>
  );
}
