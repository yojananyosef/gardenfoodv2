import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInsights } from "@/lib/admin/insights";
import { InsightsCharts } from "@/components/admin/InsightsCharts";

export const dynamic = "force-dynamic";

function pct(de: number, a: number): string {
  if (de <= 0) return "sin datos";
  return `${Math.round((a / de) * 100)}%`;
}

export default async function AdminInsightsPage() {
  const supabase = await createClient();
  const ok = await isAdmin(supabase);
  if (!ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>Solo administradores.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { funnel, semanas, ctrSlots, intereses } = await getInsights();
  const etapas = [
    { etiqueta: "Visitas 30d", valor: funnel.visitas30d, hint: "dispositivos con page view" },
    { etiqueta: "Registros 30d", valor: funnel.registros30d, hint: "cuentas creadas" },
    { etiqueta: "Trial", valor: funnel.trial, hint: "suscripciones en prueba" },
    { etiqueta: "Pagos activos", valor: funnel.activos, hint: "suscripciones active" },
  ];
  const tasas = [
    pct(funnel.visitas30d, funnel.registros30d),
    pct(funnel.registros30d, funnel.trial),
    pct(funnel.trial, funnel.activos),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Insights</h2>
        <p className="text-sm text-muted-foreground">
          Tendencias para decidir dónde invertir. Agregado en SQL, sin datos fabricados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel de conversión</CardTitle>
          <CardDescription>
            Comparación de etapas (no coorte): visitas y registros son de los últimos 30 días; trial y activos son totales acumulados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {etapas.map((e, i) => (
              <div key={e.etiqueta} className="flex flex-col gap-2">
                {i > 0 ? (
                  <p className="pl-2 text-xs text-muted-foreground">↓ {tasas[i - 1]}</p>
                ) : null}
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{e.etiqueta}</p>
                    <p className="text-xs text-muted-foreground">{e.hint}</p>
                  </div>
                  <p className="font-heading text-2xl font-semibold">
                    {e.valor > 0 ? e.valor : <span className="text-sm text-muted-foreground">sin datos</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InsightsCharts semanas={semanas} ctrSlots={ctrSlots} intereses={intereses} />
    </div>
  );
}
