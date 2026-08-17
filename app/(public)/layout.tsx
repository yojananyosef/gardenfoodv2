import Link from "next/link";
import { Calculator, Compass, LogIn } from "lucide-react";
import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between px-4">
            <Link href="/" className="text-sm font-semibold">
              GardenFood
            </Link>
            <nav className="flex items-center gap-1 sm:gap-4">
              <Link
                href="/explorar"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Compass className="size-4" aria-hidden />
                <span className="hidden sm:inline">Explorar</span>
              </Link>
              <Link
                href="/calculadoras"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Calculator className="size-4" aria-hidden />
                <span className="hidden sm:inline">Calculadoras</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogIn className="size-4" aria-hidden />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
              <Link
                href="/registro"
                className="hidden rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground sm:inline"
              >
                Registro
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </div>
    </TelemetryProvider>
  );
}