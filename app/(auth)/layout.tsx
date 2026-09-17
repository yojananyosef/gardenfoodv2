import Link from "next/link";
import { Leaf, Droplets, Scissors, MapPinned, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/layout/BrandMark";
import { COMUNAS } from "@/lib/agronomy/comunas";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left — editorial (solo desktop). Scroll interno si el viewport es bajo. */}
        <div className="relative hidden min-h-0 flex-col overflow-y-auto border-r bg-muted/30 p-8 lg:flex xl:p-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.04]" />

          <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col">
            <Link href="/" className="inline-flex items-center gap-2.5 self-start">
              <BrandMark />
              <span className="font-heading text-[15px] font-semibold tracking-tight">GardenFood</span>
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                CHILE
              </Badge>
            </Link>

            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Badge variant="outline" className="w-fit gap-1.5 rounded-full bg-card">
                  <Leaf className="size-3" /> Agronomía doméstica
                </Badge>
                <h1 className="font-heading text-4xl font-semibold leading-[0.95] tracking-tight">
                  Tu huerto,
                  <br />
                  <span className="text-primary">con rigor chileno.</span>
                </h1>
                <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
                  De Arica a Punta Arenas, {COMUNAS.length} comunas en 20 zonas agroclimáticas. Calendario fenológico, riego por comuna y fertilización a la medida.
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
            </div>
          </div>
        </div>

        {/* Right — form. Scroll interno si hace falta. */}
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div className="flex h-12 items-center justify-between border-b px-4 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <BrandMark className="size-7" />
              <span className="font-heading text-sm font-semibold">GardenFood</span>
            </Link>
            <Badge variant="secondary" className="rounded-full">Gratis</Badge>
          </div>

          <div className="flex min-h-0 flex-1 overflow-y-auto p-4 py-8 sm:p-6 lg:p-8">
            <div className="m-auto w-full max-w-[420px]">{children}</div>
          </div>
        </div>
      </div>

      {/* Footer único de ancho completo: una sola línea, imposible desalinear. */}
      <footer className="flex flex-col gap-1 border-t px-4 py-3 text-xs text-muted-foreground sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
          © 2026 GardenFood · Fichas agronómicas chilenas · 16 regiones · {COMUNAS.length} comunas
        </span>
        <span>Al continuar aceptas nuestros términos y la política de privacidad · Tus datos de comuna solo se usan para personalizar el calendario</span>
      </footer>
    </div>
  );
}
