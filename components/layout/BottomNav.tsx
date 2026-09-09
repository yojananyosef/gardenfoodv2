"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Leaf, MapPinned, ShieldCheck, Sprout, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const DESTINOS = [
  { href: "/huerto", label: "Mi huerto", icon: Sprout },
  { href: "/recomendadas", label: "Zonas", icon: MapPinned },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/cosechas", label: "Cosechas", icon: UtensilsCrossed },
  { href: "/explorar", label: "Biblioteca", icon: Leaf },
];

const ADMIN = { href: "/admin", label: "Admin", icon: ShieldCheck } as const;

export function BottomNav({ esAdmin }: { esAdmin?: boolean }) {
  const pathname = usePathname();
  const destinos = esAdmin ? [...DESTINOS, ADMIN] : DESTINOS;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className={cn(
          "mx-auto grid w-full max-w-2xl",
          esAdmin ? "grid-cols-6" : "grid-cols-5",
        )}
      >
        {destinos.map(({ href, label, icon: Icon }) => {
          const activo =
            pathname === href ||
            (href !== "/huerto" && pathname.startsWith(href)) ||
            (href === "/admin" && pathname.startsWith("/admin"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                activo
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
