"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Interes, Semana, SlotCTR } from "@/lib/admin/insights";

interface Props {
  semanas: Semana[];
  ctrSlots: SlotCTR[];
  intereses: Interes[];
}

const ejes = { fontSize: 11, tickLine: false, axisLine: false } as const;

export function InsightsCharts({ semanas, ctrSlots, intereses }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Actividad semanal (8 semanas)</h3>
        {semanas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={semanas} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="desde" {...ejes} />
                <YAxis allowDecimals={false} {...ejes} />
                <Tooltip labelFormatter={(l) => `Semana del ${l}`} />
                <Legend />
                <Area
                  dataKey="nuevos"
                  name="Nuevos"
                  type="monotone"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                />
                <Area
                  dataKey="retornados"
                  name="Retornados"
                  type="monotone"
                  stackId="1"
                  stroke="hsl(160 60% 35%)"
                  fill="hsl(160 60% 35%)"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">CTR por slot</h3>
        {ctrSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ctrSlots} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="adUnitId" {...ejes} />
                <YAxis {...ejes} unit="%" />
                <Tooltip />
                <Bar dataKey="ctrPct" name="CTR %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Interés por especie (30d)</h3>
        {intereses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos con especie</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={intereses}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} {...ejes} />
                <YAxis type="category" dataKey="especieId" width={90} {...ejes} />
                <Tooltip />
                <Bar dataKey="eventos" name="Eventos" fill="hsl(160 60% 35%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
