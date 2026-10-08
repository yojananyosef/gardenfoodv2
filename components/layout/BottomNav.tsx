"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Leaf, MapPinned, ShieldCheck, Sprout, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Destinos de la barra inferior.
 *
 * «Cultivos» apunta al índice de especies, no a `/huerto`. La card de Cultivos
 * en la pantalla principal enlaza ahí, y que la barra móvil no llegara al mismo
 * destino obligaba al usuario de celular a=subir hasta el header de escritorio
 * para ver sus árboles. El enlace de la card era un atajo que no se podía usar
 * en móvil.
 *
 * `grid-cols` NO se sube a 6. Con etiquetas como «Calendario» y «Biblioteca», seis
 * destinos en 360 px dan ~60 px por ítem y el texto se parte o se corta; el
 * diseño ya lo anticipaba y la salida elegida fue no agregar el sexto destino.
 * `/especie/especies` sigue alcanzable desde el header en móvil.
 */
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
      /* Sube a lg (1024) y no md (768): entre 768 y 1024 la nav de links de
         arriba ya no se muestra, así que la inferior tiene que seguir
         presente o ese rango se queda sin navegación. */
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur lg:hidden"
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
                "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                activo
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {activo ? (
                <span className="absolute top-1.5 size-1 rounded-full bg-cosecha" aria-hidden />
              ) : null}
              <Icon className="size-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
