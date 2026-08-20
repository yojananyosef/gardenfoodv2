import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between px-4">
            <span className="text-sm font-semibold">GardenFood</span>
            <nav className="hidden items-center gap-4 text-sm md:flex">
              <a href="/huerto" className="text-muted-foreground hover:text-foreground">
                Mi huerto
              </a>
              <a href="/recomendadas" className="text-muted-foreground hover:text-foreground">
                Recomendadas
              </a>
              <a href="/calendario" className="text-muted-foreground hover:text-foreground">
                Calendario
              </a>
              <a href="/cosechas" className="text-muted-foreground hover:text-foreground">
                Cosechas
              </a>
              <a href="/explorar" className="text-muted-foreground hover:text-foreground">
                Biblioteca
              </a>
              <a href="/perfil" className="text-muted-foreground hover:text-foreground">
                Perfil
              </a>
            </nav>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </TelemetryProvider>
  );
}