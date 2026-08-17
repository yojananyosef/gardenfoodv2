"use client";

import { useEffect, useState } from "react";
import { Droplets, Leaf, Ruler, PiggyBank, Search } from "lucide-react";
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
import { ESPECIES, getGrupoDistancia } from "@/lib/agronomy";
import { diagnosticar, SINTOMAS } from "@/lib/agronomy/diagnostico";

const CALCULADORAS = [
  { id: "riego", l: "Riego", icon: Droplets },
  { id: "fert", l: "Fertilización", icon: Leaf },
  { id: "plantas", l: "N° de plantas", icon: Ruler },
  { id: "rentabilidad", l: "Rentabilidad", icon: PiggyBank },
] as const;

type CalcId = (typeof CALCULADORAS)[number]["id"];

const fmt = (n: number) => n.toLocaleString("es-CL");

function Campo({
  id,
  label,
  valor,
  onChange,
}: {
  id: string;
  label: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={valor === 0 ? "" : valor}
        placeholder="0"
        className="min-h-12"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </div>
  );
}

function Resultado({
  label,
  valor,
  className,
}: {
  label: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("font-fraunces text-lg font-semibold", className)}>{valor}</div>
    </div>
  );
}

function CalcRiego() {
  const [sup, setSup] = useState(20);
  const [litros, setLitros] = useState(4);
  const [freq, setFreq] = useState(2);
  return (
    <div className="flex flex-col gap-3">
      <Campo id="riegoSup" label="Superficie a regar (m²)" valor={sup} onChange={setSup} />
      <Campo id="riegoLitros" label="Litros por m² por riego" valor={litros} onChange={setLitros} />
      <Campo id="riegoFreq" label="Riegos por semana" valor={freq} onChange={setFreq} />
      <Resultado label="Agua por riego" valor={`${fmt(sup * litros)} L`} />
      <Resultado label="Agua por semana" valor={`${fmt(sup * litros * freq)} L`} />
    </div>
  );
}

function CalcFert({ onResult }: { onResult?: (totalKg: number) => void }) {
  const [plantas, setPlantas] = useState(5);
  const [gramos, setGramos] = useState(150);
  const totalKg = (plantas * gramos) / 1000;
  useEffect(() => {
    onResult?.(totalKg);
  }, [totalKg, onResult]);
  return (
    <div className="flex flex-col gap-3">
      <Campo id="fertPlantas" label="N° de plantas" valor={plantas} onChange={setPlantas} />
      <Campo id="fertGramos" label="Gramos de fertilizante por planta" valor={gramos} onChange={setGramos} />
      <Resultado label="Total por aplicación" valor={`${fmt(totalKg)} kg`} />
      <p className="text-xs text-muted-foreground">
        Dosis referencial general. Consulta la ficha técnica de cada especie en el catálogo para dosis específicas por etapa.
      </p>
    </div>
  );
}

function CalcPlantas() {
  const [dbKey, setDbKey] = useState(ESPECIES[0].dbKey);
  const [espacio, setEspacio] = useState(50);
  const grupo = getGrupoDistancia(dbKey);
  const dist = grupo?.dist ?? "—";
  const n = Math.max(1, Math.round(espacio * ((grupo?.porM2 ?? 0.1) || 0.1)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="plantasEspecie">Especie</Label>
        <Select value={dbKey} onValueChange={(v) => v && setDbKey(v)}>
          <SelectTrigger id="plantasEspecie" className="w-full min-h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {ESPECIES.map((e) => (
              <SelectItem key={e.dbKey} value={e.dbKey}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Campo id="plantasEspacio" label="Espacio disponible (m²)" valor={espacio} onChange={setEspacio} />
      <p className="text-sm text-muted-foreground">
        Distancia sugerida: <strong>{dist}</strong>
      </p>
      <Resultado label="Plantas estimadas" valor={`${n} unidades`} />
    </div>
  );
}

function CalcRentabilidad() {
  const [kg, setKg] = useState(200);
  const [precio, setPrecio] = useState(1200);
  const [costos, setCostos] = useState(80000);
  const ingreso = kg * precio;
  const utilidad = ingreso - costos;
  return (
    <div className="flex flex-col gap-3">
      <Campo id="rentKg" label="Producción total (kg)" valor={kg} onChange={setKg} />
      <Campo id="rentPrecio" label="Precio de venta por kg ($)" valor={precio} onChange={setPrecio} />
      <Campo id="rentCostos" label="Costos de temporada ($)" valor={costos} onChange={setCostos} />
      <Resultado label="Ingreso estimado" valor={`$${fmt(ingreso)}`} />
      <Resultado
        label="Utilidad estimada"
        valor={`$${fmt(utilidad)}`}
        className={utilidad >= 0 ? "text-primary" : "text-destructive"}
      />
    </div>
  );
}

export function Calculadoras({ onFertResult }: { onFertResult?: (totalKg: number) => void }) {
  const [activa, setActiva] = useState<CalcId>("riego");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CALCULADORAS.map((c) => {
          const Icon = c.icon;
          return (
            <Button
              key={c.id}
              type="button"
              variant={activa === c.id ? "default" : "outline"}
              size="sm"
              className="min-h-12"
              onClick={() => setActiva(c.id)}
            >
              <Icon className="size-4" aria-hidden />
              {c.l}
            </Button>
          );
        })}
      </div>
      {activa === "riego" && <CalcRiego />}
      {activa === "fert" && <CalcFert onResult={onFertResult} />}
      {activa === "plantas" && <CalcPlantas />}
      {activa === "rentabilidad" && <CalcRentabilidad />}
    </div>
  );
}

export function Diagnostico() {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [resultados, setResultados] = useState<ReturnType<typeof diagnosticar>>([]);

  function toggle(id: string) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function analizar() {
    if (seleccionados.length === 0) return;
    setResultados(diagnosticar(seleccionados as Parameters<typeof diagnosticar>[0]));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Selecciona los síntomas que observas en tu cultivo.
      </p>
      <div className="flex flex-wrap gap-2">
        {SINTOMAS.map((s) => {
          const activo = seleccionados.includes(s.id);
          return (
            <Button
              key={s.id}
              type="button"
              variant={activo ? "default" : "outline"}
              size="sm"
              className="min-h-12"
              onClick={() => toggle(s.id)}
            >
              {s.l}
            </Button>
          );
        })}
      </div>
      <Button
        type="button"
        className="min-h-12"
        disabled={seleccionados.length === 0}
        onClick={analizar}
      >
        <Search className="size-4" aria-hidden />
        Analizar síntomas ({seleccionados.length})
      </Button>

      {resultados.length === 0 ? (
        seleccionados.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            No encontramos coincidencias claras en la biblioteca para esos síntomas. Te recomendamos consultar con un especialista local.
          </p>
        ) : null
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Posibles causas encontradas</h3>
          {resultados.map((r, i) => (
            <div key={i} className="rounded-lg border bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">
                  {r.especie} · {r.plaga}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    r.gravedad === "Media-Alta"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {r.gravedad}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{r.sintoma}</p>
              <p className="text-sm text-primary">
                Primera acción (orgánica): {r.accionOrganica}
              </p>
              <a href={`/especies/${r.slug}`} className="text-sm font-semibold text-primary">
                Ver ficha completa →
              </a>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            * Diagnóstico referencial basado en la biblioteca técnica, no reemplaza la evaluación de un agrónomo.
          </p>
        </div>
      )}
    </div>
  );
}