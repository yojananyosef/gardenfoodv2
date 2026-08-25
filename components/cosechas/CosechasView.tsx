"use client";

import { useMemo, useOptimistic, useTransition, useState } from "react";
import { Plus, Trash2, Trophy, TrendingUp, Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { agregarRegistro, eliminarRegistro } from "@/lib/cosechas/actions";
import { calcularLogros, type Logro } from "@/lib/cosechas/logros";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import type { RegistroCosecha } from "@/types";

const NOMBRES: Record<string, string> = {
  duraznero: "Durazno",
  ciruelo: "Ciruela",
  cerezo: "Cereza",
  damasco: "Damasco",
  nectarino: "Nectarín",
  manzano: "Manzana",
  peral: "Pera",
  membrillo: "Membrillo",
  limonero: "Limón",
  naranjo: "Naranja",
  mandarino: "Mandarina",
  pomelo: "Pomelo",
  nogal: "Nogal",
  almendro: "Almendra",
  higuera: "Higo",
  granado: "Granada",
  caqui: "Caqui",
  vid: "Vid",
  arandano: "Arándano",
  olivo: "Olivo",
  frutilla: "Frutilla",
  frambuesa: "Frambuesa",
  mora: "Mora",
  kiwi: "Kiwi",
  "avellano-europeo": "Avellano europeo",
  "nispero-japones": "Níspero japonés",
  chirimoya: "Chirimoya",
  lucuma: "Lúcuma",
  "papayo-chileno": "Papayo chileno",
  palto: "Palto",
};

export function nombreEspecie(especie: string): string {
  return NOMBRES[especie] ?? getEspeciePorDbKey(especie)?.nombre ?? especie;
}

export function Estadisticas({ registros }: { registros: RegistroCosecha[] }) {
  const totalKg = registros.reduce((acc, r) => acc + (r.produccionKg ?? 0), 0);
  const especies = new Set(registros.map((r) => r.especie)).size;
  const logros = calcularLogros(registros).filter((l) => l.unlocked).length;

  const stats = [
    { label: "Registros", valor: registros.length },
    { label: "Producción total", valor: `${Math.round(totalKg * 100) / 100} kg` },
    { label: "Especies", valor: especies },
    { label: "Logros", valor: logros },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="font-fraunces text-xl font-semibold">{s.valor}</div>
        </div>
      ))}
    </div>
  );
}

export function ProduccionChart({ registros }: { registros: RegistroCosecha[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registros) {
      if (r.produccionKg == null) continue;
      const d = new Date(r.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + r.produccionKg);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mes, kg]) => ({ mes: mes.slice(5) + "/" + mes.slice(2, 4), kg: Math.round(kg * 10) / 10 }));
  }, [registros]);

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Aún sin producción para graficar — registra tu primera cosecha.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge className="gap-1 rounded-full"><TrendingUp className="size-3" /> Producción</Badge>
          <span className="text-xs text-muted-foreground">kg por mes (últimos 6)</span>
        </div>
        <CardTitle className="text-base">Evolución de cosechas</CardTitle>
        <CardDescription className="text-xs">Suma mensual de kg registrados</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ kg: { label: "kg", color: "var(--primary)" } }} className="h-[180px] w-full">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="kg" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DistribucionEspecieChart({ registros }: { registros: RegistroCosecha[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registros) {
      map.set(r.especie, (map.get(r.especie) ?? 0) + (r.produccionKg ?? 1));
    }
    const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([especie, kg], i) => ({ especie: nombreEspecie(especie), kg, fill: colors[i % colors.length] }));
  }, [registros]);

  if (data.length === 0) return null;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 rounded-full"><Leaf className="size-3" /> Especies</Badge>
          <span className="text-xs text-muted-foreground">top 5 por producción</span>
        </div>
        <CardTitle className="text-base">Distribución por especie</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ kg: { label: "kg" } }} className="h-[180px] w-full">
          <BarChart data={data} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis dataKey="especie" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="kg" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function LogrosChart({ logros }: { logros: Logro[] }) {
  const data = useMemo(() => {
    const unlocked = logros.filter((l) => l.unlocked).length;
    return [
      { name: "Desbloqueados", value: unlocked, fill: "var(--primary)" },
      { name: "Bloqueados", value: logros.length - unlocked, fill: "var(--muted)" },
    ];
  }, [logros]);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Progreso de logros</CardTitle>
        <CardDescription className="text-xs">{data[0].value} de {logros.length} desbloqueados</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ value: { label: "logros" } }} className="mx-auto h-[160px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" innerRadius={45} outerRadius={65} strokeWidth={2} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AgregarRegistro({ especies }: { especies: string[] }) {
  const [especie, setEspecie] = useState<string | null>(null);
  const [kg, setKg] = useState("");
  const [nota, setNota] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especie) {
      toast.error("Selecciona una especie.");
      return;
    }
    const produccionKg = kg.trim() === "" ? null : Math.max(0, Number(kg) || 0);
    startTransition(async () => {
      const result = await agregarRegistro({
        especie,
        produccionKg,
        nota: nota.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cosecha registrada.");
      setEspecie(null);
      setKg("");
      setNota("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="especie-cosecha">Especie</Label>
        <Select value={especie ?? undefined} onValueChange={setEspecie}>
          <SelectTrigger id="especie-cosecha" className="w-full min-h-12">
            <SelectValue placeholder="¿Qué cosechaste?" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {especies.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {nombreEspecie(slug)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="kg">Producción (kg, opcional)</Label>
        <Input
          id="kg"
          type="number"
          min={0}
          step="0.1"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          placeholder="Ej: 12.5"
          className="min-h-12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nota">Nota (opcional)</Label>
        <Input
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej: maduró temprano este año"
          className="min-h-12"
        />
      </div>
      <Button type="submit" className="min-h-12 w-full">
        <Plus className="size-4" aria-hidden />
        Registrar cosecha
      </Button>
    </form>
  );
}

export function Historial({
  registros,
}: {
  registros: RegistroCosecha[];
}) {
  const [optimistic, setOptimistic] = useOptimistic(registros);
  const [, startTransition] = useTransition();

  function handleEliminar(registro: RegistroCosecha) {
    startTransition(async () => {
      setOptimistic((prev) => prev.filter((r) => r.id !== registro.id));
      const result = await eliminarRegistro(registro.id);
      if (result.error) toast.error(result.error);
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes cosechas registradas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {optimistic.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
        >
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{nombreEspecie(r.especie)}</span>
              {r.produccionKg != null ? (
                <span className="text-sm text-muted-foreground">
                  {r.produccionKg} kg
                </span>
              ) : null}
            </div>
            {r.nota ? (
              <p className="text-sm text-muted-foreground">{r.nota}</p>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {new Date(r.fecha).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Eliminar registro"
            className="min-h-12 min-w-12 text-muted-foreground hover:text-destructive"
            onClick={() => handleEliminar(r)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function Logros({ logros }: { logros: Logro[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {logros.map((l) => (
        <div
          key={l.id}
          className={cn(
            "flex flex-col gap-1 rounded-lg border px-4 py-3",
            l.unlocked ? "border-primary/40 bg-card" : "border-muted opacity-60",
          )}
        >
          <Trophy
            className={cn("size-5", l.unlocked ? "text-primary" : "text-muted-foreground")}
            aria-hidden
          />
          <span className="text-sm font-medium">{l.titulo}</span>
          <span className="text-xs text-muted-foreground">{l.descripcion}</span>
        </div>
      ))}
    </div>
  );
}