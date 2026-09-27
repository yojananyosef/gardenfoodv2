import Link from "next/link";
import { Calculator, Compass, LogIn, ShieldCheck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/BrandMark";
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
      <Button variant="ghost" size="sm" className="hidden h-8 rounded-lg sm:inline-flex" render={<Link href="/explorar" />}>
        <Compass data-icon="inline-start" />
        Explorar
      </Button>
      <Button variant="ghost" size="sm" className="hidden h-8 rounded-lg sm:inline-flex" render={<Link href="/calculadoras" />}>
        <Calculator data-icon="inline-start" />
        Calculadoras
      </Button>
      {/* mobile compact */}
      <Link href="/explorar" className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden" aria-label="Explorar">
        <Compass className="size-4" />
      </Link>
      <Link href="/calculadoras" className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden" aria-label="Calculadoras">
        <Calculator className="size-4" />
      </Link>
      {/* En móvil el texto estorba: la marca + 4 acciones no caben en 390 px
          y la barra entera empujaba el documento 3 px hacia los lados. */}
      <Button variant="ghost" size="sm" className="h-8 rounded-lg" render={<Link href="/login" />} aria-label="Entrar">
        <LogIn data-icon="inline-start" />
        <span className="hidden sm:inline">Entrar</span>
      </Button>
      <Button size="sm" className="h-8 rounded-lg px-3" render={<Link href="/registro" />}>
        Registrarme
      </Button>
    </nav>
  );
}

function UserNav({ esAdmin }: { esAdmin?: boolean }) {
  return (
    <nav className="flex items-center gap-1 sm:gap-3">
      {/* Los 5 links + Admin + Perfil + salir necesitan ~760 px con la marca.
          Con md: (768) no cabían: a 768 y 820 el nav se salía del viewport,
          Perfil y "salir" quedaban cortados y la página scrolleaba en
          horizontal. Por eso la nav de links arranca en lg (1024), que es
          justo donde el cálculo alcanza. */}
      <div className="hidden items-center gap-1 text-sm lg:flex">
        {LINKS_USUARIO.map(({ href, label }) => (
          <Button key={href} variant="ghost" size="sm" className="h-8 rounded-lg" render={<Link href={href} />}>
            {label}
          </Button>
        ))}
      </div>
      {esAdmin ? (
        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary" render={<Link href="/admin" />}>
          <ShieldCheck data-icon="inline-start" />
          Admin
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" className="h-8 rounded-lg" render={<Link href="/perfil" />}>
        <User data-icon="inline-start" />
        <span className="hidden lg:inline">Perfil</span>
      </Button>
      <SignOutButton />
    </nav>
  );
}

export async function TopBar({ esAdmin }: { esAdmin?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <BrandMark />
          <span className="font-heading text-[15px] font-semibold tracking-tight">GardenFood</span>
          <Badge variant="secondary" className="hidden rounded-full px-1.5 py-0 text-[10px] sm:inline-flex">
            CHILE
          </Badge>
        </Link>
        {user ? <UserNav esAdmin={esAdmin} /> : <GuestNav />}
      </div>
    </header>
  );
}
