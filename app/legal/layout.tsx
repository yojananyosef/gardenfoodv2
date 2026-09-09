import Link from "next/link";
import { Sprout } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center gap-2 px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="size-4" />
            </span>
            GardenFood
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">{children}</main>
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <nav className="flex justify-center gap-4">
          <Link href="/legal/terminos" className="hover:underline">Términos</Link>
          <Link href="/legal/privacidad" className="hover:underline">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:underline">Cookies</Link>
        </nav>
      </footer>
    </div>
  );
}
