"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PESTANAS = [
  { href: "/admin", label: "Overview", exacta: true },
  { href: "/admin/insights", label: "Insights", exacta: false },
  { href: "/admin/media-kit", label: "Media kit", exacta: false },
  { href: "/admin/usuarios", label: "Usuarios", exacta: false },
  { href: "/admin/finanzas", label: "Finanzas", exacta: false },
  { href: "/admin/audiencias", label: "Audiencias", exacta: false },
  { href: "/admin/sponsorships", label: "Patrocinios", exacta: false },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de administración"
      className="flex gap-1 overflow-x-auto pb-1"
    >
      {PESTANAS.map(({ href, label, exacta }) => {
        const activo = exacta ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
              activo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
