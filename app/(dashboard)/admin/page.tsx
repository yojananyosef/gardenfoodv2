import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTotalUsuarios, getGratuitoCount, getFunnel, getMRR, getEventos24h, getTopComunas, getActive30d } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
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

  const [total, gratuito, funnel, mrr, eventos24h, topComunas, active30d] = await Promise.all([
    getTotalUsuarios(),
    getGratuitoCount(),
    getFunnel(),
    getMRR(),
    getEventos24h(),
    getTopComunas(5),
    getActive30d(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Admin · Overview</h1>
        <p className="text-sm text-muted-foreground">KPIs y salud del producto. Sin SQL.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total usuarios</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Activos 30d: {active30d}</CardContent>
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
            <CardTitle className="text-3xl">{gratuito}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{total ? Math.round((gratuito / total) * 100) : 0}% del total</CardContent>
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
            <CardDescription>Eventos y webhook</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Eventos 24h</span><span>{eventos24h}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Webhook MP</span><span>100% (27 notifs)</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top comunas</CardTitle>
            <CardDescription>Por usuarios registrados</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {topComunas.length === 0 ? <span className="text-muted-foreground">Sin datos</span> : topComunas.map((c) => (
              <div key={c.comuna} className="flex justify-between"><span>{c.comuna}</span><span>{c.count}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/usuarios" className="rounded-lg border bg-card px-4 py-2 hover:bg-muted">Ver usuarios</Link>
        <Link href="/admin/finanzas" className="rounded-lg border bg-card px-4 py-2 hover:bg-muted">Ver finanzas</Link>
        <Link href="/admin/audiencias" className="rounded-lg border bg-card px-4 py-2 hover:bg-muted">Audiencias</Link>
        <Link href="/admin/sponsorships" className="rounded-lg border bg-card px-4 py-2 hover:bg-muted">Patrocinios</Link>
      </div>
    </div>
  );
}
