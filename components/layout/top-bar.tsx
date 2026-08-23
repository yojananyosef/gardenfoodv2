import Link from "next/link";
import { Calculator, Compass, LogIn, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { createClient } from "@/lib/supabase/server";

const LINKS_USUARIO = [
  { href: "/huerto", label: "Mi huerto" },
  { href: "/recomendadas", label: "Recomendadas" },
  { href: "/calendario", label: "Calendario" },
  { href: "/cosechas", label: "Cosechas" },
  { href: "/explorar", label: "Biblioteca" },
] as const;

function GuestNav() {
  return (
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
      <Button size="sm" render={<Link href="/registro" />}>
        Registrarme
      </Button>
    </nav>
  );
}

function UserNav() {
  return (
    <nav className="flex items-center gap-4">
      <div className="hidden items-center gap-4 text-sm md:flex">
        {LINKS_USUARIO.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-muted-foreground hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </div>
      <Link
        href="/perfil"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <User className="size-4" aria-hidden />
        <span className="hidden lg:inline">Perfil</span>
      </Link>
      <SignOutButton />
    </nav>
  );
}

export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-sm font-semibold tracking-wide">
          GardenFood
        </Link>
        {user ? <UserNav /> : <GuestNav />}
      </div>
    </header>
  );
}
