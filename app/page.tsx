import Link from "next/link";
import {
  ArrowRight,
  Sprout,
  Droplets,
  Scissors,
  Leaf,
  MapPinned,
  CalendarDays,
  Compass,
  Sparkles,
  Check,
  Sun,
  CloudRain,
  Thermometer,
} from "lucide-react";

import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TopBar } from "@/components/layout/top-bar";
import { ZoneWidget } from "@/components/landing/zone-widget";
import { MapaChile } from "@/components/landing/mapa-chile";

const ACCIONES = [
  {
    icon: Scissors,
    titulo: "Podar",
    descripcion: "Calendario fenológico por especie y zona. Sabrás la semana exacta, no la estación.",
    meta: "Jul — Ago · poda invernal",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    icon: Droplets,
    titulo: "Regar",
    descripcion: "Dosis ajustada a tu comuna: ni gota de más en la costa, ni una menos en el norte seco.",
    meta: "4–10 días · verano",
    color: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    icon: Sprout,
    titulo: "Fertilizar",
    descripcion: "Qué nutriente, en qué dosis y cuándo. Calculado para tu suelo y tu clima.",
    meta: "NPK + micro · primavera",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
];

const STATS = [
  { value: "346", label: "comunas", sub: "De Arica a Punta Arenas" },
  { value: "20", label: "zonas", sub: "Agroclimáticas" },
  { value: "30", label: "especies", sub: "Fichas completas" },
];

export default function Home() {
  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col bg-background">
        <TopBar />

        {/* HERO — thesis: el calendario vivo es el héroe */}
        <main className="flex-1">
          <section className="relative overflow-hidden border-b">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.04]" />

            <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.95fr] lg:items-start lg:gap-8 lg:py-20">
              {/* Left — editorial */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                    <Leaf className="size-3" aria-hidden />
                    Agronomía doméstica · Chile
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                    Calendario vivo 2026
                  </span>
                </div>

                <h1 className="font-heading text-[2.2rem] leading-[0.95] font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem]">
                  Tu huerto frutal,
                  <br />
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    al ritmo de tu
                  </span>
                  <br />
                  zona agroclimática
                </h1>

                <p className="max-w-[52ch] text-[17px] leading-relaxed text-muted-foreground">
                  GardenFood te dice <span className="font-medium text-foreground">cuándo podar, regar y fertilizar</span>, comuna por comuna.
                  Recomendaciones validadas para tu suelo, tu lluvia y tu helada.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button size="lg" className="h-11 rounded-full px-6 text-[15px]" render={<Link href="/registro" />}>
                    Crear mi huerto gratis
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-11 rounded-full px-6" render={<Link href="/explorar" />}>
                    <Compass data-icon="inline-start" />
                    Explorar especies
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 text-primary" aria-hidden />
                  <span>Empieza gratis con 3 cultivos · Sin tarjeta · Desde $9.990/mes si necesitas más</span>
                </div>

                {/* Stats — as harvested strip */}
                <div className="mt-2 flex overflow-hidden rounded-2xl border bg-card shadow-sm">
                  {STATS.map((s, i) => (
                    <div key={s.label} className="flex flex-1 items-center">
                      <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-4 text-center">
                        <span className="font-heading text-2xl font-semibold leading-none tracking-tight sm:text-3xl">
                          {s.value}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
                        <span className="hidden text-[11px] text-muted-foreground/70 sm:block">{s.sub}</span>
                      </div>
                      {i < STATS.length - 1 ? <Separator orientation="vertical" className="h-12 self-center" /> : null}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinned className="size-3.5" /> Cobertura nacional: 16 regiones
                  </span>
                  <span className="size-1 rounded-full bg-border" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" /> Actualizado a {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Right — field notebook signature */}
              <div className="flex flex-col gap-3 lg:sticky lg:top-20">
                <Card className="overflow-hidden rounded-[1.25rem] border-foreground/10 shadow-lg shadow-primary/5">
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400" aria-hidden />
                  <CardHeader className="gap-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <CalendarDays className="size-3.5" aria-hidden />
                          </span>
                          <CardTitle className="text-[15px] font-semibold">¿Qué hago esta semana?</CardTitle>
                        </div>
                        <CardDescription className="text-[13px] leading-relaxed">
                          Calendario vivo — elige tu comuna y ve tus tareas exactas
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="shrink-0 gap-1 rounded-full border-primary/20 bg-primary/10 text-primary">
                        <Sparkles className="size-3" />
                        En vivo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ZoneWidget />
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                      <Sun className="size-3.5 shrink-0" aria-hidden />
                      <span>Basado en fenología y 20 zonas agroclimáticas — no es consejo genérico.</span>
                    </div>
                  </CardContent>
                  {/* perforation */}
                  <div className="flex items-center gap-1.5 border-t border-dashed bg-muted/20 px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Ficha de campo · GardenFood
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">346 comunas</span>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Thermometer, label: "Helada", value: "Alerta" },
                    { icon: CloudRain, label: "Lluvia", value: "Riego" },
                    { icon: Sun, label: "Cosecha", value: "Nov–Mar" },
                  ].map((k) => (
                    <div key={k.label} className="flex flex-col items-center gap-1 rounded-xl border bg-card px-2 py-3 text-center shadow-sm">
                      <k.icon className="size-4 text-muted-foreground" aria-hidden />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
                      <span className="text-xs font-semibold">{k.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3 decisiones */}
          <section className="border-b bg-muted/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">Sistema GardenFood</p>
                  <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Tres decisiones.
                    <br className="hidden sm:block" /> En el momento exacto.
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  No es “riega cada 3 días”. Es poda en la semana 31 para tu ciruelo en La Serena, riego cada 4 días en enero porque tu suelo es arenoso.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {ACCIONES.map((accion) => (
                  <Card key={accion.titulo} className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-md hover:shadow-foreground/5">
                    <CardHeader className="gap-3">
                      <div className={`inline-flex size-10 items-center justify-center rounded-xl ${accion.color}`}>
                        <accion.icon className="size-5" aria-hidden />
                      </div>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl">{accion.titulo}</CardTitle>
                        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{accion.meta}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed text-muted-foreground">{accion.descripcion}</p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Ver cómo lo calculamos <ArrowRight className="size-3" />
                      </div>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Catálogo — seed packets */}
          <section className="border-b">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="w-fit gap-1.5 rounded-full">
                    <MapPinned className="size-3" /> Chile por bandas climáticas
                  </Badge>
                  <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">¿Qué se da fácil en cada zona?</h2>
                  <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Pasa el cursor por el mapa: 2–3 frutales <span className="font-medium text-foreground">Fáciles</span> y viables por banda. Cada ficha trae poda, riego y fertilización adaptada a tu comuna. No buscamos “frutales”, buscamos tu frutal.
                  </p>
                </div>
                <Button variant="outline" className="hidden sm:inline-flex rounded-full" render={<Link href="/explorar" />}>
                  Ver 30 especies <ArrowRight data-icon="inline-end" />
                </Button>
              </div>

              <div className="mt-10 rounded-3xl border bg-muted/20 p-5 sm:p-8">
                <MapaChile />
              </div>

              <div className="mt-6 flex justify-center sm:hidden">
                <Button variant="outline" className="w-full rounded-full" render={<Link href="/explorar" />}>
                  Ver las 30 especies <ArrowRight data-icon="inline-end" />
                </Button>
              </div>

                          </div>
          </section>

          {/* CTA final — greenhouse */}
          <section className="px-4 py-12 sm:py-16">
            <div className="mx-auto w-full max-w-6xl">
              <Card className="overflow-hidden rounded-[1.5rem] border-0 bg-primary text-primary-foreground shadow-xl">
                <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
                  <div className="flex flex-col gap-4">
                    <Badge variant="secondary" className="w-fit bg-white/15 text-white hover:bg-white/20 border-0">
                      Invernadero digital · Gratis
                    </Badge>
                    <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                      Tu tierra sabe lo que necesita.
                      <br />
                      <span className="text-white/80">Nosotros te ayudamos a entenderla.</span>
                    </h2>
                    <p className="max-w-xl text-sm leading-relaxed text-white/70">
                      Crea tu huerto en 2 minutos, elige tus especies y recibe tareas semanales por comuna. De Arica a Punta Arenas, con rigor agronómico y lenguaje humano.
                    </p>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Button size="lg" variant="secondary" className="h-11 rounded-full bg-white text-primary hover:bg-white/90" render={<Link href="/registro" />}>
                        Crear mi huerto gratis
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        render={<Link href="/explorar" />}
                      >
                        Ver el catálogo
                      </Button>
                    </div>
                    <p className="text-xs text-white/60">Sin tarjeta · Cancela cuando quieras · Datos chilenos reales</p>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-5 backdrop-blur">
                    <p className="font-mono text-xs uppercase tracking-widest text-white/60">Lo que recibes</p>
                    <ul className="flex flex-col gap-3">
                      {[
                        "Calendario semanal por especie y zona",
                        "Alertas de helada, sequía y lluvia",
                        "Cálculo de riego y fertilización",
                        "Seguimiento de cosechas y tareas",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-white">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-white text-primary">
                            <Check className="size-3.5" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Separator className="my-1 bg-white/10" />
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>346 comunas · 20 zonas</span>
                      <span className="font-mono">v2 · 2026</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <footer className="border-t bg-muted/20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sprout className="size-4" />
              </span>
              <span>
                <span className="font-heading font-semibold text-foreground">GardenFood</span> — huertos frutales informados, de Arica a Punta Arenas.
              </span>
            </p>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href="/explorar" />}>
                Explorar
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href="/calculadoras" />}>
                Calculadoras
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href="/registro" />}>
                Registro
              </Button>
            </nav>
          </div>
        </footer>
      </div>
    </TelemetryProvider>
  );
}
