import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOverview } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

function formatFecha(iso: string | null): string {
  if (!iso) return "Sin sincronizaciones";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin sincronizaciones";
  return fecha.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminOverviewPage() {
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

  const { total, gratuitos, funnel, mrr, activos30d, eventos24h, topComunas, ultimaSincronizacion } =
    await getOverview();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">KPIs y salud del producto, agregados en SQL.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total usuarios</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Activos 30d: {activos30d}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MRR</CardDescription>
            <CardTitle className="text-3xl">{formatCLP(mrr.total)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1 text-xs">
            {Object.entries(mrr.byTier).map(([tier, amt]) => (
              <Badge key={tier} variant="secondary">{tier}: {formatCLP(amt as number)}</Badge>
            ))}
            {Object.keys(mrr.byTier).length === 0 ? <span className="text-muted-foreground">Sin suscripciones activas</span> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gratuitos</CardDescription>
            <CardTitle className="text-3xl">{gratuitos}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{total ? Math.round((gratuitos / total) * 100) : 0}% del total</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel suscripciones</CardTitle>
          <CardDescription>pending → trialing → active → canceled / inactive</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Badge>pending {funnel.pending}</Badge>
          <Badge variant="secondary">trialing {funnel.trialing}</Badge>
          <Badge className="bg-emerald-600 text-white">active {funnel.active}</Badge>
          <Badge variant="outline">canceled {funnel.canceled}</Badge>
          <Badge variant="outline">inactive {funnel.inactive}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Salud</CardTitle>
            <CardDescription>Ingesta y sincronización con Mercado Pago</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eventos 24h</span>
              <span>{eventos24h > 0 ? eventos24h : <span className="text-muted-foreground">sin datos en 24h</span>}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última sincronización</span>
              <span>{formatFecha(ultimaSincronizacion)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top comunas</CardTitle>
            <CardDescription>Por cultivos registrados (join perfiles)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {topComunas.length === 0 ? <span className="text-muted-foreground">Sin cultivos aún</span> : topComunas.map((c) => (
              <div key={c.comuna} className="flex justify-between"><span>{c.comuna}</span><span>{c.count}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
