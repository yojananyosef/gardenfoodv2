import Image from "next/image";

import { cn } from "@/lib/utils";

/** Marca GardenFood: el hortelano (pala + chuzo + chupalla) sobre ficha.
 *  El PNG es transparente; el fondo lo pone el wrapper para que funcione
 *  en claro y oscuro. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="GardenFood"
      width={64}
      height={64}
      className={cn(
        "size-8 shrink-0 rounded-lg border border-foreground/15 bg-card object-contain p-0.5",
        className,
      )}
    />
  );
}
