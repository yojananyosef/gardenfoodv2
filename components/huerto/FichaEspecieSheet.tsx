"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FichaEspecieView } from "@/components/especies/FichaEspecieView";
import { getEspeciePorDbKey, getFicha, urlFichaEspecie } from "@/lib/agronomy";

function ContenidoFicha({ dbKey }: { dbKey: string }) {
  const especie = getEspeciePorDbKey(dbKey);
  const ficha = getFicha(dbKey);
  if (!especie || !ficha) {
    return <p className="text-sm text-muted-foreground">No encontramos la ficha de esta especie.</p>;
  }
  // En /huerto el usuario está autenticado: contenido completo, sin lock.
  return (
    <div className="flex flex-col gap-3">
      <FichaEspecieView especie={especie} ficha={ficha} locked={false} />
      <Link
        href={urlFichaEspecie(dbKey)}
        className="text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Abrir página completa de la ficha →
      </Link>
    </div>
  );
}

/** Botón “Ver ficha” que abre la especie en un sheet sobre la misma página.
 *  Preserva el estado del mapa (zoom, polígono, modo marca) al cerrar. */
export function BotonFichaEspecie({
  dbKey,
  nombre,
  variante = "boton",
  texto,
  className = "",
  children,
}: {
  dbKey: string;
  nombre: string;
  variante?: "boton" | "chip";
  texto?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title={`Ver ficha de ${nombre}`}
        className={
          (variante === "chip"
            ? "inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs transition-colors hover:bg-muted/50 "
            : "w-full rounded-full border px-3 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground ") +
          className
        }
      >
        {children ?? texto ?? (variante === "chip" ? nombre : "Ver ficha de la especie →")}
      </button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[88vh] w-[min(96vw,56rem)] overflow-y-auto rounded-2xl sm:max-w-[56rem]">
          <DialogHeader>
            <DialogTitle>Ficha de {nombre}</DialogTitle>
            <DialogDescription>Cuidados de la especie. Cierra para volver a tu huerto sin perder el mapa.</DialogDescription>
          </DialogHeader>
          {abierto ? <ContenidoFicha dbKey={dbKey} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
