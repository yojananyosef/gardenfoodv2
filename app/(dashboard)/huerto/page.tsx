import Link from "next/link";
import {
  Sprout,
  Leaf,
  CalendarDays,
  AlertTriangle,
  MapPinned,
  Plus,
  ArrowRight,
  Trees,
  CheckCircle2,
  Sun,
  Droplets,
  CloudRain,
  ThermometerSun,
  Sparkles,
  Compass,
  LayoutGrid,
  ListTodo,
  Thermometer,
} from "lucide-react";

import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { SponsoredBanner } from "@/components/ads/SponsoredBanner";
import { AgregarCultivo } from "@/components/huerto/AgregarCultivo";
import { AgregarArbol } from "@/components/huerto/AgregarArbol";
import { AlertasClimaticas } from "@/components/huerto/AlertasClimaticas";
import { ListaCultivos } from "@/components/huerto/ListaCultivos";
import { ListaArboles } from "@/components/huerto/ListaArboles";
import { prepararCultivos } from "@/lib/huerto/nombres";
import { TareasDelDia } from "@/components/huerto/TareasDelDia";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TareasDonut, AlertasBar } from "@/components/huerto/HuertoCharts";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";
import { ESPECIES, MESES, getEspeciesPorZona, getZonaIdDeComuna } from "@/lib/agronomy";
import { climateAlertsProvider } from "@/lib/climate";
import { getArboles, getCultivos, getPerfil, getTareasDelDia } from "@/lib/huerto/data";
import { getZonaDeComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";

function hoyISO(): string {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mes}-${dia}`;
}

export default async function HuertoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [cultivos, tareas, perfil, arboles, sponsorships] = await Promise.all([
    getCultivos(user.id),
    getTareasDelDia(user.id, hoyISO()),
    getPerfil(user.id),
    getArboles(user.id),
    getActiveSponsorships("huerto", user.id),
  ]);

  const zona = getZonaDeComuna(perfil?.comuna);
  const mesActual = new Date().getMonth();
  const alertas = zona ? climateAlertsProvider.getAlertas(zona, mesActual + 1) : [];

  const cultivosConNombre = prepararCultivos(cultivos);
  const especiesDisponibles = ESPECIES.filter((e) => !cultivos.some((c) => c.especie === e.dbKey));
  const zonaId = getZonaIdDeComuna(perfil?.comuna) ?? 7;
  const recom = getEspeciesPorZona(zonaId);
  const esHuertoVacio = cultivos.length === 0 && arboles.length === 0;
  const nombre = (user.user_metadata as Record<string, unknown>)?.["nombre"] as string | undefined;
  const nombreCorto = nombre ? nombre.split(" ")[0] : null;

  const tareasChartData = [
    { name: "Pendiente", value: tareas.filter((t) => t.estado === "pendiente").length, fill: "var(--muted-foreground)" },
    { name: "En proceso", value: tareas.filter((t) => t.estado === "en_proceso").length, fill: "var(--chart-2)" },
    { name: "Completada", value: tareas.filter((t) => t.estado === "completada").length, fill: "var(--primary)" },
  ].filter((d) => d.value > 0);
  const alertasChartData = (() => {
    const map = new Map<string, number>();
    for (const a of alertas) map.set(a.tipo, (map.get(a.tipo) ?? 0) + 1);
    const colors: Record<string, string> = { helada: "var(--chart-4)", sequia: "var(--chart-2)", lluvia: "var(--chart-3)", calor: "var(--destructive)" };
    return Array.from(map.entries()).map(([tipo, count]) => ({ tipo, count, fill: colors[tipo] ?? "var(--primary)" }));
  })();

  return (
    <div className="flex flex-col gap-5">
      {/* Header + stats — always visible, bento */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-1">
                <Leaf className="size-3" /> Mi huerto
              </Badge>
              {zona ? (
                <Badge variant="outline" className="gap-1.5 rounded-full bg-card">
                  <MapPinned className="size-3" />
                  {zona.nombre} · {MESES[mesActual]}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">Configura tu comuna</Badge>
              )}
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-[1.9rem]">
              {nombreCorto ? `Hola, ${nombreCorto} —` : "Mi huerto"}
              <span className="text-muted-foreground"> {esHuertoVacio ? "empieza aquí" : "al día"}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {zona
                ? `Tu zona: ${zona.nombre} — ${MESES[mesActual]}. Calendario fenológico y alertas para ${perfil?.comuna ?? "tu comuna"}.`
                : "Actualiza tu comuna en tu perfil para recomendaciones a la medida."}
            </p>
          </div>

          <Card className="hidden shrink-0 rounded-2xl border-foreground/10 bg-card p-3 shadow-sm sm:flex sm:items-center sm:gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-4" />
            </span>
            <div className="flex flex-col pr-2">
              <span className="text-xs font-medium leading-none">Hoy es</span>
              <span className="text-sm font-semibold capitalize">
                {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
          </Card>
        </div>

        {/* Bento stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <Sprout className="size-3.5" /> Cultivos
                </CardDescription>
                <Badge variant={cultivos.length > 0 ? "default" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                  {cultivos.length > 0 ? "activo" : "vacío"}
                </Badge>
              </div>
              <CardTitle className="font-heading flex items-baseline gap-2 text-3xl">
                {cultivos.length}
                <span className="text-sm font-normal text-muted-foreground">especies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trees className="size-3" /> + {arboles.length} árboles inventario
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500/60 to-emerald-500/0" aria-hidden />
          </Card>

          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <CheckCircle2 className="size-3.5" /> Tareas hoy
                </CardDescription>
                <Badge variant={tareas.length > 0 ? "secondary" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                  {tareas.length} pendientes
                </Badge>
              </div>
              <CardTitle className="font-heading flex items-baseline gap-2 text-3xl">
                {tareas.length}
                <span className="text-sm font-normal text-muted-foreground">tareas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3" /> {new Date().toLocaleDateString("es-CL", { weekday: "long" })}
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-sky-500/60 to-sky-500/0" aria-hidden />
          </Card>

          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <AlertTriangle className="size-3.5" /> Alertas
                </CardDescription>
                <Badge variant={alertas.length > 0 ? "destructive" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                  {alertas.length === 0 ? "sin alertas" : `${alertas.length} alerta${alertas.length > 1 ? "s" : ""}`}
                </Badge>
              </div>
              <CardTitle className="font-heading flex items-baseline gap-2 text-3xl">
                {alertas.length}
                <span className="text-sm font-normal text-muted-foreground">avisos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {alertas.length > 0 ? <ThermometerSun className="size-3" /> : <Sun className="size-3" />}
                {zona ? `Zona ${zona.nombre}` : "Sin zona"}
              </div>
            </CardContent>
            <div
              className={`h-1 w-full ${alertas.length > 0 ? "bg-gradient-to-r from-amber-500/60 to-amber-500/0" : "bg-gradient-to-r from-muted to-transparent"}`}
              aria-hidden
            />
          </Card>
        </div>
      </div>

      {/* Recomendadas — hero bento (outside tabs, always visible but compact) */}
      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-amber-500/[0.06] shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge className="gap-1 rounded-full">
                  <Sparkles className="size-3" /> Recomendadas para tu zona
                </Badge>
                {zona ? <span className="font-mono text-xs text-muted-foreground">{zona.nombre} · ID {zonaId}</span> : null}
              </div>
              <CardTitle className="text-lg leading-tight">
                {zona ? `Qué plantar en ${zona.nombre}` : "Configura tu comuna"}
              </CardTitle>
              <CardDescription className="max-w-prose text-[13px] leading-relaxed">
                {zona
                  ? `${recom.si.length} recomendadas · ${recom.riesgo.length} con riesgo · ${recom.no.length} no recomendadas.`
                  : "Configura tu comuna para ver qué puedes cultivar con éxito."}
              </CardDescription>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1.5 shadow-sm sm:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">{recom.si.length} óptimas</span>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium">{recom.riesgo.length} riesgo</span>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium">{recom.no.length} evitar</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="rounded-full" render={<Link href="/recomendadas" />}>
            <Compass data-icon="inline-start" />
            Ver recomendadas
            <ArrowRight data-icon="inline-end" />
          </Button>
          <p className="text-xs text-muted-foreground">Filtrado por tu comuna · Datos de viabilidad real.</p>
        </CardContent>
      </Card>

      {/* TABS + BENTO — core fix for scroll fatigue */}
      <Tabs defaultValue={esHuertoVacio ? "cultivos" : "cultivos"} className="w-full gap-4">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
          <TabsTrigger value="cultivos" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <LayoutGrid className="size-4" />
            Mi huerto
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
              {cultivos.length + arboles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tareas" className="gap-1.5 rounded-lg">
            <ListTodo className="size-4" />
            Tareas
            <Badge variant={tareas.length > 0 ? "default" : "outline"} className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
              {tareas.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="clima" className="gap-1.5 rounded-lg">
            <Thermometer className="size-4" />
            Clima
            <Badge variant={alertas.length > 0 ? "destructive" : "outline"} className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
              {alertas.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* CULTIVOS — bento 12-col */}
        <TabsContent value="cultivos" className="mt-2 flex flex-col gap-4">
          {esHuertoVacio ? (
            <Card className="overflow-hidden rounded-2xl border-dashed">
              <CardContent className="p-0">
                <Empty className="gap-6 p-6 sm:p-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary">
                      <Sprout className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle className="font-heading text-xl">Tu huerto está vacío</EmptyTitle>
                    <EmptyDescription className="max-w-sm">
                      Empieza con una especie. Te mostraremos el calendario exacto para tu comuna.
                    </EmptyDescription>
                  </EmptyHeader>

                  <div className="grid w-full max-w-xl gap-3 text-left sm:grid-cols-3">
                    {[
                      { step: "1", title: "Elige especie", desc: "30 fichas", icon: Leaf },
                      { step: "2", title: "Agrega plantas", desc: "Cantidad + calendario", icon: Plus },
                      { step: "3", title: "Sigue tareas", desc: "Tareas y alertas", icon: CalendarDays },
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {s.step}
                          </span>
                          <s.icon className="size-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium leading-none">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{s.desc}</span>
                      </div>
                    ))}
                  </div>

                  <EmptyContent className="max-w-xl">
                    <div className="w-full rounded-2xl border bg-card p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <Plus className="size-4" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">Agregar tu primer cultivo</span>
                          <span className="text-xs text-muted-foreground">Frutilla o limonero para principiante</span>
                        </div>
                      </div>
                      <AgregarCultivo especies={especiesDisponibles} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ¿Dudas?{" "}
                      <Link href="/recomendadas" className="font-medium text-primary underline-offset-4 hover:underline">
                        Mira qué es recomendable en tu zona
                      </Link>
                    </p>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Agregar — bento small, sticky */}
              <Card className="flex flex-col rounded-2xl shadow-sm lg:col-span-5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <Plus className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <CardTitle className="text-base">Agregar cultivo</CardTitle>
                      <CardDescription className="text-xs">Elige especie y cantidad.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <AgregarCultivo especies={especiesDisponibles} />
                </CardContent>
                <div className="px-6 pb-4">
                  <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Tip: {especiesDisponibles.length} especies aún no en tu huerto
                  </div>
                </div>
              </Card>

              {/* Tus cultivos — bento large */}
              <Card className="flex flex-col rounded-2xl shadow-sm lg:col-span-7">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Leaf className="size-4 text-primary" /> Tus cultivos
                    </CardTitle>
                    <CardDescription className="text-xs">{cultivosConNombre.length} especies activas</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {cultivosConNombre.length} activos
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1">
                  <ListaCultivos cultivos={cultivosConNombre} />
                </CardContent>
              </Card>

              {/* Inventario árboles — full width bento, split inside */}
              <Card className="rounded-2xl shadow-sm lg:col-span-12">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="hidden size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 sm:inline-flex">
                        <Trees className="size-4" />
                      </span>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">Inventario de árboles</CardTitle>
                        <CardDescription className="text-xs">Seguimiento por árbol individual.</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full">
                      {arboles.length} árboles
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-xl border bg-card p-4">
                      <p className="mb-3 text-sm font-medium">Registrar árbol</p>
                      <AgregarArbol especies={ESPECIES} />
                    </div>
                    <div className="flex flex-col gap-3">
                      {arboles.length === 0 ? (
                        <Empty className="h-full border-dashed py-8">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Trees className="size-4" />
                            </EmptyMedia>
                            <EmptyTitle className="text-sm">Sin árboles aún</EmptyTitle>
                            <EmptyDescription className="text-xs">Registra tu primer árbol para cosechas y podas.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <ListaArboles arboles={arboles} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {sponsorships.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sponsorships.slice(0, 2).map((s) => (
                <NativeAdSlot key={s.id} sponsorship={s} />
              ))}
            </div>
          ) : null}
        </TabsContent>

        {/* TAREAS — bento split */}
        <TabsContent value="tareas" className="mt-2">
          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="rounded-2xl shadow-sm lg:col-span-8">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
                      <CalendarDays className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <CardTitle className="text-base">Tareas de hoy</CardTitle>
                      <CardDescription className="text-xs capitalize">
                        {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={tareas.length > 0 ? "default" : "secondary"} className="rounded-full">
                    {tareas.length} {tareas.length === 1 ? "tarea" : "tareas"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {tareas.length === 0 ? (
                  <Empty className="border-dashed py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Sun className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle className="text-sm">Día libre en el huerto</EmptyTitle>
                      <EmptyDescription className="text-xs">No hay tareas hoy. Ideal para revisar riego o planificar.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" render={<Link href="/calendario" />}>
                          Ver calendario <ArrowRight data-icon="inline-end" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full" render={<Link href="/explorar" />}>
                          Explorar especies
                        </Button>
                      </div>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <TareasDelDia tareas={tareas} />
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 lg:col-span-4">
              <Card className="rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Ritmo de la semana</CardTitle>
                  <CardDescription className="text-white/70">Mantén el impulso</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
                    <span className="text-sm text-white">Progreso hoy</span>
                    <span className="font-mono text-sm font-semibold text-white">
                      {tareas.filter((t) => t.estado === "completada").length}/{tareas.length}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-full bg-white text-primary hover:bg-white/90"
                    render={<Link href="/calendario" />}
                  >
                    Ver semana completa <ArrowRight data-icon="inline-end" />
                  </Button>
                  <p className="text-xs leading-relaxed text-white/60">
                    Tip: marca tus tareas al atardecer para que el calendario de mañana se ajuste.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-primary" /> Estado de hoy
                  </CardTitle>
                  <CardDescription className="text-xs">Donut por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <TareasDonut data={tareasChartData} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-dashed bg-muted/20">
                <CardContent className="p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <Sparkles className="size-3.5 text-primary" /> Sugerencia rápida
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {esHuertoVacio
                      ? "Agrega tu primer cultivo para generar tareas automáticas por especie y zona."
                      : "¿Faltan tareas? Revisa que tus cultivos tengan la zona correcta en tu perfil."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* CLIMA — bento */}
        <TabsContent value="clima" className="mt-2">
          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="rounded-2xl shadow-sm lg:col-span-8">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="hidden size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 sm:inline-flex">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base">Alertas estacionales — {MESES[mesActual]}</CardTitle>
                      <CardDescription className="text-xs">Zona {zona?.nombre ?? "sin zona"} · Datos agroclimáticos</CardDescription>
                    </div>
                  </div>
                  <Badge variant={alertas.length > 0 ? "destructive" : "outline"} className="rounded-full">
                    {alertas.length > 0 ? `${alertas.length} activas` : "sin alertas"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {alertas.length === 0 ? (
                  <Alert className="rounded-xl border-dashed bg-muted/20">
                    <Sun aria-hidden />
                    <AlertTitle>Sin alertas destacadas</AlertTitle>
                    <AlertDescription>Buen mes para riego y poda según tu calendario. Sin heladas ni sequía crítica.</AlertDescription>
                  </Alert>
                ) : (
                  <AlertasClimaticas alertas={alertas} />
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground">
                    <Droplets className="size-3" /> Riego
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground">
                    <ThermometerSun className="size-3" /> Helada
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground">
                    <CloudRain className="size-3" /> Lluvia
                  </span>
                </div>
                <AlertasBar data={alertasChartData} />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 lg:col-span-4">
              <Card className="rounded-2xl border-primary/20 bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPinned className="size-4 text-primary" /> Tu zona
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="font-medium">{zona ? zona.nombre : "Sin zona asignada"}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {zona ? `${perfil?.comuna ?? "—"} · ${MESES[mesActual]} · ${alertas.length} alerta(s)` : "Actualiza tu comuna en perfil."}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-full" render={<Link href="/perfil" />}>
                    Editar comuna <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Separator />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Compass className="size-3" /> Recomendadas
                    </span>
                    <span>
                      {recom.si.length} óptimas / {recom.no.length} evitar
                    </span>
                  </div>
                  <Button size="sm" className="w-full rounded-full" render={<Link href="/recomendadas" />}>
                    Ver recomendadas <ArrowRight data-icon="inline-end" />
                  </Button>
                </CardContent>
              </Card>

              <Alert className="rounded-2xl border-dashed bg-muted/20">
                <Compass aria-hidden />
                <AlertTitle className="text-sm">¿Quieres afinar tu huerto?</AlertTitle>
                <AlertDescription className="text-xs">
                  Explora{" "}
                  <Link href="/explorar" className="font-medium text-primary underline-offset-4 hover:underline">
                    el catálogo completo
                  </Link>{" "}
                  o{" "}
                  <Link href="/calculadoras" className="font-medium text-primary underline-offset-4 hover:underline">
                    calculadoras
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sponsorships secundarias */}
      {sponsorships.length > 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {sponsorships.slice(1).map((s) => (
            <SponsoredBanner key={s.id} sponsorship={s} />
          ))}
        </div>
      ) : null}

      {esHuertoVacio ? (
        <Alert className="rounded-2xl border-dashed bg-muted/20">
          <Compass aria-hidden />
          <AlertTitle>¿No sabes por dónde partir?</AlertTitle>
          <AlertDescription>
            Mira las{" "}
            <Link href="/recomendadas" className="font-medium text-primary underline-offset-4 hover:underline">
              especies recomendadas
            </Link>{" "}
            o explora el{" "}
            <Link href="/explorar" className="font-medium text-primary underline-offset-4 hover:underline">
              catálogo completo
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
