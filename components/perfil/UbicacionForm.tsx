"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actualizarUbicacion } from "@/lib/auth/actions";

export function UbicacionForm() {
  const router = useRouter();
  const [comuna, setComuna] = useState("");
  const [loading, setLoading] = useState(true);
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
          .select("comuna")
          .eq("id", user.id)
          .maybeSingle();
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="perfil-comuna">Comuna</Label>
        <Input
          id="perfil-comuna"
          value={comuna}
          onChange={(e) => setComuna(e.target.value)}
          placeholder="Ej. La Florida, Concepción"
          className="min-h-12"
          required
        />
      </div>
      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar ubicación"}
      </Button>
    </form>
  );
}
