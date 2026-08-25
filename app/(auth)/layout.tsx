import Link from "next/link";
import { Leaf, Sprout, Droplets, Scissors, MapPinned, CalendarDays, ShieldCheck, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left — editorial */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-muted/30 p-8 lg:flex lg:p-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.04]" />

        <Link href="/" className="inline-flex items-center gap-2.5 self-start">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-4" aria-hidden />
          </span>
          <span className="font-heading text-[15px] font-semibold tracking-tight">GardenFood</span>
          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
            v2
          </Badge>
        </Link>

        <div className="mt-12 flex max-w-[520px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit gap-1.5 rounded-full bg-card">
              <Leaf className="size-3" /> Agronomía doméstica · Chile
            </Badge>
            <h1 className="font-heading text-4xl font-semibold leading-[0.95] tracking-tight">
              Tu huerto,
              <br />
              <span className="text-primary">con rigor chileno.</span>
            </h1>
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
              De Arica a Punta Arenas, 245 comunas en 20 zonas agroclimáticas. Calendario fenológico, riego por comuna y fertilización a la medida.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { icon: Scissors, title: "Poda guiada", desc: "Ventana exacta por especie y zona" },
              { icon: Droplets, title: "Riego a la medida", desc: "Dosis por suelo y lluvia local" },
              { icon: MapPinned, title: "Tu comuna importa", desc: "No es consejo genérico del hemisferio norte" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-4" aria-hidden />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none">{item.title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Card className="rounded-2xl border-foreground/10 bg-card shadow-sm">
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-2">
                <Quote className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-sm leading-relaxed text-foreground">
                  “Por fin sé cuándo podar mi durazno en La Serena. Antes lo hacía a ojo y perdía la mitad de la fruta.”
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium">MR</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-none">María R.</span>
                  <span className="text-xs text-muted-foreground">La Serena · Zona 3</span>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" /> Huerto desde 2024
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3 pt-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Datos validados con fichas agronómicas chilenas · Gratis y sin tarjeta</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 GardenFood — huertos informados</span>
            <span className="font-mono">16 regiones · 245 comunas</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex h-12 items-center justify-between border-b px-4 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="size-4" />
            </span>
            <span className="font-heading text-sm font-semibold">GardenFood</span>
          </Link>
          <Badge variant="secondary" className="rounded-full">Gratis</Badge>
        </div>

        <div className="flex flex-1 items-center justify-center p-4 py-10 sm:p-6 lg:p-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <div className="hidden border-t px-6 py-4 text-center text-xs text-muted-foreground lg:block">
          Al continuar aceptas nuestros términos y la política de privacidad · Tus datos de comuna solo se usan para personalizar el calendario
        </div>
      </div>
    </div>
  );
}
