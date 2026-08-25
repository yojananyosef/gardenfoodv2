"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TerrenoMap } from "@/components/perfil/TerrenoMap";
import { guardarTerreno } from "@/lib/auth/actions";
import { parseTerrenoFeature, type TerrenoFeature } from "@/lib/huerto/terreno";

export function TerrenoSection() {
  const router = useRouter();
  const [featureInicial, setFeatureInicial] = useState<TerrenoFeature | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState<
    TerrenoFeature | null | undefined
  >(undefined);
  const [pending, startTransition] = useTransition();

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
          .select("terreno_geojson")
          .eq("id", user.id)
          .maybeSingle();
        if (active) setFeatureInicial(parseTerrenoFeature(data?.terreno_geojson));
      }
      if (active) setCargando(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  function handleChange(feature: TerrenoFeature | null) {
    const sinCambios =
      JSON.stringify(feature) === JSON.stringify(featureInicial);
    setPendiente(sinCambios ? undefined : feature);
  }

  function handleGuardar() {
    if (pendiente === undefined) return;
    if (pendiente === null && featureInicial === null) return;
    if (
      pendiente === null &&
      !window.confirm(
        "¿Borrar tu terreno delimitado? Se eliminará el polígono guardado.",
      )
    ) {
      return;
    }
    const aGuardar = pendiente;
    startTransition(async () => {
      const result = await guardarTerreno(aGuardar);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(aGuardar === null ? "Terreno borrado." : "Terreno guardado.");
      setFeatureInicial(aGuardar);
      setPendiente(undefined);
      router.refresh();
    });
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  const sinTerreno = featureInicial === null && pendiente === undefined;

  return (
    <div className="flex flex-col gap-3">
      {sinTerreno && (
        <p className="text-xs text-muted-foreground">
          Aún no delimitas tu terreno. Activa el ícono de polígono en el mapa y
          toca las esquinas de tu huerto para calcular su superficie.
        </p>
      )}
      <TerrenoMap featureInicial={featureInicial} onChange={handleChange} />
      <Button
        type="button"
        className="min-h-11 w-full"
        disabled={
          pending ||
          pendiente === undefined ||
          (pendiente === null && featureInicial === null)
        }
        onClick={handleGuardar}
      >
        {pending
          ? "Guardando…"
          : pendiente === null
            ? "Borrar terreno"
            : "Guardar terreno"}
      </Button>
    </div>
  );
}
