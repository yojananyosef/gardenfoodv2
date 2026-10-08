import Link from "next/link";
import {
  Sprout,
  CalendarDays,
  AlertTriangle,
  MapPinned,
  ArrowRight,
  CheckCircle2,
  Sun,
  Sparkles,
  Compass,
  ListTodo,
  Thermometer,
} from "lucide-react";

import { NativeAdSlot } from "@/components/ads/NativeAdSlot";
import { SponsoredBanner } from "@/components/ads/SponsoredBanner";
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
import { TareasDonut } from "@/components/huerto/HuertoCharts";
import { getActiveSponsorships } from "@/lib/ads/sponsorships";
import {
  ESPECIES,
  getEspeciesPorZona,
  getZonaIdDeComuna,
} from "@/lib/agronomy";
import { getArboles, getHuertos, getPerfil, getTareasDelDia } from "@/lib/huerto/data";
import { getZonaDeComuna } from "@/lib/agronomy";
import { createClient } from "@/lib/supabase/server";
import { TiraPronostico } from "@/components/huerto/TiraPronostico";
import { AlertasClimaticas } from "@/components/huerto/AlertasClimaticas";
import { AhoraClima } from "@/components/huerto/AhoraClima";
import { GraficoTemperatura } from "@/components/huerto/GraficoTemperatura";
import { BloqueRiego } from "@/components/huerto/BloqueRiego";
import { fechaLargaChile, hoyLocal, resumenAlertas } from "@/lib/climate/alertas";
import { riegoDeSemana } from "@/lib/climate/riego";
import { ATRIBUCION, climaDePerfil } from "@/lib/climate/open-meteo";

/**
 * Fecha de hoy para consultar las tareas del día.
 *
 * Delega en `hoyLocal()`, que usa `Intl` con `timeZone: America/Santiago`. La
 * versión anterior armaba la fecha con `getMonth()`/`getDate()`, que dan la
 * hora del proceso: en local (TZ = America/Santiago) funcionaba, y en Vercel
 * (UTC) devolvía el día siguiente desde las 21:00 hora chilena. Con eso, las
 * tareas del "hoy" eran las de mañana.
 */
function hoyISO(): string {
  return hoyLocal();
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
  // Pronóstico real por la comuna del perfil, con el perfil de zona como
  // respaldo. `climaDePerfil` ya resuelve la cadena entera, así que esta
  // pantalla no necesita saber de respaldos.
  const clima = await climaDePerfil(perfil?.comuna);
  const alertas = clima?.alertas ?? [];

  const zonaId = getZonaIdDeComuna(perfil?.comuna) ?? 7;
  const recom = getEspeciesPorZona(zonaId);
  // Segunda línea del card Cultivos: aporta valor sin repetir el conteo
  // del título (N especies · M árboles) ni el «en plano» ya eliminado.
  const superficieTotal = huertos.reduce((acc, h) => acc + (h.superficieM2 ?? 0), 0);
  // Vista única: el mapa es lo principal; el vacío se mide por árboles + huertos.
  const esHuertoVacio = arboles.length === 0 && huertos.length === 0;
  const nombre = (user.user_metadata as Record<string, unknown>)?.["nombre"] as string | undefined;
  const nombreCorto = nombre ? nombre.split(" ")[0] : null;

  const tareasChartData = [
    { name: "Pendiente", value: tareas.filter((t) => t.estado === "pendiente").length, fill: "var(--muted-foreground)" },
    { name: "En proceso", value: tareas.filter((t) => t.estado === "en_proceso").length, fill: "var(--chart-2)" },
    { name: "Completada", value: tareas.filter((t) => t.estado === "completada").length, fill: "var(--primary)" },
  ].filter((d) => d.value > 0);
  /* El número del badge, en palabras. Antes era el total pelado —un «5» al
     lado de un gráfico que decía lo mismo— y no contaba días distintos, así
     que una helada y lluvia el mismo día contaban dos. */
  const resumenAvisos = resumenAlertas(alertas);

  /* Déficit hídrico por día. Sale del ET₀ de la misma respuesta del pronóstico,
     sin llamada extra. Vacío si no hay pronóstico. */
  const diasRiego = clima?.pronostico?.dias?.length
    ? riegoDeSemana(clima.pronostico.dias)
    : [];

  /* Tareas que todavía exigen una acción. Se cuenta solo lo pendiente y lo que
     está en proceso: una tarea completada no es «algo que mostrar», y mandarle
     al usuario a una tab con cinco tareas ya hechas lo haría pensar que tiene
     trabajo pendiente. */
  const tareasPendientes = tareas.filter(
    (t) => t.estado === "pendiente" || t.estado === "en_proceso",
  ).length;

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
      {/* Header + stats — zona se lee una sola vez arriba. Va después del lienzo
          porque el saludo no compite con el mapa: es contexto, no la acción. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {zona ? (
              <Badge
                variant="outline"
                className="w-fit gap-1.5 rounded-full bg-card"
                title={perfil?.comuna ? `${perfil.comuna} · editar comuna` : undefined}
                render={<Link href="/perfil" />}
              >
                <MapPinned className="size-3" />
                {zona.nombre}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit rounded-full" render={<Link href="/perfil" />}>
                Configura tu comuna
              </Badge>
            )}
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-[1.9rem]">
              {nombreCorto ? `Hola, ${nombreCorto} —` : "Mi huerto"}
              <span className="text-muted-foreground"> {esHuertoVacio ? "empieza aquí" : "al día"}</span>
            </h1>
            {/* El subtítulo desapareció cuando hay zona. «Calendario fenológico y
                alertas de tu zona» no le decía nada nuevo al usuario que ya
                ve el chip con su zona arriba y tiene el mapa en pantalla, y
                empujaba el mapa hacia abajo. El caso sin zona sí se mantiene,
                porque ahí es una instrucción accionable, no decoración. */}
            {!zona ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Actualiza tu comuna en tu perfil para recomendaciones a la medida.
              </p>
            ) : null}
          </div>
        </div>

        {/* UN solo bento, con las tres cifras que importan.
            Eran tres cards: Cultivos, Hoy y (antes) una de tareas. Entotal
            mostraban cinco números antes de llegar al mapa, y dos de ellos
            decían lo mismo —«5 especies · 26 árboles» en Cultivos y «27 en el
            mapa» en el lienzo—, así que la pantalla arrancaba con un conteo
            repetido en vez de con algo accionable.

            Los tres datos que quedan son los que cambian una decisión hoy:
            cuántas tareas te tocan, si hay avisos de clima, y cuántos árboles
            tienes. Cultivos es además el enlace al índice de especies, que es
            el camino corto a los árboles (antes había que buscarlos dentro del
            mapa). El `render` del Card hace que toda la superficie sea el
            target, sin anidar un botón dentro de otro. */}
        <Card
          className="group cursor-pointer overflow-hidden rounded-2xl transition-colors hover:border-primary/40 focus-visible:border-ring"
          render={<Link href="/especie/especies" />}
          aria-label={`${tareas.length} tareas hoy, ${alertas.length} ${alertas.length === 1 ? "aviso" : "avisos"}, ${arboles.length} árboles. Ver todas las especies`}
        >
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-semibold tabular-nums">{tareas.length}</span>
              <span className="text-sm text-muted-foreground">
                {tareas.length === 1 ? "tarea" : "tareas"} para hoy
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-semibold tabular-nums">{alertas.length}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {alertas.length === 0 ? (
                  <Sun className="size-3.5" />
                ) : (
                  <AlertTriangle className="size-3.5 text-destructive" />
                )}
                {alertas.length === 0 ? "sin avisos de clima" : alertas.length === 1 ? "aviso de clima" : "avisos de clima"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-semibold tabular-nums">{arboles.length}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sprout className="size-3.5" />
                {arboles.length === 1 ? "árbol" : "árboles"}
              </span>
            </div>

            <span className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
              {huertos.length === 0
                ? "sin terreno dibujado"
                : `${huertos.length} ${huertos.length === 1 ? "huerto" : "huertos"} · ${Math.round(superficieTotal).toLocaleString("es-CL")} m²`}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* LIENZO.
          Va después del saludo y del bento, no antes. La primera versión de
          este change lo puso arriba de todo, y el resultado era un mapa sin
          contexto: ni el nombre de la zona, ni un saludo, ni un «tienes 5 tareas
          hoy». El change pedía que el mapa dejara de estar escondido detrás de
          una tab, que era el problema real — no que fuera la primera cosa de la
          pantalla. */}
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

      {/* TABS de información. La tab «Mi huerto» se fue con el mapa: el lienzo
          ya no está detrás de una tab, así que no hay nada que la haga necesaria.

          La tab por defecto es la que TIENE algo que mostrar, no una fija. Con
          cero tareas, «Tareas» abría en un «Día libre en el huerto» y el usuario
          concluía que la app estaba vacía; con tareas pendientes, mandarlo a
          Clima escondería justo lo que hay que hacer, que es lo que el clima
          sugiere. El calendario todavía no está implementado, así que el estado
          vacío de tareas es el caso común y no conviene que sea la puerta de
          entrada. */}
      <Tabs defaultValue={tareasPendientes > 0 ? "tareas" : "clima"} className="w-full gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="clima" className="gap-1.5 rounded-lg">
              <Thermometer className="size-4" />
              Clima
              <Badge variant={alertas.length > 0 ? "destructive" : "outline"} className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                {alertas.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tareas" className="gap-1.5 rounded-lg">
              <ListTodo className="size-4" />
              Tareas
              {/* El badge cuenta lo PENDIENTE, como hace la decisión de la tab
                  por defecto. Contaba `tareas.length`, que incluía las
                  completadas: marcaba «5» con cinco tareas ya hechas y la tab se
                  abría igual, así que el número no significaba nada. */}
              <Badge
                variant={tareasPendientes > 0 ? "default" : "outline"}
                className="ml-1 rounded-full px-1.5 py-0 text-[10px]"
              >
                {tareasPendientes}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Los banners del plan bajaron acá: con el mapa arriba de todo, uno
            entre el mapa y las tabs empujaba el contenido real fuera de la
            pantalla. */}
        {sponsorships.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sponsorships.slice(0, 2).map((s) => (
              <NativeAdSlot key={s.id} sponsorship={s} />
            ))}
          </div>
        ) : null}

        {/* CLIMA — bento */}
        <TabsContent value="clima" className="mt-2">
          <div className="grid gap-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="hidden size-9 items-center justify-center rounded-xl bg-cosecha/10 text-cosecha-ink sm:inline-flex">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base">
                        Próximos 7 días — {clima?.zonaNombre ?? "sin zona"}
                      </CardTitle>
                      {/* El rótulo dice de dónde vienen los números. Antes decía
                          «Datos agroclimáticos», que sugería una datasource en
                          vivo cuando era un literal estático por zona. */}
                      <CardDescription className="text-xs">
                        {clima?.fuente === "pronostico"
                          ? clima.sinComuna
                            ? `Sin comuna en tu perfil: pron\u00f3stico del centro de ${clima.zonaNombre}`
                            : `Pron\u00f3stico para ${perfil?.comuna ?? "tu comuna"}${clima.puntoAproximado ? " (aprox. por zona)" : ""}`
                          : "Sin pron\u00f3stico disponible: promedios de la zona, no pron\u00f3stico"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={alertas.length > 0 ? "destructive" : "outline"} className="rounded-full">
                    {resumenAvisos}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {/* «Ahora» arriba, como en una app de clima. Antes la pantalla
                    empezaba con siete celdas iguales y no había respuesta a
                    «¿qué tiempo hace ahora?». */}
                {clima?.pronostico?.actual ? (
                  <AhoraClima
                    actual={clima.pronostico.actual}
                    hoy={clima.pronostico.dias[0]}
                  />
                ) : null}

                {/* La curva por hora. Solo aparece si el hourly vino; si no, la
                    tira de 7 días sigue dando la semana. */}
                {clima?.pronostico?.horas?.length ? (
                  <GraficoTemperatura
                    horas={clima.pronostico.horas}
                    umbral={clima.umbralHelada}
                  />
                ) : null}

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Los próximos 7 días
                  </span>
                  <TiraPronostico dias={clima?.pronostico?.dias ?? []} />
                </div>

                {/* Riego en mm. Es lo que un pronóstico general no dice, y la
                    app ya tiene guías de riego por especie y zona. */}
                {diasRiego.length ? (
                  <BloqueRiego dias={diasRiego} />
                ) : null}

                {alertas.length === 0 ? (
                  <Alert className="rounded-xl border-dashed bg-muted/20">
                    <Sun aria-hidden />
                    <AlertTitle>Nada que alertar en los próximos días</AlertTitle>
                    <AlertDescription>
                      {clima?.fuente === "pronostico"
                        ? "Ningún día del pronóstico llega a los umbrales de helada, lluvia o calor. Buen momento para riego y poda."
                        : "Sin pronóstico y sin alerta estacional para tu zona este mes."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <AlertasClimaticas alertas={alertas} />
                )}

                {/* Atribución obligatoria. Los datos de Open-Meteo son CC BY 4.0 y
                    la licencia exige crédito visible: una pantalla de clima sin
                    esto es un incumplimiento, por bien que funcione. */}
                {clima?.fuente === "pronostico" ? (
                  <p className="border-t pt-2.5 text-[11px] text-muted-foreground/70">
                    Pronóstico y evapotranspiración:{" "}
                    <a
                      href="https://open-meteo.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-muted-foreground"
                    >
                      {ATRIBUCION}
                    </a>
                    {clima.puntoAproximado ? " · punto aproximado por zona" : ""}
                  </p>
                ) : null}
                </CardContent>
            </Card>
          </div>
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
                        {/* Con `timeZone` explícito. Sin él, `toLocaleDateString`
                            usa el TZ del servidor (UTC en Vercel) y desde las
                            21:00 Chilean el título decía «Jueves 8» cuando en
                            Chile todavía era miércoles 7. */}
                        {fechaLargaChile()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={tareasPendientes > 0 ? "default" : "secondary"}
                    className="rounded-full"
                  >
                    {tareasPendientes} {tareasPendientes === 1 ? "pendiente" : "pendientes"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Se decide por lo PENDIENTE, no por el total. Con cinco tareas
                    completadas y ninguna pendiente, la versión anterior pintaba
                    la lista de cinco cosas ya hechas bajo un «5 tareas» que
                    parecía trabajo por hacer. */}
                {tareasPendientes === 0 ? (
                  <Empty className="border-dashed py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Sun className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle className="text-sm">
                        {tareas.length > 0 ? "Todo al día" : "Día libre en el huerto"}
                      </EmptyTitle>
                      <EmptyDescription className="text-xs">
                        {tareas.length > 0
                          ? `Completaste las ${tareas.length} tareas de hoy. Mañana se generan las nuevas.`
                          : "No hay tareas hoy. Ideal para revisar riego o planificar."}
                      </EmptyDescription>
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

      </Tabs>

      {/* Recomendadas — ahora al FINAL de la pantalla.
          Estaban entre el bento de hoy y las tabs, o sea antes de que el
          usuario llegara a su huerto y a sus tareas. Y es la tercera lectura de
          los mismos datos de zona que ya aparecían en el chip del header, en el
          título de Clima y en la propia card. Plantar algo nuevo es una
          decisión de la próxima temporada, no lo primero que se hace un
          miércoles; el huerto que ya existe va primero. */}
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
          {/* «Filtrado por tu comuna · Datos de viabilidad real» iba acá. No lo
              replace nada: el título de la card ya dice «Qué plantar en
              {comuna}» y los tres contadores de arriba, en la misma tarjeta,
              dicen de qué estamos hablando. Era una cuarta forma de decir lo
              mismo. La afirmación sobre la calidad del dato tampoco era del
              usuario: si hay que ser más preciso, el sitio no es este pie. */}
        </CardContent>
      </Card>

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
