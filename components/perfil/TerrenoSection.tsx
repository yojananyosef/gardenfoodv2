"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerrenoMap, type HuertoMapa } from "@/components/perfil/TerrenoMap";
import { actualizarHuerto, crearHuerto, eliminarHuerto } from "@/lib/huerto/huertos";
import {
  formatAreaM2,
  formatCoordenadas,
  parseTerrenoFeature,
  terrenoAreaM2,
  terrenoCentro,
  type TerrenoFeature,
} from "@/lib/huerto/terreno";
import { FREE_LIMITS, limitesDe, type PlanAcceso } from "@/lib/payments/plans";

type HuertoItem = HuertoMapa & { superficieM2: number };

export function TerrenoSection() {
  const router = useRouter();
  const [huertos, setHuertos] = useState<HuertoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [limite, setLimite] = useState<number | null>(null);
  const [renombrandoId, setRenombrandoId] = useState<string | null>(null);
  const [nombreBorrador, setNombreBorrador] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const [huertosRes, perfilRes] = await Promise.all([
          supabase
            .from("gf_huertos")
            .select("id, nombre, terreno_geojson, superficie_m2, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
          supabase.from("perfiles").select("plan").eq("id", user.id).maybeSingle(),
        ]);
        if (active) {
          const lista = (huertosRes.data ?? []).flatMap((row) => {
            const feature = parseTerrenoFeature(row.terreno_geojson);
            if (!feature) return [];
            return [
              {
                id: row.id as string,
                nombre: (row.nombre as string) ?? "Mi huerto",
                feature,
                superficieM2: Number(row.superficie_m2 ?? 0),
              },
            ];
          });
          setHuertos(lista);
          const plan = (perfilRes.data?.plan as PlanAcceso | undefined) ?? "gratuito";
          setLimite(limitesDe(plan).huertos);
        }
      }
      if (active) setCargando(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const puedeDibujar = limite === null || huertos.length < limite;

  const huertosRef = useRef(huertos);
  useEffect(() => {
    huertosRef.current = huertos;
  }, [huertos]);

  async function handleCrear(feature: TerrenoFeature): Promise<string | null> {
    const result = await crearHuerto({ feature });
    if (!result.ok) {
      if (result.limite) {
        toast.error(result.error, {
          action: { label: "Ver planes", onClick: () => router.push("/pricing") },
        });
      } else {
        toast.error(result.error);
      }
      return null;
    }
    setHuertos((prev) => [...prev, { ...result.huerto }]);
    toast.success(`"${result.huerto.nombre}" guardado en el mapa.`);
    return result.huerto.id;
  }

  function handleEditar(id: string, feature: TerrenoFeature) {
    const superficieM2 = Math.round(terrenoAreaM2(feature.geometry.coordinates));
    setHuertos((prev) =>
      prev.map((h) => (h.id === id ? { ...h, feature, superficieM2 } : h)),
    );
    void (async () => {
      const result = await actualizarHuerto(id, { feature });
      if (!result.ok) toast.error(result.error);
    })();
  }

  async function handleEliminar(id: string): Promise<boolean> {
    const huerto = huertosRef.current.find((h) => h.id === id);
    if (!huerto) return false;
    if (
      !window.confirm(
        `¿Eliminar "${huerto.nombre}" del mapa? Se borrará el polígono guardado.`,
      )
    ) {
      return false;
    }
    const result = await eliminarHuerto(id);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setHuertos((prev) => prev.filter((h) => h.id !== id));
    toast.success("Huerto eliminado.");
    return true;
  }

  function handleLimite() {
    toast.error(
      `Llegaste al límite de ${FREE_LIMITS.huertos} huerto del plan gratuito. Pásate a Huertero para delimitar todos tus huertos.`,
      {
        action: { label: "Ver planes", onClick: () => router.push("/pricing") },
      },
    );
  }

  function iniciarRenombre(huerto: HuertoItem) {
    setRenombrandoId(huerto.id);
    setNombreBorrador(huerto.nombre);
  }

  function guardarNombre(id: string) {
    const nombre = nombreBorrador.trim();
    setRenombrandoId(null);
    const actual = huertos.find((h) => h.id === id);
    if (!nombre || !actual || nombre === actual.nombre) return;
    void (async () => {
      const result = await actualizarHuerto(id, { nombre });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHuertos((prev) => prev.map((h) => (h.id === id ? { ...h, nombre } : h)));
      toast.success("Nombre actualizado.");
    })();
  }

  async function copiarCoordenadas(huerto: HuertoItem) {
    const texto = formatCoordenadas(
      terrenoCentro(huerto.feature.geometry.coordinates),
    );
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(huerto.id);
      window.setTimeout(() => setCopiadoId(null), 1500);
    } catch {
      toast.error("No se pudieron copiar las coordenadas.");
    }
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TerrenoMap
        huertosIniciales={huertos}
        puedeDibujar={puedeDibujar}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onLimite={handleLimite}
      />
      {huertos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no delimitas ningún huerto. Activa el ícono de polígono en el mapa
          y toca las esquinas de tu terreno para calcular su superficie.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {huertos.map((huerto) => (
            <li
              key={huerto.id}
              className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                {renombrandoId === huerto.id ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      guardarNombre(huerto.id);
                    }}
                  >
                    <Input
                      value={nombreBorrador}
                      onChange={(e) => setNombreBorrador(e.target.value)}
                      maxLength={60}
                      autoFocus
                      aria-label="Nombre del huerto"
                      className="min-h-9"
                    />
                    <Button type="submit" variant="outline" size="icon" className="min-h-9 min-w-9" aria-label="Guardar nombre">
                      <Check className="size-4" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className="text-sm font-medium">{huerto.nombre}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-9 min-w-9 text-muted-foreground hover:text-foreground"
                      aria-label={`Renombrar ${huerto.nombre}`}
                      onClick={() => iniciarRenombre(huerto)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatAreaM2(huerto.superficieM2)}
                </span>
                <span className="font-mono">
                  {formatCoordenadas(terrenoCentro(huerto.feature.geometry.coordinates))}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-7 gap-1 px-2 text-xs"
                  onClick={() => copiarCoordenadas(huerto)}
                >
                  {copiadoId === huerto.id ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copiadoId === huerto.id ? "Copiadas" : "Copiar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
