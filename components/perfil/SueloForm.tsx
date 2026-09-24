"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { actualizarSuelo } from "@/lib/auth/actions";
import { PASOS_CINTA, TIPOS_SUELO, type SueloId } from "@/lib/riego/datos";
import { obtenerRiegoTablas } from "@/lib/riego/client-cache";
import type { RiegoSueloRow } from "@/lib/riego/actions";
import { cn } from "@/lib/utils";

const SUELO_COLOR: Record<SueloId, string> = {
  G: "#D9B382",
  MG: "#BE8A50",
  M: "#8A5A33",
  F: "#5E3A2A",
};

const SENSACION: Record<SueloId, string> = {
  G: "No forma cinta: se desarma. Arenoso, deja granos sueltos en los dedos.",
  MG: "Cinta corta de menos de 2,5 cm que se corta sola. Áspera al frotarla mojada.",
  M: "Cinta de 2,5 a 5 cm. Ni muy áspera ni muy jabonosa al frotarla.",
  F: "Cinta larga de más de 5 cm, sin cortarse. Plástica como greda.",
};

type SueloVista = {
  id: SueloId;
  nombre: string;
  tecnico: string;
  guarda: string;
  sensacion: string;
  manejo: string;
};

function vistaEstatica(): SueloVista[] {
  return TIPOS_SUELO.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    tecnico: t.tecnico,
    guarda: t.guardaMm,
    sensacion: t.sensacion,
    manejo: "",
  }));
}

function TarjetaSuelo({
  suelo,
  selected,
  onSelect,
  disabled,
  mostrarManejo,
}: {
  suelo: SueloVista;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  mostrarManejo?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "overflow-hidden rounded-2xl border text-left transition-all hover:border-primary hover:shadow-sm",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/30",
      )}
    >
      <span className="block h-2.5 w-full" style={{ backgroundColor: SUELO_COLOR[suelo.id] }} aria-hidden />
      <span className="flex flex-col gap-1.5 p-3">
        <span className="flex items-center justify-between gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: SUELO_COLOR[suelo.id] }}
          >
            Guarda {suelo.guarda}
          </span>
          {selected ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Seleccionado">
              <Check className="size-3" />
            </span>
          ) : null}
        </span>
        <span className="text-sm font-bold leading-tight">{suelo.nombre}</span>
        <span className="text-xs text-muted-foreground">{suelo.tecnico}</span>
        <span className="text-xs leading-relaxed">{suelo.sensacion}</span>
        {mostrarManejo && suelo.manejo ? (
          <span className="rounded-lg bg-muted/60 px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
            Cómo regarlo: {suelo.manejo}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function SueloForm() {
  const router = useRouter();
  const [suelo, setSuelo] = useState<SueloId | null>(null);
  const [suelosDB, setSuelosDB] = useState<RiegoSueloRow[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pending, startTransition] = useTransition();
  const [quizAbierto, setQuizAbierto] = useState(false);
  // 0..5 = pasos de la cinta, 6 = elección del resultado.
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    let active = true;
    obtenerRiegoTablas()
      .then((t) => {
        if (active) setSuelosDB(t.suelos);
      })
      .catch(() => {});
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("tipo_suelo")
          .eq("id", user.id)
          .maybeSingle();
        if (active && data?.tipo_suelo) setSuelo(data.tipo_suelo as SueloId);
      }
      if (active) setCargando(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const vista: SueloVista[] =
    suelosDB?.map((s) => ({
      id: s.clave as SueloId,
      nombre: s.nombre,
      tecnico: s.tecnico,
      guarda: `${s.aguaMinMm}–${s.aguaMaxMm} L/m²`,
      sensacion: SENSACION[s.clave as SueloId] ?? "",
      manejo: s.manejo,
    })) ?? vistaEstatica();

  function guardar(id: SueloId, origen: "quiz" | "manual") {
    setSuelo(id);
    startTransition(async () => {
      const result = await actualizarSuelo(id, origen);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tipo de suelo guardado. Se aplicará a todos tus riegos.");
      router.refresh();
    });
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const pasoActual = PASOS_CINTA[Math.min(paso, PASOS_CINTA.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Tipo de suelo">
        {vista.map((t) => (
          <TarjetaSuelo
            key={t.id}
            suelo={t}
            selected={suelo === t.id}
            onSelect={() => void guardar(t.id, "manual")}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full rounded-full"
        onClick={() => {
          setPaso(0);
          setQuizAbierto(true);
        }}
      >
        ¿No sabes qué tipo de suelo tienes? Haz el test de la cinta (2 min)
      </Button>

      <Dialog open={quizAbierto} onOpenChange={setQuizAbierto}>
        <DialogContent className="max-h-[88vh] w-[min(96vw,42rem)] overflow-y-auto sm:max-w-[42rem]">
          <DialogTitle className="text-lg font-semibold">Test de la cinta — ¿qué suelo tengo?</DialogTitle>
          <DialogDescription>
            Se hace una sola vez por terreno y toma dos minutos: una cucharada de tierra de 20 cm, un poco de
            agua y tus manos.
          </DialogDescription>

          {paso < PASOS_CINTA.length ? (
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Paso {paso + 1} de {PASOS_CINTA.length}
                </p>
                <div className="flex gap-1" aria-hidden>
                  {PASOS_CINTA.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-6 rounded-full",
                        i < paso ? "bg-primary/40" : i === paso ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground"
                  aria-hidden
                >
                  {paso + 1}
                </span>
                <span>
                  <span className="block text-base font-bold leading-tight">{pasoActual.titulo}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {pasoActual.detalle}
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1"
                  disabled={paso === 0 || pending}
                  onClick={() => setPaso((v) => Math.max(0, v - 1))}
                >
                  Atrás
                </Button>
                <Button type="button" className="min-h-11 flex-1" onClick={() => setPaso((v) => v + 1)}>
                  {paso === PASOS_CINTA.length - 1 ? "Ya hice la cinta" : "Siguiente"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-sm font-semibold">
                ¿Cuál de estas cuatro se parece a tu cinta?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {vista.map((t) => (
                  <TarjetaSuelo
                    key={t.id}
                    suelo={t}
                    selected={suelo === t.id}
                    disabled={pending}
                    mostrarManejo
                    onSelect={() => {
                      guardar(t.id, "quiz");
                      setQuizAbierto(false);
                    }}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 w-full"
                onClick={() => setPaso(PASOS_CINTA.length - 1)}
              >
                Repasar los pasos
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
