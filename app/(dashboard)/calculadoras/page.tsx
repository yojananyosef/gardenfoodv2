"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackCommerceIntent } from "@/lib/telemetry/tracker";

export default function CalculadorasPage() {
  const [superficie, setSuperficie] = useState("10");
  const [dosis, setDosis] = useState<string | null>(null);

  function calcular(event: React.FormEvent) {
    event.preventDefault();
    const m2 = Math.max(0, Number(superficie) || 0);
    const resultado = Math.round(m2 * 0.15 * 100) / 100;
    setDosis(`${resultado} kg de fertilizante orgánico`);
    trackCommerceIntent(
      {
        tipo: "fertilizante_organico",
        superficie_m2: m2,
        dosis_kg: resultado,
        marca: "guano_rojo",
      },
      { name: "CALCULATOR_SUBMIT" },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de fertilizante</CardTitle>
          <CardDescription>
            Calcula la dosis recomendada para tu huerto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={calcular} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="superficie">Superficie (m²)</Label>
              <Input
                id="superficie"
                type="number"
                min="0"
                step="0.5"
                value={superficie}
                onChange={(e) => setSuperficie(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="min-h-12 w-full">
              Calcular dosis
            </Button>
          </form>
          {dosis ? (
            <p className="mt-4 text-sm font-medium text-foreground">{dosis}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}