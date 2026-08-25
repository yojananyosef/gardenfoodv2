"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Leaf, Bug, Scissors, CalendarDays, Sprout, Citrus, Info, Lightbulb, Flower2, MapPinned, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrackedView } from "@/hooks/useTrackedView";
import { cn } from "@/lib/utils";
import { type FichaEspecie, type Especie, getFenologia, getConsejos, ZONAS, getZonaIdDeComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/client";

type TabId = "calendario" | "riego" | "nutricion" | "sanidad" | "poda" | "cosecha" | "fenologia" | "consejos" | "info";

const TABS: { id: TabId; l: string; icon: typeof CalendarDays; desc: string }[] = [
  { id: "calendario", l: "Calendario", icon: CalendarDays, desc: "12 meses" },
  { id: "riego", l: "Riego", icon: Droplets, desc: "Etapas" },
  { id: "nutricion", l: "Nutrición", icon: Leaf, desc: "Por mes" },
  { id: "sanidad", l: "Sanidad", icon: Bug, desc: "Plagas" },
  { id: "poda", l: "Poda", icon: Scissors, desc: "Técnica" },
  { id: "cosecha", l: "Cosecha", icon: Sprout, desc: "Cosecha" },
  { id: "fenologia", l: "Fenología", icon: Flower2, desc: "Zona" },
  { id: "consejos", l: "Consejos", icon: Lightbulb, desc: "Tips" },
  { id: "info", l: "Info", icon: Info, desc: "Ficha" },
];

function Descripcion({ desc }: { desc: Record<string, string> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {Object.entries(desc).map(([k, v]) => (
        <div key={k} className="rounded-xl border bg-card px-3 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TabCalendario({ cal }: { cal: FichaEspecie["cal"] }) {
  const mesActual = new Date().getMonth();
  const [showAll, setShowAll] = useState(false);
  const actual = cal[mesActual];
  const resto = cal.filter((_, i) => i !== mesActual);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero mes actual — bento large */}
      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-amber-500/[0.05] shadow-sm">
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-center gap-2">
            <Badge className="gap-1 rounded-full"><CalendarDays className="size-3" /> Mes actual</Badge>
            <span className="font-mono text-xs text-muted-foreground">{actual.mes} · {actual.etapa}</span>
            <span className="ml-auto size-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
          </div>
          <CardTitle className="text-xl">{actual.mes} — {actual.etapa}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Riego", v: actual.riego, icon: Droplets, color: "bg-sky-500/10 text-sky-700" },
            { k: "Nutrición", v: actual.nutr, icon: Leaf, color: "bg-emerald-500/10 text-emerald-700" },
            { k: "Sanidad", v: actual.san, icon: Bug, color: "bg-amber-500/10 text-amber-700" },
            { k: "Alerta", v: actual.alerta, icon: Info, color: "bg-red-500/10 text-red-700" },
          ].map((item) => (
            <div key={item.k} className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
              <div className={cn("inline-flex size-7 items-center justify-center rounded-lg", item.color)}>
                <item.icon className="size-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.k}</span>
              <span className="text-sm leading-relaxed">{item.v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* resto con botón */}
      {!showAll ? (
        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAll(true)}>
          <Eye data-icon="inline-start" /> Ver los otros 11 meses
          <ChevronDown data-icon="inline-end" />
        </Button>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resto.map((c) => (
              <div key={c.mes} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{c.mes}</span>
                  <Badge variant="outline" className="rounded-full text-[11px]">{c.etapa}</Badge>
                </div>
                <Separator />
                <ul className="flex flex-col gap-1.5 text-sm">
                  <li><span className="font-medium">Riego:</span> <span className="text-muted-foreground">{c.riego}</span></li>
                  <li><span className="font-medium">Nutrición:</span> <span className="text-muted-foreground">{c.nutr}</span></li>
                  <li><span className="font-medium">Sanidad:</span> <span className="text-muted-foreground">{c.san}</span></li>
                  <li className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs"><span className="font-medium">Alerta:</span> {c.alerta}</li>
                </ul>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => setShowAll(false)}>
            Mostrar solo mes actual <ChevronUp data-icon="inline-end" />
          </Button>
        </>
      )}
    </div>
  );
}

function TabRiego({ riego }: { riego: FichaEspecie["riego"] }) {
  const mesActualAbbr = new Date().toLocaleDateString("es-CL", { month: "short" }).replace(".", "").toLowerCase();
  const isActive = (meses: string) => meses.toLowerCase().includes(mesActualAbbr.slice(0,3)) || meses.toLowerCase().includes(new Date().toLocaleDateString("es-CL",{month:"long"}).toLowerCase().slice(0,3));
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {riego.map((r, i) => {
        const active = isActive(r.meses);
        return (
          <Card key={i} className={cn("flex flex-col rounded-2xl transition-shadow hover:shadow-sm", active && "border-primary/40 shadow-sm ring-1 ring-primary/10")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={active ? "default" : "secondary"} className="rounded-full text-[11px]">{r.etapa}</Badge>
                {active && <Badge className="gap-1 rounded-full text-[10px]"><span className="size-1.5 rounded-full bg-white animate-pulse" /> Activo este mes</Badge>}
              </div>
              <CardTitle className="text-sm">{r.meses}</CardTitle>
              <CardDescription className="text-xs">{r.freq} · {r.vol}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 pt-0">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/50 px-2 py-1.5"><span className="text-muted-foreground">Frecuencia</span><div className="font-medium">{r.freq}</div></div>
                <div className="rounded-lg bg-muted/50 px-2 py-1.5"><span className="text-muted-foreground">Volumen</span><div className="font-medium">{r.vol}</div></div>
                <div className="col-span-2 rounded-lg bg-muted/30 px-2 py-1.5"><span className="text-muted-foreground">Señal</span><div className="text-sm">{r.senal}</div></div>
              </div>
              <p className="mt-auto rounded-xl bg-sky-500/10 px-3 py-2 text-xs leading-relaxed text-sky-900 dark:text-sky-100">{r.tip}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TabNutricion({ fert }: { fert: FichaEspecie["fert"] }) {
  const mesActualIdx = new Date().getMonth();
  const mesesCortos = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const mesAbbr = mesesCortos[mesActualIdx];
  const [showAll, setShowAll] = useState(false);
  const actualRows = fert.filter(f => f.mes.toLowerCase().includes(mesAbbr));
  const resto = fert.filter(f => !f.mes.toLowerCase().includes(mesAbbr));
  const destacados = actualRows.length ? actualRows : fert.slice(0,2);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {destacados.map((f, i) => (
          <Card key={i} className="rounded-2xl border-primary/20 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full">{f.mes}</Badge>
                <span className="text-xs text-muted-foreground">{f.fase}</span>
                {i===0 && <Badge variant="outline" className="ml-auto gap-1 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> Este mes</Badge>}
              </div>
              <CardTitle className="text-base">{f.prod}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Dosis</span><span className="font-medium">{f.dosis}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Dónde</span><span className="font-medium">{f.donde}</span></div>
              <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">{f.porque}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!actualRows.length && (
        <p className="rounded-xl border-dashed bg-muted/20 px-4 py-3 text-center text-sm text-muted-foreground">Este mes no hay fertilización programada — buen momento para compost basal.</p>
      )}
      {!showAll ? (
        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAll(true)}>
          Ver nutrición de otros meses ({resto.length}) <ChevronDown data-icon="inline-end" />
        </Button>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resto.map((f, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{f.mes}</span>
                  <span className="text-xs text-muted-foreground">{f.fase}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{f.prod}</p>
                <p className="text-xs text-muted-foreground">{f.dosis} · {f.donde}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.porque}</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => setShowAll(false)}>Mostrar solo mes actual <ChevronUp data-icon="inline-end" /></Button>
        </>
      )}
    </div>
  );
}

function TabSanidad({ san }: { san: FichaEspecie["san"] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {san.map((s, i) => (
        <div key={i} className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all", abierta===i && "ring-1 ring-primary/20")}>
          <button type="button" className="flex min-h-14 w-full items-center justify-between gap-2 px-4 text-left" onClick={() => setAbierta(abierta === i ? null : i)}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{s.nombre}</span>
              <span className="text-xs text-muted-foreground">{s.epoca}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">{s.epoca.split(" ")[0]}</Badge>
              {abierta===i ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </div>
          </button>
          {abierta === i && (
            <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
              <p><strong>Síntoma:</strong> {s.sintoma}</p>
              <p><strong>Época:</strong> {s.epoca}</p>
              <p className="rounded-xl bg-emerald-500/10 px-3 py-2"><strong className="text-emerald-700">Orgánico:</strong> {s.org}</p>
              <p><strong>Químico:</strong> {s.quim}</p>
              <p className="text-xs leading-relaxed text-muted-foreground"><strong>Fisiología:</strong> {s.fisiologia}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabPoda({ poda }: { poda: FichaEspecie["poda"] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {poda.map((p, i) => (
        <Card key={i} className="flex flex-col rounded-2xl">
          <CardHeader className="pb-2">
            <Badge variant="outline" className="w-fit rounded-full">{p.tipo}</Badge>
            <CardTitle className="text-base">{p.cuando}</CardTitle>
            <CardDescription>{p.que}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 pt-0 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted px-2 py-1.5"><span className="text-muted-foreground">Herramientas</span><div className="font-medium">{p.herr}</div></div>
              <div className="col-span-2 rounded-lg bg-primary/10 px-3 py-2 text-xs leading-relaxed"><strong>Por qué:</strong> {p.porque}</div>
            </div>
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"><strong>Error común:</strong> {p.error}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabCosecha({ cos }: { cos: FichaEspecie["cos"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(cos).map(([k, v]) => (
        <Card key={k} className="rounded-2xl">
          <CardHeader className="pb-2">
            <Badge variant="secondary" className="w-fit rounded-full">{k}</Badge>
          </CardHeader>
          <CardContent className="pt-0"><p className="text-sm leading-relaxed text-muted-foreground">{v}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabFenologia({ dbKey }: { dbKey: string }) {
  const [zonaNombre, setZonaNombre] = useState<string | null>(null);
  const [entrada, setEntrada] = useState<ReturnType<typeof getFenologia>>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const comunaPromise = data.user
        ? supabase.from("perfiles").select("comuna").eq("id", data.user.id).maybeSingle().then(r => r.data?.comuna as string | null)
        : Promise.resolve(null);
      comunaPromise.then(comuna => {
        const zonaId = getZonaIdDeComuna(comuna ?? undefined) ?? 7;
        const zona = ZONAS[zonaId];
        setZonaNombre(zona?.nombre ?? null);
        setEntrada(getFenologia(dbKey, zonaId));
        setLoading(false);
      });
    });
  }, [dbKey]);
  if (loading) return <p className="text-sm text-muted-foreground">Cargando fenología…</p>;
  if (!entrada) return <p className="text-sm text-muted-foreground">Sin datos para tu zona {zonaNombre ? `(${zonaNombre})` : ""}.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { k: "Brotación", v: entrada.brotacion },
        { k: "Floración", v: entrada.floracion },
        { k: "Cuaja", v: entrada.cuaja },
        { k: "Cosecha", v: `${entrada.cos_ini} – ${entrada.cos_fin}` },
      ].map(item => (
        <Card key={item.k} className="rounded-2xl text-center">
          <CardHeader className="pb-2"><CardDescription className="uppercase tracking-wide">{item.k}</CardDescription><CardTitle className="text-lg">{item.v}</CardTitle></CardHeader>
        </Card>
      ))}
      <Card className="rounded-2xl sm:col-span-2 lg:col-span-4"><CardContent className="pt-6"><p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">{entrada.notas}</p><p className="mt-2 text-xs text-muted-foreground">Zona: {zonaNombre}</p></CardContent></Card>
    </div>
  );
}

function TabConsejos({ dbKey }: { dbKey: string }) {
  const consejos = getConsejos(dbKey);
  if (consejos.length === 0) return <p className="text-sm text-muted-foreground">Sin consejos para esta especie.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {consejos.map((c, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700"><Lightbulb className="size-4" /></span>
          <p className="text-sm leading-relaxed">{c}</p>
        </div>
      ))}
    </div>
  );
}

function TabInfo({ ficha, zonaId }: { ficha: FichaEspecie; zonaId: number | null }) {
  const zona = zonaId ? ZONAS[zonaId] : null;
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="rounded-2xl lg:col-span-8"><CardHeader><CardTitle className="flex items-center gap-2"><Info className="size-4" /> Botánica</CardTitle></CardHeader><CardContent><Descripcion desc={ficha.desc} /></CardContent></Card>
      {zona ? (
        <Card className="rounded-2xl lg:col-span-4"><CardHeader><CardTitle className="flex items-center gap-2"><MapPinned className="size-4" /> Tu zona: {zona.nombre}</CardTitle><CardDescription>{zona.region} · {zona.clima}</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Tª máx</span><div className="font-semibold">{zona.txMax}°C</div></div><div className="rounded-xl bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Tª mín</span><div className="font-semibold">{zona.tnMin}°C</div></div><div className="rounded-xl bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Precip.</span><div className="font-semibold">{zona.pp} mm</div></div><div className="rounded-xl bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Horas frío</span><div className="font-semibold">{zona.hf}</div></div></CardContent></Card>
      ) : null}
    </div>
  );
}

export function FichaEspecieView({ especie, ficha }: { especie: Especie; ficha: FichaEspecie }) {
  const [zonaId, setZonaId] = useState<number | null>(null);
  const ref = useTrackedView<HTMLDivElement>({ name: "VIEW_FICHA", especieId: especie.slug });
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("perfiles").select("comuna").eq("id", data.user.id).maybeSingle().then(r => {
        setZonaId(getZonaIdDeComuna((r.data?.comuna as string | null) ?? undefined) ?? 7);
      });
    });
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-5">
      {/* Hero bento */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-muted lg:col-span-8 lg:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={especie.imagen} alt={especie.nombre} width={800} height={400} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/og.png"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div className="text-white">
              <h2 className="font-heading text-2xl font-semibold drop-shadow">{especie.nombre}</h2>
              <p className="font-mono text-xs italic opacity-90">{ficha.nc}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge className="rounded-full bg-white/90 text-foreground hover:bg-white">{especie.grupo}</Badge>
                <Badge variant="secondary" className="rounded-full bg-white/20 text-white border-white/20">{especie.dificultad}</Badge>
              </div>
            </div>
            <Badge variant="secondary" className="hidden shrink-0 rounded-full bg-white text-foreground sm:inline-flex">Ficha completa</Badge>
          </div>
        </div>
        <Card className="flex flex-col rounded-2xl lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Citrus className="size-5 text-primary" /><CardTitle className="text-base">{especie.nombre}</CardTitle></div>
            <CardDescription className="text-xs">{ficha.nc} · {especie.grupo} · {especie.dificultad}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{especie.descripcion}</p>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted px-3 py-2"><span className="text-muted-foreground">Grupo</span><div className="font-medium">{especie.grupo}</div></div>
              <div className="rounded-xl bg-muted px-3 py-2"><span className="text-muted-foreground">Suelo</span><div className="font-medium line-clamp-1">{ficha.desc["Suelo"] ?? "—"}</div></div>
              <div className="rounded-xl bg-muted px-3 py-2"><span className="text-muted-foreground">Riego</span><div className="font-medium line-clamp-1">{ficha.desc["Requerimiento hídrico"] ?? "—"}</div></div>
              <div className="rounded-xl bg-muted px-3 py-2"><span className="text-muted-foreground">Sol</span><div className="font-medium line-clamp-1">{ficha.desc["Exposición solar"] ?? "—"}</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl lg:col-span-12"><CardContent className="pt-6"><Descripcion desc={ficha.desc} /></CardContent></Card>

      <Tabs defaultValue="calendario" className="w-full gap-4">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 whitespace-nowrap">
              <t.icon className="size-4" /> {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendario"><TabCalendario cal={ficha.cal} /></TabsContent>
        <TabsContent value="riego"><TabRiego riego={ficha.riego} /></TabsContent>
        <TabsContent value="nutricion"><TabNutricion fert={ficha.fert} /></TabsContent>
        <TabsContent value="sanidad"><TabSanidad san={ficha.san} /></TabsContent>
        <TabsContent value="poda"><TabPoda poda={ficha.poda} /></TabsContent>
        <TabsContent value="cosecha"><TabCosecha cos={ficha.cos} /></TabsContent>
        <TabsContent value="fenologia"><TabFenologia dbKey={especie.dbKey} /></TabsContent>
        <TabsContent value="consejos"><TabConsejos dbKey={especie.dbKey} /></TabsContent>
        <TabsContent value="info"><TabInfo ficha={ficha} zonaId={zonaId} /></TabsContent>
      </Tabs>
    </div>
  );
}
