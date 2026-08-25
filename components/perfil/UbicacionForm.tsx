"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxCollection,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { actualizarUbicacion } from "@/lib/auth/actions";
import { COMUNAS } from "@/lib/agronomy/comunas";
import { MapPinned } from "lucide-react";

type GrupoComuna = {
  value: string;
  label: string;
  items: string[];
};

export function UbicacionForm() {
  const router = useRouter();
  const [comuna, setComuna] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const grupos: GrupoComuna[] = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of COMUNAS) {
      if (!map.has(c.region)) map.set(c.region, []);
      map.get(c.region)!.push(c.comuna);
    }
    return Array.from(map.entries()).map(([region, comunas]) => ({
      value: region,
      label: region,
      items: comunas.sort((a, b) => a.localeCompare(b, "es-CL")),
    }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("perfiles").select("comuna").eq("id", user.id).maybeSingle();
        if (active && data?.comuna) setComuna(data.comuna);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comuna) {
      toast.error("Elige una comuna del listado.");
      return;
    }
    startTransition(async () => {
      const result = await actualizarUbicacion(comuna.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ubicación actualizada.");
      router.refresh();
    });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="perfil-comuna">Comuna</FieldLabel>
        <Combobox items={grupos} value={comuna} onValueChange={(v) => setComuna(v as string | null)} autoHighlight>
          <ComboboxInput id="perfil-comuna" placeholder="Busca tu comuna… ej. La Florida" aria-label="Comuna" />
          <ComboboxContent>
            <ComboboxEmpty>No se encontró la comuna. Revisa la escritura.</ComboboxEmpty>
            <ComboboxList>
              {(group: GrupoComuna) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel className="flex items-center gap-1.5">
                    <MapPinned className="size-3" /> {group.label}
                  </ComboboxLabel>
                  <ComboboxCollection>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>
          254 comunas disponibles — de Arica a Punta Arenas. Escribe para filtrar y elige; región y zona se asignan solas.
        </FieldDescription>
      </Field>
      <Button type="submit" className="min-h-11 w-full rounded-full" disabled={pending || !comuna}>
        {pending ? "Guardando…" : "Guardar ubicación"}
      </Button>
    </form>
  );
}
