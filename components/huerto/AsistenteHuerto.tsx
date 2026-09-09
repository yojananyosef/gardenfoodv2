"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PasoAsistente {
  id: string;
  titulo: string;
  subtitulo: string;
  /** Contenido del paso, ya renderizado (slot del server). */
  contenido: React.ReactNode;
  /** Si el paso ya está resuelto con datos existentes (se muestra el check). */
  hecho: boolean;
}

interface AsistenteHuertoProps {
  pasos: PasoAsistente[];
  /** Índice del paso inicial según el estado real del huerto. */
  pasoInicial: number;
  /** Marca en el perfil que el asistente ya corrió (no vuelve a dispararse). */
  alCompletar: () => Promise<{ ok: boolean } | { error: string }>;
  /** Si es falso (usuario avanzado reabriéndolo) no re-marca completado. */
  marcarCompletado?: boolean;
}

/**
 * Asistente de 4 pasos del modo guiado (Propuesta E): Terreno → Árboles
 * → Posicionar → Listo. Cada paso guarda al avanzar (el contenido es la UI
 * existente, renderizada por el server); el progreso local vive en este
 * componente y el estado de uno solo vuelve a mostrarse solicitando el paso.
 */
export function AsistenteHuerto({
  pasos,
  pasoInicial,
  alCompletar,
  marcarCompletado = true,
}: AsistenteHuertoProps) {
  const [pasoActual, setPasoActual] = useState(Math.min(pasoInicial, pasos.length - 1));
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  const paso = pasos[pasoActual];
  const esUltimo = pasoActual === pasos.length - 1;

  async function avanzar() {
    if (!esUltimo) {
      setPasoActual(pasoActual + 1);
      return;
    }
    setGuardando(true);
    if (marcarCompletado) await alCompletar();
    setGuardando(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-1.5">
        {pasos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPasoActual(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              i === pasoActual
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {p.hecho && i < pasoActual ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
            <span>
              {i + 1}. {p.titulo}
            </span>
          </button>
        ))}
        <Badge variant="outline" className="rounded-full">
          Paso {pasoActual + 1} de {pasos.length} · guarda al avanzar
        </Badge>
      </div>

      {/* Contenido del paso (slot server) */}
      <div>{paso.contenido}</div>

      {/* Navegación */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={pasoActual === 0 || guardando}
          onClick={() => setPasoActual(pasoActual - 1)}
        >
          <ChevronLeft data-icon="inline-start" /> Atrás
        </Button>
        <p className="hidden text-xs text-muted-foreground sm:block">{paso.subtitulo}</p>
        {esUltimo ? (
          <Button className="rounded-full" disabled={guardando} onClick={avanzar}>
            <CheckCircle2 data-icon="inline-start" />
            {guardando ? "Guardando…" : "Listo, usar mi huerto"}
          </Button>
        ) : (
          <Button className="rounded-full" onClick={avanzar}>
            Siguiente: {pasos[pasoActual + 1].titulo}
            <ChevronRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
