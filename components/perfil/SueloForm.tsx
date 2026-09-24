"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { actualizarSuelo } from "@/lib/auth/actions";
import { PASOS_CINTA, TIPOS_SUELO, type SueloId } from "@/lib/riego/datos";
import { cn } from "@/lib/utils";

const SUELO_COLOR: Record<SueloId, string> = {
  G: "#D9B382",
  MG: "#BE8A50",
  M: "#8A5A33",
  F: "#5E3A2A",
};

export function SueloForm() {
  const router = useRouter();
  const [suelo, setSuelo] = useState<SueloId | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pending, startTransition] = useTransition();
  const [quizAbierto, setQuizAbierto] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    let active = true;
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

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Tipo de suelo">
        {TIPOS_SUELO.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={suelo === t.id}
            onClick={() => void guardar(t.id, "manual")}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors hover:border-primary",
              suelo === t.id && "border-primary bg-primary/5 ring-1 ring-primary",
            )}
          >
            <span
              className="w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: SUELO_COLOR[t.id] }}
            >
              {t.nombre}
            </span>
            <span className="text-xs text-muted-foreground">{t.tecnico}</span>
            <span className="text-xs font-medium">Guarda {t.guardaMm}</span>
          </button>
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
            Se hace una sola vez por terreno. Sigue los pasos y al final elige la tarjeta que se parezca a tu tierra.
          </DialogDescription>
          <ol className="mt-2 flex flex-col gap-2">
            {PASOS_CINTA.map((p, i) => (
              <li
                key={p.titulo}
                className={cn(
                  "rounded-xl border p-3",
                  i === paso && "border-primary bg-primary/5",
                  i < paso && "opacity-60",
                )}
              >
                <p className="text-sm font-semibold">
                  {i + 1}. {p.titulo}
                </p>
                <p className="text-sm text-muted-foreground">{p.detalle}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              disabled={paso === 0 || pending}
              onClick={() => setPaso((v) => Math.max(0, v - 1))}
            >
              Atrás
            </Button>
            {paso < PASOS_CINTA.length - 1 ? (
              <Button type="button" className="min-h-11 flex-1" onClick={() => setPaso((v) => v + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-11 flex-1"
                disabled={pending}
                onClick={() => setQuizAbierto(false)}
              >
                Ya hice la cinta: elijo abajo
              </Button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TIPOS_SUELO.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  guardar(t.id, "quiz");
                  setQuizAbierto(false);
                }}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-3 text-left hover:border-primary",
                  suelo === t.id && "border-primary bg-primary/5 ring-1 ring-primary",
                )}
              >
                <span className="text-sm font-semibold">{t.nombre}</span>
                <span className="text-xs text-muted-foreground">{t.sensacion}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
