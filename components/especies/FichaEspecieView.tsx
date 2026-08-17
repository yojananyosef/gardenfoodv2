"use client";

import { useState } from "react";
import { Droplets, Leaf, Bug, Scissors, CalendarDays, Sprout, Citrus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrackedView } from "@/hooks/useTrackedView";
import { cn } from "@/lib/utils";
import { type FichaEspecie, type Especie } from "@/lib/agronomy";

type TabId = "calendario" | "riego" | "nutricion" | "sanidad" | "poda" | "cosecha";

const TABS: { id: TabId; l: string; icon: typeof CalendarDays }[] = [
  { id: "calendario", l: "Calendario", icon: CalendarDays },
  { id: "riego", l: "Riego", icon: Droplets },
  { id: "nutricion", l: "Nutrición", icon: Leaf },
  { id: "sanidad", l: "Sanidad", icon: Bug },
  { id: "poda", l: "Poda", icon: Scissors },
  { id: "cosecha", l: "Cosecha", icon: Sprout },
];

function Descripcion({ desc }: { desc: Record<string, string> }) {
  return (
    <dl className="flex flex-col gap-2">
      {Object.entries(desc).map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {k}
          </dt>
          <dd className="text-sm text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TabCalendario({ cal }: { cal: FichaEspecie["cal"] }) {
  const mesActual = new Date().getMonth();
  return (
    <div className="flex flex-col gap-1">
      {cal.map((c, i) => {
        const activo = i === mesActual;
        return (
          <div
            key={c.mes}
            className={cn(
              "rounded-lg border px-4 py-3",
              activo ? "border-primary/60 bg-primary/5" : "border-border",
            )}
          >
            <div className="flex items-center gap-2">
              {activo ? (
                <span className="size-2 rounded-full bg-primary" aria-hidden />
              ) : null}
              <span className="text-sm font-semibold">{c.mes}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Etapa: {c.etapa}
            </p>
            <ul className="mt-1 flex flex-col gap-0.5 text-sm">
              <li>
                <strong>Riego:</strong> {c.riego}
              </li>
              <li>
                <strong>Nutrición:</strong> {c.nutr}
              </li>
              <li>
                <strong>Sanidad:</strong> {c.san}
              </li>
              <li>
                <strong>Alerta:</strong> {c.alerta}
              </li>
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function TabRiego({ riego }: { riego: FichaEspecie["riego"] }) {
  return (
    <div className="flex flex-col gap-3">
      {riego.map((r, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold">{r.etapa}</h4>
            <dl className="mt-2 flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Meses</dt>
                <dd className="text-right">{r.meses}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Frecuencia</dt>
                <dd className="text-right">{r.freq}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Volumen</dt>
                <dd className="text-right">{r.vol}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Señal OK</dt>
                <dd className="text-right">{r.senal}</dd>
              </div>
            </dl>
            <p className="mt-2 rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
              {r.tip}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabNutricion({ fert }: { fert: FichaEspecie["fert"] }) {
  return (
    <div className="flex flex-col gap-2">
      {fert.map((f, i) => (
        <div key={i} className="rounded-lg border px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">{f.mes}</span>
            <span className="text-xs text-muted-foreground">{f.fase}</span>
          </div>
          <p className="mt-1 text-sm">
            <strong>Producto:</strong> {f.prod}
          </p>
          <p className="text-sm">
            <strong>Dosis:</strong> {f.dosis}
          </p>
          <p className="text-sm">
            <strong>Dónde:</strong> {f.donde}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{f.porque}</p>
        </div>
      ))}
    </div>
  );
}

function TabSanidad({ san }: { san: FichaEspecie["san"] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {san.map((s, i) => (
        <div key={i} className="overflow-hidden rounded-lg border">
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-sm font-semibold"
            onClick={() => setAbierta(abierta === i ? null : i)}
          >
            <span>{s.nombre}</span>
            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {s.epoca}
            </span>
          </button>
          {abierta === i ? (
            <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm">
              <p>
                <strong>Síntoma:</strong> {s.sintoma}
              </p>
              <p>
                <strong>Época:</strong> {s.epoca}
              </p>
              <p className="text-primary">
                <strong>Control orgánico:</strong> {s.org}
              </p>
              <p>
                <strong>Control químico:</strong> {s.quim}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Por qué pasa:</strong> {s.fisiologia}
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TabPoda({ poda }: { poda: FichaEspecie["poda"] }) {
  return (
    <div className="flex flex-col gap-3">
      {poda.map((p, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold">{p.tipo}</h4>
            <dl className="mt-2 flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cuándo</dt>
                <dd className="text-right">{p.cuando}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Qué hacer</dt>
                <dd className="text-right">{p.que}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Herramientas</dt>
                <dd className="text-right">{p.herr}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Por qué</dt>
                <dd className="text-right">{p.porque}</dd>
              </div>
            </dl>
            <p className="mt-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Error común: {p.error}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabCosecha({ cos }: { cos: FichaEspecie["cos"] }) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(cos).map(([k, v]) => (
        <Card key={k}>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold">{k}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{v}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FichaEspecieView({
  especie,
  ficha,
}: {
  especie: Especie;
  ficha: FichaEspecie;
}) {
  const [tab, setTab] = useState<TabId>("calendario");
  const ref = useTrackedView<HTMLDivElement>({
    name: "VIEW_FICHA",
    especieId: especie.slug,
  });

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Citrus className="size-5 text-primary" aria-hidden />
            <CardTitle>{especie.nombre}</CardTitle>
          </div>
          <CardDescription>
            {ficha.nc} · Grupo {especie.grupo} · Dificultad {especie.dificultad}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Descripcion desc={ficha.desc} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              type="button"
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              className="min-h-12"
              onClick={() => setTab(t.id)}
            >
              <Icon className="size-4" aria-hidden />
              {t.l}
            </Button>
          );
        })}
      </div>

      {tab === "calendario" && <TabCalendario cal={ficha.cal} />}
      {tab === "riego" && <TabRiego riego={ficha.riego} />}
      {tab === "nutricion" && <TabNutricion fert={ficha.fert} />}
      {tab === "sanidad" && <TabSanidad san={ficha.san} />}
      {tab === "poda" && <TabPoda poda={ficha.poda} />}
      {tab === "cosecha" && <TabCosecha cos={ficha.cos} />}
    </div>
  );
}