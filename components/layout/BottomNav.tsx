"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Leaf, Sprout, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const DESTINOS = [
  { href: "/huerto", label: "Mi huerto", icon: Sprout },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/cosechas", label: "Cosechas", icon: UtensilsCrossed },
  { href: "/explorar", label: "Biblioteca", icon: Leaf },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid w-full max-w-2xl grid-cols-4">
        {DESTINOS.map(({ href, label, icon: Icon }) => {
          const activo =
            pathname === href || (href !== "/huerto" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
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