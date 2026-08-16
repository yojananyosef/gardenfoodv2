import Link from "next/link";
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
          <nav className="flex items-center gap-4 text-sm">
            <a href="/explorar" className="text-muted-foreground hover:text-foreground">
              Explorar
            </a>
            <a href="/registro" className="text-muted-foreground hover:text-foreground">
              Registro
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </div>
    </TelemetryProvider>
  );
}