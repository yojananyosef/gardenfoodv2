"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPCIONES = [
  { valor: "light", nombre: "Claro", Icono: Sun },
  { valor: "dark", nombre: "Oscuro", Icono: Moon },
] as const;

/** false en el servidor, true ya hidratado. */
const NADA = () => () => {};
const YA_MONTADO = () => true;
const EN_SERVIDOR = () => false;

/**
 * Selector de tema del perfil.
 *
 * Montarlo con dos botones y no con un <select>: son dos opciones y el
 * gesto de un toque se gana con botones (mismo criterio que el selector de
 * método de riego en la tab Nutrición). El <html> es lo que lleva la clase
 * `dark`; este componente solo escribe en localStorage.
 *
 * `theme` es undefined en el servidor y en el primer render del cliente, así
 * que sin el guard de hidratación el botón «activo» saltaría de claro a
 * oscuro al montar. useSyncExternalStore da ese guard sin setState dentro de
 * un efecto (que la regla react-hooks/set-state-in-effect no permite).
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const montado = useSyncExternalStore(NADA, YA_MONTADO, EN_SERVIDOR);

  return (
    <div
      role="radiogroup"
      aria-label="Modo claro u oscuro"
      className="flex gap-2"
    >
      {OPCIONES.map(({ valor, nombre, Icono }) => {
        const activo = montado && theme === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => setTheme(valor)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-medium transition-colors",
              activo
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <Icono className="size-4" aria-hidden />
            {nombre}
          </button>
        );
      })}
    </div>
  );
}
