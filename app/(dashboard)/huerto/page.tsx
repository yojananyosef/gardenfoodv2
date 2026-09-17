import Link from "next/link";
import {
  Sprout,
  CalendarDays,
  AlertTriangle,
  MapPinned,
  ArrowRight,
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
import { AlertasClimaticas } from "@/components/huerto/AlertasClimaticas";
import { WorkbenchModular } from "@/components/huerto/WorkbenchModular";
import { PlanoHuerto } from "@/components/huerto/PlanoHuerto";
import { TerrenoSection } from "@/components/mapa/TerrenoSection";
import { AsistenteFlotante } from "@/components/huerto/AsistenteFlotante";
import { pasosAsistente } from "@/components/huerto/pasosAsistente";
import { marcarAsistenteCompletado } from "@/lib/huerto/actions";
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
import { getArboles, getHuertos, getPerfil, getTareasDelDia } from "@/lib/huerto/data";
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

  const [tareas, perfil, arboles, huertos, sponsorships] = await Promise.all([
    getTareasDelDia(user.id, hoyISO()),
    getPerfil(user.id),
    getArboles(user.id),
    getHuertos(user.id),
    getActiveSponsorships("huerto", user.id),
  ]);

  const zona = getZonaDeComuna(perfil?.comuna);
  const mesActual = new Date().getMonth();
  const alertas = zona ? climateAlertsProvider.getAlertas(zona, mesActual + 1) : [];

  const zonaId = getZonaIdDeComuna(perfil?.comuna) ?? 7;
  const recom = getEspeciesPorZona(zonaId);
  // Segunda línea del card Cultivos: aporta valor sin repetir el conteo
  // del título (N especies · M árboles) ni el «en plano» ya eliminado.
  const superficieTotal = huertos.reduce((acc, h) => acc + (h.superficieM2 ?? 0), 0);
  const especieTop = (() => {
    if (arboles.length === 0) return null;
    const conteo = new Map<string, number>();
    for (const a of arboles) conteo.set(a.especie, (conteo.get(a.especie) ?? 0) + 1);
    let top: { especie: string; total: number } | null = null;
    for (const [especie, total] of conteo) {
      if (!top || total > top.total) top = { especie, total };
    }
    if (!top) return null;
    return {
      nombre: getEspeciePorDbKey(top.especie)?.nombre ?? top.especie,
      total: top.total,
    };
  })();
  // Vista única: el mapa es lo principal; el vacío se mide por árboles + huertos.
  const esHuertoVacio = arboles.length === 0 && huertos.length === 0;
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

  // Vista única modular: el asistente vive como modal «Abrir asistente»
  // (guía opcional sin cambiar de vista). Retoma donde quedó pendiente.
  const asistentePendiente = !perfil?.asistenteCompletadoAt;
  const sinUbicar = arboles.filter((a) => a.posX === null || a.posY === null);
  const pasos = pasosAsistente({
    huertos,
    arboles,
    sinUbicar,
    // Se monta solo al abrir el asistente (Dialog) y reutiliza los datos del
    // server para no refetchear huertos+árboles ni recargar tiles de más.
    terrenoSlot: <TerrenoSection alto={300} huertosIniciales={huertos} arbolesIniciales={arboles} />,
    altaSlot: (
      <div className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4">
        <p className="text-sm font-medium">Planta tocando tu terreno</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Cierra este asistente y en el tab Terreno (satélite) pulsa «Agregar árboles»:
          cada toque sobre tu terreno planta un árbol ya ubicado, sin formularios ni pasos extra.
        </p>
      </div>
    ),
    planoSlot: <PlanoHuerto huertos={huertos} arboles={arboles} especies={ESPECIES} />,
  });
  const pasoInicial =
    huertos.length === 0 ? 0 : arboles.length === 0 ? 1 : sinUbicar.length > 0 ? 2 : 3;

  return (
    <div className="flex flex-col gap-5">
      {/* Header + stats — zona se lee una sola vez arriba */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {zona ? (
              <Badge
                variant="outline"
                className="w-fit gap-1.5 rounded-full bg-card"
                title={perfil?.comuna ?? undefined}
              >
                <MapPinned className="size-3" />
                {zona.nombre}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit rounded-full">Configura tu comuna</Badge>
            )}
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-[1.9rem]">
              {nombreCorto ? `Hola, ${nombreCorto} —` : "Mi huerto"}
              <span className="text-muted-foreground"> {esHuertoVacio ? "empieza aquí" : "al día"}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {zona
                ? "Calendario fenológico y alertas de tu zona."
                : "Actualiza tu comuna en tu perfil para recomendaciones a la medida."}
            </p>
          </div>
        </div>

        {/* Bento stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <Sprout className="size-3.5" /> Cultivos
                </CardDescription>
                <Badge variant={arboles.length > 0 ? "default" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                  {arboles.length > 0 ? "activo" : "vacío"}
                </Badge>
              </div>
              <CardTitle className="font-heading flex items-baseline gap-2 text-3xl">
                {new Set(arboles.map((a) => a.especie)).size}
                <span className="text-sm font-normal text-muted-foreground">
                  especies · {arboles.length} árboles
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPinned className="size-3" />
                  {huertos.length === 0
                    ? "sin terreno dibujado"
                    : `${huertos.length} ${huertos.length === 1 ? "huerto" : "huertos"} · ${Math.round(superficieTotal)} m²`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Sprout className="size-3" />
                  {especieTop ? `${especieTop.nombre} ×${especieTop.total} lidera` : "agrega tu primer cultivo"}
                </span>
              </div>
            </CardContent>
            <div className="mt-auto h-1 w-full bg-primary" aria-hidden />
          </Card>

          {/* Hoy: tareas + clima en un solo card, sin repetir zona */}
          <Card className="overflow-hidden rounded-2xl sm:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <CheckCircle2 className="size-3.5" /> Hoy
                </CardDescription>
                <Badge variant={tareas.length > 0 ? "secondary" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                  {tareas.length} pendientes
                  {alertas.length > 0 ? ` · ${alertas.length} alerta${alertas.length > 1 ? "s" : ""}` : ""}
                </Badge>
              </div>
              <CardTitle className="font-heading flex flex-wrap items-baseline gap-x-4 gap-y-1 text-3xl">
                <span className="flex items-baseline gap-2">
                  {tareas.length}
                  <span className="text-sm font-normal text-muted-foreground">tareas</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                  {alertas.length > 0 ? <AlertTriangle className="size-3.5" /> : <Sun className="size-3.5" />}
                  {alertas.length === 0 ? "sin avisos" : `${alertas.length} aviso${alertas.length > 1 ? "s" : ""}`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 capitalize">
                  <CalendarDays className="size-3" /> {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <span className="flex items-center gap-1.5">
                  {alertas.length > 0 ? <ThermometerSun className="size-3" /> : <Sun className="size-3" />}
                  {alertas.length === 0 ? "sin heladas ni sequía crítica" : "revisa el tab Clima"}
                </span>
              </div>
            </CardContent>
            <div className="mt-auto h-1 w-full bg-chart-3" aria-hidden />
          </Card>
        </div>
      </div>

      {/* Recomendadas — hero bento (outside tabs, always visible but compact) */}
      <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge className="gap-1 rounded-full">
                  <Sparkles className="size-3" /> Recomendadas para tu zona
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">
                {perfil?.comuna ? `Qué plantar en ${perfil.comuna}` : "Configura tu comuna"}
              </CardTitle>
              <CardDescription className="max-w-prose text-[13px] leading-relaxed">
                {zona
                  ? `${recom.si.length} recomendadas · ${recom.riesgo.length} con riesgo · ${recom.no.length} no recomendadas.`
                  : "Configura tu comuna para ver qué puedes cultivar con éxito."}
              </CardDescription>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1.5 shadow-sm sm:flex">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-xs font-medium">{recom.si.length} óptimas</span>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <span className="size-2 rounded-full bg-cosecha" />
              <span className="text-xs font-medium">{recom.riesgo.length} riesgo</span>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <span className="size-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-medium">{recom.no.length} evitar</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="rounded-lg" render={<Link href="/recomendadas" />}>
            <Compass data-icon="inline-start" />
            Ver recomendadas
            <ArrowRight data-icon="inline-end" />
          </Button>
          <p className="text-xs text-muted-foreground">Filtrado por tu comuna · Datos de viabilidad real.</p>
        </CardContent>
      </Card>

      {/* TABS (el asistente vive junto a las tabs del lienzo, su contexto) */}
      <Tabs defaultValue="huerto" className="w-full gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="huerto" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <LayoutGrid className="size-4" />
              Mi huerto
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                {arboles.length}
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
        </div>

        {/* Lienzo a ancho completo (el mapa es lo principal) */}
        <TabsContent value="huerto" className="mt-2 flex flex-col gap-4">
              <WorkbenchModular
                huertos={huertos}
                arboles={arboles}
                asistente={
                  <AsistenteFlotante
                    pasos={pasos}
                    pasoInicial={pasoInicial}
                    marcarCompletado={asistentePendiente}
                    onCompletar={marcarAsistenteCompletado}
                    skipCompletado={!asistentePendiente}
                  />
                }
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
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-chart-3/15 text-chart-3">
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
                    <span className="hidden size-9 items-center justify-center rounded-xl bg-cosecha/10 text-cosecha-ink sm:inline-flex">
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
