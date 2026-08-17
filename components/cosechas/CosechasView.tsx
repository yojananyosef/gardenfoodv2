"use client";

import { useOptimistic, useTransition, useState } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { agregarRegistro, eliminarRegistro } from "@/lib/cosechas/actions";
import { calcularLogros, type Logro } from "@/lib/cosechas/logros";
import { getEspeciePorDbKey } from "@/lib/agronomy";
import type { RegistroCosecha } from "@/types";

const NOMBRES: Record<string, string> = {
  duraznero: "Durazno",
  ciruelo: "Ciruela",
  cerezo: "Cereza",
  damasco: "Damasco",
  nectarino: "Nectarín",
  manzano: "Manzana",
  peral: "Pera",
  membrillo: "Membrillo",
  limonero: "Limón",
  naranjo: "Naranja",
  mandarino: "Mandarina",
  pomelo: "Pomelo",
  nogal: "Nogal",
  almendro: "Almendra",
  higuera: "Higo",
  granado: "Granada",
  caqui: "Caqui",
  vid: "Vid",
  arandano: "Arándano",
  olivo: "Olivo",
  frutilla: "Frutilla",
  frambuesa: "Frambuesa",
  mora: "Mora",
  kiwi: "Kiwi",
  "avellano-europeo": "Avellano europeo",
  "nispero-japones": "Níspero japonés",
  chirimoya: "Chirimoya",
  lucuma: "Lúcuma",
  "papayo-chileno": "Papayo chileno",
  palto: "Palto",
};

export function nombreEspecie(especie: string): string {
  return NOMBRES[especie] ?? getEspeciePorDbKey(especie)?.nombre ?? especie;
}

export function Estadisticas({ registros }: { registros: RegistroCosecha[] }) {
  const totalKg = registros.reduce((acc, r) => acc + (r.produccionKg ?? 0), 0);
  const especies = new Set(registros.map((r) => r.especie)).size;
  const logros = calcularLogros(registros).filter((l) => l.unlocked).length;

  const stats = [
    { label: "Registros", valor: registros.length },
    { label: "Producción total", valor: `${Math.round(totalKg * 100) / 100} kg` },
    { label: "Especies", valor: especies },
    { label: "Logros", valor: logros },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="font-fraunces text-xl font-semibold">{s.valor}</div>
        </div>
      ))}
    </div>
  );
}

export function AgregarRegistro({ especies }: { especies: string[] }) {
  const [especie, setEspecie] = useState<string | null>(null);
  const [kg, setKg] = useState("");
  const [nota, setNota] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especie) {
      toast.error("Selecciona una especie.");
      return;
    }
    const produccionKg = kg.trim() === "" ? null : Math.max(0, Number(kg) || 0);
    startTransition(async () => {
      const result = await agregarRegistro({
        especie,
        produccionKg,
        nota: nota.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Cosecha registrada.");
      setEspecie(null);
      setKg("");
      setNota("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="especie-cosecha">Especie</Label>
        <Select value={especie ?? undefined} onValueChange={setEspecie}>
          <SelectTrigger id="especie-cosecha" className="w-full min-h-12">
            <SelectValue placeholder="¿Qué cosechaste?" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {especies.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {nombreEspecie(slug)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="kg">Producción (kg, opcional)</Label>
        <Input
          id="kg"
          type="number"
          min={0}
          step="0.1"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          placeholder="Ej: 12.5"
          className="min-h-12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nota">Nota (opcional)</Label>
        <Input
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej: maduró temprano este año"
          className="min-h-12"
        />
      </div>
      <Button type="submit" className="min-h-12 w-full">
        <Plus className="size-4" aria-hidden />
        Registrar cosecha
      </Button>
    </form>
  );
}

export function Historial({
  registros,
}: {
  registros: RegistroCosecha[];
}) {
  const [optimistic, setOptimistic] = useOptimistic(registros);
  const [, startTransition] = useTransition();

  function handleEliminar(registro: RegistroCosecha) {
    setOptimistic((prev) => prev.filter((r) => r.id !== registro.id));
    startTransition(async () => {
      const result = await eliminarRegistro(registro.id);
      if (result.error) toast.error(result.error);
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no tienes cosechas registradas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {optimistic.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
        >
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{nombreEspecie(r.especie)}</span>
              {r.produccionKg != null ? (
                <span className="text-sm text-muted-foreground">
                  {r.produccionKg} kg
                </span>
              ) : null}
            </div>
            {r.nota ? (
              <p className="text-sm text-muted-foreground">{r.nota}</p>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {new Date(r.fecha).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Eliminar registro"
            className="min-h-12 min-w-12 text-muted-foreground hover:text-destructive"
            onClick={() => handleEliminar(r)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function Logros({ logros }: { logros: Logro[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {logros.map((l) => (
        <div
          key={l.id}
          className={cn(
            "flex flex-col gap-1 rounded-lg border px-4 py-3",
            l.unlocked ? "border-primary/40 bg-card" : "border-muted opacity-60",
          )}
        >
          <Trophy
            className={cn("size-5", l.unlocked ? "text-primary" : "text-muted-foreground")}
            aria-hidden
          />
          <span className="text-sm font-medium">{l.titulo}</span>
          <span className="text-xs text-muted-foreground">{l.descripcion}</span>
        </div>
      ))}
    </div>
  );
}