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
  Wand2,
} from "lucide-react";

import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { SponsoredBanner } from "@/components/ads/SponsoredBanner";
import { AgregarCultivo } from "@/components/huerto/AgregarCultivo";
import { AgregarArbol } from "@/components/huerto/AgregarArbol";
import { AlertasClimaticas } from "@/components/huerto/AlertasClimaticas";
import { ListaCultivos } from "@/components/huerto/ListaCultivos";
import { WorkbenchModular } from "@/components/huerto/WorkbenchModular";
import { PlanoHuerto } from "@/components/huerto/PlanoHuerto";
import { ModoToggle } from "./ModoToggle";
import { AgregarEspecieTarjetas } from "@/components/huerto/AgregarEspecieTarjetas";
import { TerrenoSection } from "@/components/mapa/TerrenoSection";
import { SelectorHuerto } from "./SelectorHuerto";
import { AsistenteHuerto } from "@/components/huerto/AsistenteHuerto";
import { AsistenteFlotante } from "@/components/huerto/AsistenteFlotante";
import { pasosAsistente } from "@/components/huerto/pasosAsistente";
import { marcarAsistenteCompletado } from "@/lib/huerto/actions";
import { modoEfectivo, type ModoHuerto } from "@/lib/huerto/modo";
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
import {
  ESPECIES,
  MESES,
  getEspeciePorDbKey,
  getEspeciesPorZona,
  getZonaIdDeComuna,
} from "@/lib/agronomy";
import { climateAlertsProvider } from "@/lib/climate";
import { getArboles, getCultivos, getHuertos, getPerfil, getTareasDelDia } from "@/lib/huerto/data";
import {
  formatAreaM2,
  formatCoordenadas,
} from "@/lib/huerto/terreno";
import { limitesDe, type PlanAcceso } from "@/lib/payments/plans";
import { getZonaDeComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";
import type { Arbol, Cultivo, HuertoResumen, Tarea } from "@/types";
import type { CultivoLite } from "@/lib/huerto/nombres";

function hoyISO(): string {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mes}-${dia}`;
}

export default async function HuertoPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const huertoParam = typeof sp["huerto"] === "string" ? sp["huerto"] : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [cultivos, tareas, perfil, arboles, huertos, sponsorships] = await Promise.all([
    getCultivos(user.id),
    getTareasDelDia(user.id, hoyISO()),
    getPerfil(user.id),
    getArboles(user.id),
    getHuertos(user.id),
    getActiveSponsorships("huerto", user.id),
  ]);

  const zona = getZonaDeComuna(perfil?.comuna);
  const mesActual = new Date().getMonth();
  const alertas = zona ? climateAlertsProvider.getAlertas(zona, mesActual + 1) : [];

  const cultivosConNombre = prepararCultivos(cultivos);
  const especiesDisponibles = ESPECIES.filter((e) => !cultivos.some((c) => c.especie === e.dbKey));
  const zonaId = getZonaIdDeComuna(perfil?.comuna) ?? 7;
  const recom = getEspeciesPorZona(zonaId);
  const limites = limitesDe((perfil?.plan as PlanAcceso) ?? "gratuito");
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

  const huertoActivoId =
    huertoParam && huertos.some((h) => h.id === huertoParam) ? huertoParam : null;
  const arbolesFiltrados = huertoActivoId
    ? arboles.filter((a) => a.huertoId === huertoActivoId)
    : arboles;
  const sinUbicarFiltrados = arbolesFiltrados.filter((a) => a.posX === null || a.posY === null);

  const modo: ModoHuerto = modoEfectivo({
    huertoModo: perfil?.huertoModo ?? null,
    tieneHuertos: huertos.length > 0,
    tieneCultivosOArboles: cultivos.length > 0 || arboles.length > 0,
  }) ?? "modular";
  const asistentePendiente = !perfil?.asistenteCompletadoAt;
  const huertoVacio = cultivos.length === 0 && arboles.length === 0 && huertos.length === 0;
  const mostrarAsistente = asistentePendiente && huertoVacio && modo === "guiado";

  if (modo === "guiado") {
    return <VistaGuiada v={{ mostrarAsistente, asistentePendiente, huertoVacio, cultivos, cultivosConNombre, arboles: arbolesFiltrados, huertos, tareas, alertas, zonaNombre: zona?.nombre ?? null, mesActual, especiesDisponibles, limites, recom, zonaId, userId: user.id, huertoActivoId }} />;
  }

  const sinUbicarTotal = sinUbicarFiltrados.length;

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

          <div className="flex flex-col items-end gap-2">
            <SelectorHuerto
              huertos={huertos.map((h) => ({ id: h.id, nombre: h.nombre, superficieM2: h.superficieM2 }))}
              activoId={huertoActivoId}
              className="hidden lg:inline-flex"
            />
            <div className="flex items-center gap-2">
              <ModoToggle modo="modular" />
            </div>
            <SelectorHuerto
              huertos={huertos.map((h) => ({ id: h.id, nombre: h.nombre, superficieM2: h.superficieM2 }))}
              activoId={huertoActivoId}
              className="flex sm:hidden w-full max-w-xs"
            />
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
                {new Set([...cultivos.map((c) => c.especie), ...arboles.map((a) => a.especie)]).size}
                <span className="text-sm font-normal text-muted-foreground">
                  especies · {arboles.length} árboles
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trees className="size-3" /> {arboles.filter((a) => a.huertoId).length} en plano de{" "}
                {arboles.length}
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
              {/* Banco modular (B1): panel único + lienzo grande */}
              <WorkbenchModular
                huertos={huertos}
                arboles={arboles}
                slots={{
                  registrarArbol: (
                    <AgregarArbol especies={ESPECIES} uso={{ actual: arboles.length, limite: limites.arboles }} />
                  ),
                  cultivos: esHuertoVacio ? (
                    <Card className="rounded-2xl border-dashed shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Sprout className="size-4 text-primary" /> Tu huerto está vacío
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Elige una especie aquí, o dibuja tu terreno en el lienzo de al lado (satélite).
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { step: "1", title: "Elige especie", icon: Leaf },
                            { step: "2", title: "Agrega al huerto", icon: Plus },
                            { step: "3", title: "Sigue tareas", icon: CalendarDays },
                          ].map((s) => (
                            <div key={s.step} className="flex items-center gap-2 rounded-xl border bg-card p-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                {s.step}
                              </span>
                              <s.icon className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium leading-none">{s.title}</span>
                            </div>
                          ))}
                        </div>
                        <AgregarCultivo especies={especiesDisponibles} uso={{ actual: cultivos.length, limite: limites.cultivos }} />
                        <p className="text-xs text-muted-foreground">
                          ¿Dudas?{" "}
                          <Link href="/recomendadas" className="font-medium text-primary underline-offset-4 hover:underline">
                            Mira qué es recomendable en tu zona
                          </Link>
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                              <Plus className="size-4" />
                            </span>
                            <div className="flex flex-col">
                              <CardTitle className="text-sm">Agregar cultivo</CardTitle>
                              <CardDescription className="text-xs">Elige una especie y listo.</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <AgregarCultivo especies={especiesDisponibles} uso={{ actual: cultivos.length, limite: limites.cultivos }} />
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Leaf className="size-4 text-primary" /> Tus cultivos
                          </CardTitle>
                          <CardDescription className="text-xs">{cultivosConNombre.length} especies activas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ListaCultivos cultivos={cultivosConNombre} />
                        </CardContent>
                      </Card>
                    </div>
                  ),
                  satelite: (
                    <div className="flex flex-col gap-3">
                      <TerrenoSection />
                      {huertos.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {huertos.map((h) => (
                            <li
                              key={h.id}
                              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-2"
                            >
                              <span className="grid gap-0.5">
                                <span className="text-sm font-medium">{h.nombre}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {h.centro ? formatCoordenadas(h.centro) : "—"}
                                </span>
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatAreaM2(h.superficieM2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ),
                  matriz: <PlanoHuerto huertos={huertos} arboles={arboles} especies={ESPECIES} modoForzado="2d" />,
                  tresD: <PlanoHuerto huertos={huertos} arboles={arboles} especies={ESPECIES} modoForzado="3d" />,
                }}
              />
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

/* ---------- Modo guiado (Propuesta E): asistente único + «¿qué sigue?» ---------- */

interface VistaGuiadaProps {
  v: {
    huertoActivoId: string | null;
    huertoVacio: boolean;
    mostrarAsistente: boolean;
    asistentePendiente: boolean;
    cultivos: Cultivo[];
    cultivosConNombre: CultivoLite[];
    arboles: Arbol[];
    huertos: HuertoResumen[];
    tareas: Tarea[];
    alertas: Awaited<ReturnType<typeof climateAlertsProvider.getAlertas>>;
    zonaNombre: string | null;
    mesActual: number;
    especiesDisponibles: typeof ESPECIES;
    limites: ReturnType<typeof limitesDe>;
    // datos de recomendadas para enlaces en el asistente
    recom: ReturnType<typeof getEspeciesPorZona>;
    zonaId: number;
    userId: string;
  };
}

function VistaGuiada({ v }: VistaGuiadaProps) {
  const sinUbicar = v.arboles.filter((a) => a.posX === null || a.posY === null);
  const cultivosConNombre = v.cultivosConNombre;
  const dias = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const pasos = pasosAsistente({
    huertos: v.huertos,
    arboles: v.arboles,
    sinUbicar,
    terrenoSlot: <TerrenoSection />,
    altaSlot: (
      <AgregarEspecieTarjetas
        especies={v.especiesDisponibles}
        uso={{ actual: v.cultivos.length, limite: v.limites.cultivos ?? "ilimitado" }}
      />
    ),
    planoSlot: <PlanoHuerto huertos={v.huertos} arboles={v.arboles} especies={ESPECIES} />,
  });

  const pasoInicial =
    v.huertos.length === 0 ? 0 : v.cultivos.length === 0 ? 1 : sinUbicar.length > 0 ? 2 : 3;

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera con toggle */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-2.5 py-1">
            <Compass className="size-3" /> Modo guiado
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
            {v.mostrarAsistente ? "Armamos tu huerto, paso a paso" : "¿Qué sigue hoy?"}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {v.zonaNombre ? `${v.zonaNombre} · ${MESES[v.mesActual]}` : "Configura tu comuna en el perfil"} ·{" "}
              <span className="capitalize">{dias}</span>
            </span>
            {v.alertas[0] ? (
              <Badge variant="secondary" className="rounded-full px-2.5 py-1 font-normal">
                {MESES[v.mesActual].slice(0, 3)}: {v.alertas[0].titulo}
              </Badge>
            ) : null}
          </p>
        </div>
        <ModoToggle modo="guiado" />
      </div>

      {/* Selector global (R5) — sobre las dos vistas */}
      <SelectorHuerto
        huertos={v.huertos.map((h) => ({ id: h.id, nombre: h.nombre, superficieM2: h.superficieM2 }))}
        activoId={v.huertoActivoId}
        className="w-full sm:w-fit"
      />

      <Separator />

      {v.mostrarAsistente ? (
        <AsistenteHuerto pasos={pasos} pasoInicial={pasoInicial} alCompletar={marcarAsistenteCompletado} />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Pendiente: árboles sin posicionar */}
          {sinUbicar.length > 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    Te quedan {sinUbicar.length} ejemplares por posicionar en el plano
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Reparto guiado en matriz (1 toque) o ajuste a mano. Quedan listados si los dejas para después.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-full" render={<Link href="/huerto?plano=1" />}>
                    Posicionar {sinUbicar.length} pendientes
                  </Button>
                  <ModoToggle modo="guiado" />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Tareas de hoy */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 text-sky-600" /> Esta semana en tu zona
              </CardTitle>
              <CardDescription className="text-xs">
                {v.tareas.length} tarea{v.tareas.length === 1 ? "" : "s"} para hoy · marca cada una como hecha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TareasDelDia tareas={v.tareas} />
            </CardContent>
          </Card>

          {/* Resumen por especie → ficha de especie */}
          {cultivosConNombre.length > 0 ? (
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tu huerto · resumen</CardTitle>
                <CardDescription className="text-xs">
                  {new Set([...cultivosConNombre.map((c) => c.especie), ...v.arboles.map((a) => a.especie)]).size}{" "}
                  especies · {v.arboles.length} árboles
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(() => {
                  const nombres = new Map<string, string>();
                  for (const c of cultivosConNombre)
                    nombres.set(c.especie, c.nombre ?? c.especie);
                  for (const a of v.arboles)
                    if (!nombres.has(a.especie))
                      nombres.set(a.especie, getEspeciePorDbKey(a.especie)?.nombre ?? a.especie);
                  return [...nombres.entries()].map(([especie, nombre]) => {
                    const afectados = v.arboles.filter((a) => a.especie === especie)
                      .reduce((sum, a) => sum + (a.cantidad ?? 1), 0);
                    return (
                      <Link
                        key={especie}
                        href={`/especie/especies/${especie}`}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-medium">¿Cómo va tu {nombre.toLowerCase()}?</span>
                          <span className="text-xs text-muted-foreground">
                            {afectados} {afectados === 1 ? "ejemplar" : "ejemplares"} en tu huerto
                          </span>
                        </span>
                        <Badge variant="outline" className="rounded-full">Ver ficha →</Badge>
                      </Link>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="size-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Todo al día: sin pendientes de posicionamiento ni tareas para hoy.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Asistente a mano en el guiado: vacío ("retómalo") o repetirlo */}
          {v.huertoVacio ? (
            <Card className="rounded-2xl bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wand2 className="size-4 text-primary" />
                  Tu huerto quedó sin contenido: retoma el asistente paso a paso o cambia al banco modular.
                </p>
                <AsistenteFlotante
                  pasos={pasos}
                  pasoInicial={0}
                  marcarCompletado={v.asistentePendiente}
                  onCompletar={marcarAsistenteCompletado}
                  skipCompletado={!v.asistentePendiente}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl bg-muted/30">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wand2 className="size-4" />
                  ¿Repites el asistente (por ejemplo para agregar otro huerto)? Vuelve al modo guiado: ahí lo reabres cuando ya lo completaste una vez.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
