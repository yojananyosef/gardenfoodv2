"use client";

import { Calculadoras, Diagnostico } from "@/components/calculadoras/CalculadorasView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackCommerceIntent } from "@/lib/telemetry/tracker";

export default function CalculadorasPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Calculadoras</h1>
        <p className="text-sm text-muted-foreground">
          Herramientas prácticas para planificar tu huerto. Funcionan sin necesidad de iniciar sesión.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculadoras agronómicas</CardTitle>
          <CardDescription>
            Riego, fertilización, densidad de plantación y rentabilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calculadoras
            onFertResult={(totalKg) =>
              trackCommerceIntent(
                { tipo: "fertilizante_organico", dosis_kg: totalKg },
                { name: "CALCULATOR_SUBMIT" },
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico fitosanitario</CardTitle>
          <CardDescription>
            Identifica posibles plagas y enfermedades según los síntomas observados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Diagnostico />
        </CardContent>
      </Card>
    </div>
  );
}