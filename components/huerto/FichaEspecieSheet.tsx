"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FichaEspecieView } from "@/components/especies/FichaEspecieView";
import { getEspeciePorDbKey, getFicha, urlFichaEspecie } from "@/lib/agronomy";
import type { ComunaCatalogo } from "@/lib/agronomy/catalogo";
import { createClient } from "@/lib/supabase/client";

/**
 * El catálogo de comunas se pide al abrir el sheet, no antes.
 *
 * En la página de la ficha lo carga el servidor y llega por props, pero acá
 * sería otra cosa: `BotonFichaEspecie` se usa en muchas pantallas y el sheet
 * casi siempre está cerrado. Pasarlo por props obligaría a bajar 346 filas en
 * cada una aunque nadie lo abra. Se leen de `dim_comunas` cuando se abre, que
 * tiene lectura pública para anon.
 *
 * Sigue habiendo una sola fuente: la tabla. Esto no duplica el catálogo, solo
 * decide cuándo traerlo.
 */
function useComunasAlAbrir(): ComunaCatalogo[] | null {
  const [comunas, setComunas] = useState<ComunaCatalogo[] | null>(null);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase
      .from("dim_comunas")
      .select("comuna, region, zona_agro_id, zona_riego_id, macrozona_id")
      .then(({ data }) => {
        if (!active || !data) return;
        setComunas(
          data.map((r) => ({
            comuna: r.comuna as string,
            region: r.region as string,
            zonaId: Number(r.zona_agro_id ?? 7),
            zonaRiegoId: (r.zona_riego_id as string) || "C1",
            macrozonaId: (r.macrozona_id as string) || "",
            zonaAgroId: String(r.zona_agro_id ?? ""),
          })),
        );
      });
    return () => {
      active = false;
    };
  }, []);
  return comunas;
}

function ContenidoFicha({ dbKey }: { dbKey: string }) {
  const especie = getEspeciePorDbKey(dbKey);
  const ficha = getFicha(dbKey);
  const comunas = useComunasAlAbrir();
  if (!especie || !ficha) {
    return <p className="text-sm text-muted-foreground">No encontramos la ficha de esta especie.</p>;
  }
  if (!comunas) {
    return <p className="text-sm text-muted-foreground">Cargando ficha…</p>;
  }
  // En /huerto el usuario está autenticado: contenido completo, sin lock.
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <FichaEspecieView especie={especie} ficha={ficha} locked={false} comunas={comunas} />
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
