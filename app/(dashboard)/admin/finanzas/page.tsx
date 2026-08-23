import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSubscriptionsGrouped, getMRRByTier } from "@/lib/admin/finanzas";

export const dynamic = "force-dynamic";

function formatCLP(n: number) { return `$${n.toLocaleString("es-CL")}`; }

export default async function AdminFinanzasPage({ searchParams }: { searchParams: Promise<{ status?: string; plan?: string }> }) {
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return <Card><CardHeader><CardTitle>Acceso denegado</CardTitle></CardHeader></Card>;
  }
  const params = await searchParams;
  const { rows } = await getSubscriptionsGrouped(params.status, params.plan, 20, 0);
  const { total, byTier } = await getMRRByTier();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Finanzas</h1>
        <p className="text-sm text-muted-foreground">MRR {formatCLP(total)} · suscripciones por plan/estado</p>
      </div>
      <Card>
        <CardHeader><CardTitle>MRR por tier</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(byTier).map(([tier, v]) => (
            <Badge key={tier} variant="secondary">{tier}: {v.count} × {formatCLP(v.mrr)}</Badge>
          ))}
          {Object.keys(byTier).length===0 ? <span className="text-sm text-muted-foreground">Sin activas</span> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Suscripciones</CardTitle><CardDescription>{rows.length} recientes {params.status ? `· ${params.status}` : ""} {params.plan ? `· ${params.plan}` : ""}</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
              <div className="flex justify-between"><span>{r.plan} {r.interval}</span><Badge>{r.status}</Badge></div>
              <div className="text-xs text-muted-foreground">{r.user_id.slice(0,8)} · {new Date(r.created_at).toLocaleDateString("es-CL")}</div>
              {r.provider_subscription_id ? <a href={`https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=${r.provider_subscription_id}&activation=true`} target="_blank" rel="noopener" className="text-xs text-primary underline">MP {r.provider_subscription_id.slice(0,8)}</a> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
