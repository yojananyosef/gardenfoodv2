import Link from "next/link";
import { ArrowRight, Droplets, Scissors, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ZoneWidget } from "@/components/landing/zone-widget";
import { ESPECIES, FICHAS } from "@/lib/agronomy";

const ESPECIES_LANDING = [
  "duraznero",
  "palto",
  "manzano",
  "frutilla",
  "vid",
  "limonero",
  "frambuesa",
  "cerezo",
].map((slug) => {
  const especie = ESPECIES.find((e) => e.slug === slug)!;
  return {
    nombre: especie.nombre,
    latino: FICHAS[especie.dbKey]?.nc ?? "",
    slug: especie.slug,
  };
});

const ACCIONES = [
  {
    icon: Scissors,
    titulo: "Podar",
    descripcion:
      "Sabe exactamente cuándo podar cada especie según su etapa fenológica y tu zona agroclimática.",
  },
  {
    icon: Droplets,
    titulo: "Regar",
    descripcion:
      "Riego adaptado a tu comuna: ni una gota de más en la costa húmeda, ni una de menos en el norte seco.",
  },
  {
    icon: Sprout,
    titulo: "Fertilizar",
    descripcion:
      "Qué fertilizante y en qué dosis necesita tu tierra, calculado para tu clima y tu suelo.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-heading text-sm font-semibold tracking-wide">
            GardenFood
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explorar" className="text-muted-foreground hover:text-foreground">
              Explorar
            </Link>
            <Button size="sm" variant="outline" render={<Link href="/registro" />}>
              Registrarme
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
            <div className="flex flex-col gap-6">
              <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
                Agronomía doméstica para Chile
              </p>
              <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Tu huerto frutal, al ritmo de tu{" "}
                <span className="text-primary">zona agroclimática</span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                GardenFood te dice cuándo podar, regar y fertilizar, comuna por comuna. De
                Arica a Punta Arenas, 208 comunas en 20 zonas agroclimáticas, con 30
                especies de fruta.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" render={<Link href="/registro" />}>
                  Crear mi huerto
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/explorar" />}>
                  Explorar especies
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                ¿Qué hago esta semana?
              </p>
              <ZoneWidget />
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
            <h2 className="font-heading max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Tres decisiones. En el momento exacto.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {ACCIONES.map((accion) => (
                <div key={accion.titulo} className="flex flex-col gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <accion.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{accion.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {accion.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                El catálogo de campo
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Treinta especies frutales, cada una con su ficha de poda, riego y
                fertilización adaptada a tu zona.
              </p>
            </div>
            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {ESPECIES_LANDING.map((especie) => (
                <li key={especie.slug} className="bg-card">
                  <Link
                    href={`/especies/${especie.slug}`}
                    className="flex h-full flex-col justify-between gap-6 p-5 transition-colors hover:bg-muted"
                  >
                    <span className="font-heading text-lg font-semibold">
                      {especie.nombre}
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      {especie.latino}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-16 sm:py-20">
            <h2 className="font-heading max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Tu tierra sabe lo que necesita. Nosotros te ayudamos a entenderla.
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/registro" />}>
                  Crear mi huerto gratis
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/explorar" />}>
                  Ver el catálogo
                </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-heading font-semibold text-foreground">GardenFood</span>{" "}
            — huertos frutales informados, de Arica a Punta Arenas.
          </p>
          <nav className="flex items-center gap-4">
            <Link href="/explorar" className="hover:text-foreground">
              Explorar
            </Link>
            <Link href="/registro" className="hover:text-foreground">
              Registro
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}