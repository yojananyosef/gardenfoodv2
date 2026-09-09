"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registrarAplicacion } from "@/lib/huerto/actions";
import { cn } from "@/lib/utils";

interface BotonLoEcheProps {
  especie: string;
  /** Nombre legible para el tostado. */
  nombreEspecie: string;
  momento: string;
  producto: string;
  gramos: number;
  /** Meses del momento siguiente, para agendar en el calendario. */
  mesesProximoMomento: string | null;
  /** «Lo eché a mis N <especie>s» cuando el usuario tiene cultivo de esta especie. */
  arbolesPropios: number;
}

/** Acción «Lo eché»: registra la aplicación y agenda el cuidado siguiente. */
export function BotonLoEche(props: BotonLoEcheProps) {
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function aplicar() {
    setGuardando(true);
    setError(null);
    const resultado = await registrarAplicacion({
      especie: props.especie,
      momento: props.momento,
      producto: props.producto,
      gramos: props.gramos > 0 ? props.gramos : null,
      mesesProximoMomento: props.mesesProximoMomento,
    });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error ?? "No se pudo registrar.");
      return;
    }
    setHecho(true);
    router.refresh();
  }

  if (hecho) {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
        <CheckCircle2 className="size-4" /> Lo registramos y agendamos el cuidado siguiente
      </p>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      <Button
        className={cn("w-fit rounded-full")}
        variant={props.arbolesPropios > 0 ? "default" : "outline"}
        disabled={guardando}
        onClick={aplicar}
      >
        {guardando
          ? "Registrando…"
          : props.arbolesPropios > 0
            ? `Lo eché a mis ${props.arbolesPropios} ${props.nombreEspecie.toLowerCase() === "arándano" || props.nombreEspecie === "frutilla" ? props.nombreEspecie.toLowerCase() + "s" : props.nombreEspecie.toLowerCase() + "s"}`
            : "Lo eché hoy"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
