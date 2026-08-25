import Link from "next/link";
import { Calculator, Compass, LogIn, Sprout, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    <nav className="flex items-center gap-1 sm:gap-1.5">
      <Button variant="ghost" size="sm" className="hidden h-8 rounded-full sm:inline-flex" render={<Link href="/explorar" />}>
        <Compass data-icon="inline-start" />
        Explorar
      </Button>
      <Button variant="ghost" size="sm" className="hidden h-8 rounded-full sm:inline-flex" render={<Link href="/calculadoras" />}>
        <Calculator data-icon="inline-start" />
        Calculadoras
      </Button>
      {/* mobile compact */}
      <Link href="/explorar" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden" aria-label="Explorar">
        <Compass className="size-4" />
      </Link>
      <Link href="/calculadoras" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden" aria-label="Calculadoras">
        <Calculator className="size-4" />
      </Link>
      <Button variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href="/login" />}>
        <LogIn data-icon="inline-start" />
        Entrar
      </Button>
      <Button size="sm" className="h-8 rounded-full px-3" render={<Link href="/registro" />}>
        Registrarme
      </Button>
    </nav>
  );
}

function UserNav() {
  return (
    <nav className="flex items-center gap-1 sm:gap-3">
      <div className="hidden items-center gap-1 text-sm md:flex">
        {LINKS_USUARIO.map(({ href, label }) => (
          <Button key={href} variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href={href} />}>
            {label}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="h-8 rounded-full" render={<Link href="/perfil" />}>
        <User data-icon="inline-start" />
        <span className="hidden lg:inline">Perfil</span>
      </Button>
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
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-4" aria-hidden />
          </span>
          <span className="font-heading text-[15px] font-semibold tracking-tight">GardenFood</span>
          <Badge variant="secondary" className="hidden rounded-full px-1.5 py-0 text-[10px] sm:inline-flex">
            CHILE
          </Badge>
        </Link>
        {user ? <UserNav /> : <GuestNav />}
      </div>
    </header>
  );
}
