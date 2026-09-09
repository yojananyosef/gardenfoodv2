"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Compass, LayoutGrid } from "lucide-react";
import { setHuertoModo } from "@/lib/huerto/actions";
import { cn } from "@/lib/utils";

type Modo = "guiado" | "modular";

interface ModoToggleProps {
  modo: Modo;
  /** Variante compacta para el móvil (solo iconos + texto corto). */
  compacto?: boolean;
  className?: string;
}

/**
 * Toggle Guiado ↔ Modular: cambia la vista en el instante (estado local)
 * y persiste la preferencia en el perfil en segundo plano.
 */
export function ModoToggle({ modo, compacto = false, className }: ModoToggleProps) {
  const [modoLocal, setModoLocal] = useState<Modo>(modo);
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();

  if (modoLocal !== modo && !pendiente) {
    setModoLocal(modo);
  }

  function cambiar(nuevo: Modo) {
    if (nuevo === modoLocal || pendiente) return;
    setModoLocal(nuevo);
    startTransition(async () => {
      await setHuertoModo({ modo: nuevo });
      router.refresh();
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Modo de vista del huerto"
      className={cn(
        "inline-flex items-center rounded-full border bg-card p-1 shadow-sm",
        className,
      )}
    >
      <button
        role="tab"
        aria-selected={modoLocal === "guiado"}
        onClick={() => cambiar("guiado")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          modoLocal === "guiado" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Compass className="size-3.5" />
        <span className={compacto ? "" : "hidden sm:inline"}>Guiado</span>
      </button>
      <button
        role="tab"
        aria-selected={modoLocal === "modular"}
        onClick={() => cambiar("modular")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          modoLocal === "modular" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-3.5" />
        <span className={compacto ? "" : "hidden sm:inline"}>Modular</span>
      </button>
    </div>
  );
}
