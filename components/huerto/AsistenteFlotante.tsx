"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AsistenteHuerto, type PasoAsistente } from "@/components/huerto/AsistenteHuerto";

interface AsistenteFlotanteProps {
  pasos: PasoAsistente[];
  pasoInicial: number;
  /** false cuando el usuario ya lo corrió (no re-marca completado). */
  marcarCompletado: boolean;
  /** Action server serializable (debe venir de un server component). */
  onCompletar: () => Promise<{ ok: boolean } | { error: string }>;
  /** True si el asistente ya fue completado una vez: no vuelve a marcar. */
  skipCompletado?: boolean;
}

/**
 * «Abrir asistente otra vez» del modo modular (Propuesta E): los 4 pasos
 * de la C en un modal, retomando lo pendiente. Deja de marcar completado
 * si ya lo estaba (es la puerta de vuelta, no una repetición obligatoria).
 */
export function AsistenteFlotante({ pasos, pasoInicial, marcarCompletado, onCompletar, skipCompletado = false }: AsistenteFlotanteProps) {
  const [abierto, setAbierto] = useState(false);

  const alCompletar = skipCompletado
    ? async () => ({ ok: true })
    : onCompletar;

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={<Button variant="outline" className="rounded-full" />}>
        <Wand2 data-icon="inline-start" />
        <span className="hidden sm:inline">Abrir asistente</span>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] w-[min(96vw,56rem)] sm:max-w-[56rem] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Asistente del huerto</DialogTitle>
          <DialogDescription>
            Terreno → Árboles → Posicionar → Listo. Retoma donde quedaste; nada se repite.
          </DialogDescription>
        </DialogHeader>
        <AsistenteHuerto
          pasos={pasos}
          pasoInicial={pasoInicial}
          marcarCompletado={marcarCompletado}
          alCompletar={onCompletar}
        />
      </DialogContent>
    </Dialog>
  );
}
