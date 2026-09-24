"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";
import { BotonFichaEspecie } from "@/components/huerto/FichaEspecieSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { actualizarArbol, eliminarArbol } from "@/lib/huerto/actions";
import { buscarComuna, getEspeciePorDbKey, getFicha } from "@/lib/agronomy";
import { calcularRiego } from "@/lib/riego/calc";
import { copaReferencia, EDADES_RIEGO, NIVELES_HUMEDAD } from "@/lib/riego/datos";
import { cn } from "@/lib/utils";
import type { Arbol, EdadClaseArbol, MetodoRiegoArbol } from "@/types";

export type OpcionEspecie = { dbKey: string; nombre: string };

export function nombreArbol(especie: string): string {
  return getEspeciePorDbKey(especie)?.nombre ?? especie;
}

export function EditarArbolDialog({
  arbol,
  especies,
  onCerrar,
  onActualizado,
  onEliminado,
}: {
  arbol: Arbol;
  especies: OpcionEspecie[];
  onCerrar: () => void;
  onActualizado?: (arbol: Arbol) => void;
  onEliminado?: () => void;
}) {
  const router = useRouter();
  const [especie, setEspecie] = useState(arbol.especie);
  const [fecha, setFecha] = useState(arbol.fechaPlantacion ?? "");
  const [observaciones, setObservaciones] = useState(arbol.observaciones ?? "");
  const [edadClase, setEdadClase] = useState<EdadClaseArbol | "">(
    (arbol.edadClase as EdadClaseArbol | undefined) ?? "",
  );
  const [copaM, setCopaM] = useState(arbol.copaM != null ? String(arbol.copaM) : "");
  const [metodoRiego, setMetodoRiego] = useState<MetodoRiegoArbol | "">(
    (arbol.metodoRiego as MetodoRiegoArbol | undefined) ?? "",
  );
  const [caudalLH, setCaudalLH] = useState(arbol.caudalLH != null ? String(arbol.caudalLH) : "");
  const [humedad, setHumedad] = useState("2");
  const [etapaObs, setEtapaObs] = useState("");
  const [sueloPerfil, setSueloPerfil] = useState<string | null>(null);
  const [zonaPerfil, setZonaPerfil] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  // Los detalles parten expandidos solo si el árbol ya tiene datos.
  const [detallesAbiertos, setDetallesAbiertos] = useState(
    Boolean(
      arbol.fechaPlantacion ||
        arbol.observaciones ||
        arbol.edadClase ||
        arbol.copaM ||
        arbol.metodoRiego,
    ),
  );

  // Suelo + zona del perfil para previsualizar el riego con los datos del usuario.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("perfiles")
          .select("tipo_suelo, comuna")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        if (data?.tipo_suelo) setSueloPerfil(data.tipo_suelo as string);
        if (data?.comuna) {
          const match = buscarComuna(data.comuna as string);
          if (match) setZonaPerfil(match.zonaId);
        }
      } catch {
        // Sin perfil: la vista previa usa valores de referencia.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const ficha = getFicha(especie);
  const riegoPreview = useMemo(() => {
    const copaNum = copaM.trim() ? Number(copaM) : null;
    const caudalNum = caudalLH.trim() ? Number(caudalLH) : null;
    return calcularRiego({
      dbKey: especie,
      mes: new Date().getMonth() + 1,
      zonaId: zonaPerfil,
      suelo: (sueloPerfil as "G" | "MG" | "M" | "F" | null) ?? null,
      edad: (edadClase as "recien" | "joven" | "inicial" | "adulto" | null) || null,
      copaM: copaNum !== null && Number.isFinite(copaNum) ? copaNum : null,
      humedad: Number(humedad) || 2,
      etapaObs: etapaObs || null,
      caudalLH: caudalNum !== null && Number.isFinite(caudalNum) ? caudalNum : null,
    });
  }, [especie, zonaPerfil, sueloPerfil, edadClase, copaM, humedad, etapaObs, caudalLH]);

  function guardar() {
    startTransition(async () => {
      const copaNum = copaM.trim() ? Number(copaM) : null;
      const caudalNum = caudalLH.trim() ? Number(caudalLH) : null;
      if (copaNum !== null && (!Number.isFinite(copaNum) || copaNum < 0.2 || copaNum > 12)) {
        toast.error("La copa debe estar entre 0,2 y 12 m.");
        return;
      }
      if (caudalNum !== null && (!Number.isFinite(caudalNum) || caudalNum < 0 || caudalNum > 500)) {
        toast.error("El caudal debe estar entre 0 y 500 L/h.");
        return;
      }
      const result = await actualizarArbol(arbol.id, {
        especie,
        fechaPlantacion: fecha ? fecha : null,
        observaciones: observaciones.trim() ? observaciones.trim() : null,
        edadClase: edadClase ? edadClase : null,
        copaM: copaNum,
        metodoRiego: metodoRiego ? metodoRiego : null,
        caudalLH: caudalNum,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol actualizado.");
      onActualizado?.({
        ...arbol,
        especie,
        fechaPlantacion: fecha ? fecha : null,
        observaciones: observaciones.trim() ? observaciones.trim() : null,
        edadClase: (edadClase as EdadClaseArbol) || null,
        copaM: copaNum,
        metodoRiego: (metodoRiego as MetodoRiegoArbol) || null,
        caudalLH: caudalNum,
      });
      onCerrar();
      router.refresh();
    });
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar este ${nombreArbol(arbol.especie)} del inventario?`)) {
      return;
    }
    startTransition(async () => {
      const result = await eliminarArbol(arbol.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Árbol eliminado.");
      onEliminado?.();
      onCerrar();
      router.refresh();
    });
  }

  return (
    <DialogContent className="max-h-[88vh] w-[min(96vw,42rem)] overflow-y-auto sm:max-w-[42rem]">
      <DialogTitle className="text-lg font-semibold">
        {nombreArbol(arbol.especie)}
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Árbol individual. Cada unidad se edita por separado.
      </DialogDescription>
      <div className="mt-2 flex flex-col gap-3">
        {/* Puente E3 primero: ficha en sheet sobre la misma página */}
        <BotonFichaEspecie dbKey={arbol.especie} nombre={nombreArbol(arbol.especie)} />
        <button
          type="button"
          onClick={() => setDetallesAbiertos((v) => !v)}
          aria-expanded={detallesAbiertos}
          className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50"
        >
          Agrega más detalles a tu árbol
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              detallesAbiertos && "rotate-180",
            )}
          />
        </button>
        {detallesAbiertos ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-especie">Especie</Label>
              <Select value={especie} onValueChange={(value) => setEspecie(value ?? "")}>
                <SelectTrigger id="plano-especie" className="w-full min-h-11">
                  <SelectValue>
                    {(value: string | null) =>
                      especies.find((e) => e.dbKey === value)?.nombre ?? "Elige una especie…"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {especies.map((e) => (
                    <SelectItem key={e.dbKey} value={e.dbKey}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-fecha">Fecha de plantación</Label>
              <Input
                id="plano-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plano-obs">Observaciones</Label>
              <Input
                id="plano-obs"
                value={observaciones}
                maxLength={500}
                onChange={(e) => setObservaciones(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-edad">Edad del árbol</Label>
                <Select
                  value={edadClase || undefined}
                  onValueChange={(v) => setEdadClase((v as EdadClaseArbol) ?? "")}
                >
                  <SelectTrigger id="plano-edad" className="min-h-11 w-full">
                    <SelectValue placeholder="Elige la edad…" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDADES_RIEGO.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aplica el coeficiente de agua: 30 % recién plantado, 55 % joven, 80 % inicial, 100 % adulto.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-copa">Ancho de la copa (m)</Label>
                <Input
                  id="plano-copa"
                  type="number"
                  min={0.2}
                  max={12}
                  step={0.1}
                  inputMode="decimal"
                  placeholder={String(copaReferencia(especie))}
                  value={copaM}
                  onChange={(e) => setCopaM(e.target.value)}
                  className="min-h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Sombra al mediodía, de punta a punta. Referencia: {copaReferencia(especie)} m.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-metodo">Método de riego</Label>
                <Select
                  value={metodoRiego || undefined}
                  onValueChange={(v) => setMetodoRiego((v as MetodoRiegoArbol) ?? "")}
                >
                  <SelectTrigger id="plano-metodo" className="min-h-11 w-full">
                    <SelectValue placeholder="Balde, manguera o goteo…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balde">Baldes (10 L c/u)</SelectItem>
                    <SelectItem value="manguera">Manguera</SelectItem>
                    <SelectItem value="goteo">Goteo / cintas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-caudal">Caudal (L/h por árbol)</Label>
                <Input
                  id="plano-caudal"
                  type="number"
                  min={0}
                  max={500}
                  step={1}
                  inputMode="numeric"
                  placeholder="4 goteros de 4 L/h = 16"
                  value={caudalLH}
                  onChange={(e) => setCaudalLH(e.target.value)}
                  className="min-h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-humedad">¿Cómo está la tierra hoy?</Label>
                <Select value={humedad} onValueChange={(v) => setHumedad(v ?? "2")}>
                  <SelectTrigger id="plano-humedad" className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES_HUMEDAD.map((n) => (
                      <SelectItem key={n.n} value={String(n.n)}>
                        {n.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="plano-etapa">¿Qué ves hoy en el árbol?</Label>
                <Select value={etapaObs || "__cal"} onValueChange={(v) => setEtapaObs(!v || v === "__cal" ? "" : v)}>
                  <SelectTrigger id="plano-etapa" className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__cal">Que lo decida el calendario</SelectItem>
                    {(ficha?.riego ?? []).map((r) => (
                      <SelectItem key={r.etapa} value={r.etapa}>
                        {r.etapa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {riegoPreview ? (
              <div className="rounded-xl border bg-muted/30 p-3" aria-live="polite">
                <p className="text-sm font-semibold">
                  {riegoPreview.regarHoy
                    ? `${riegoPreview.litros} L por árbol · vuelve en ${riegoPreview.cadaDias} ${riegoPreview.cadaDias === 1 ? "día" : "días"}`
                    : "Hoy no riegue: la tierra aún tiene agua"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rango {riegoPreview.litrosMin}–{riegoPreview.litrosMax} L ·{" "}
                  {riegoPreview.litros} L = {riegoPreview.baldes} baldes de 10 L
                  {riegoPreview.horasGoteo !== null ? ` = ${riegoPreview.horasGoteo} h de goteo` : ""} ·{" "}
                  Etapa: {riegoPreview.etapa} ({riegoPreview.fuente === "observacion" ? "lo que ves" : "calendario"}).
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Completa especie y datos para ver la dosis estimada.
              </p>
            )}
            <Button type="button" className="min-h-11 w-full" onClick={guardar} disabled={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive"
          onClick={eliminar}
          disabled={pending}
        >
          <Trash2 data-icon="inline-start" /> Eliminar
        </Button>
      </div>
    </DialogContent>
  );
}
