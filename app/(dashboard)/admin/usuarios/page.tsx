import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getZonaDeComuna } from "@/lib/agronomy";
import { UserDetail } from "@/components/admin/UserDetailDrawer";

export const dynamic = "force-dynamic";

interface SearchParams {
  plan?: string;
  comuna?: string;
  email?: string;
  page?: string;
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let q = admin.from("perfiles").select("id, email, nombre, region, comuna, plan, subscription_status, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (params.plan) q = q.eq("plan", params.plan);
  if (params.comuna) q = q.ilike("comuna", `%${params.comuna}%`);
  if (params.email) q = q.ilike("email", `%${params.email}%`);
  const { data, error, count } = await q;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">{total} perfiles · página {page}/{totalPages}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" action="/admin/usuarios" className="grid gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="plan">Plan</Label>
              <Input id="plan" name="plan" placeholder="huertero" defaultValue={params.plan} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="comuna">Comuna</Label>
              <Input id="comuna" name="comuna" placeholder="La Florida" defaultValue={params.comuna} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="buyer@" defaultValue={params.email} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(data ?? []).map((u) => {
            const zona = getZonaDeComuna((u as { comuna: string | null }).comuna);
            return (
              <div key={u.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{u.email}</span>
                  <Badge variant={u.plan === "admin" ? "default" : "secondary"}>{u.plan}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {u.nombre ?? "—"} · {u.region ?? "—"} · {u.comuna ?? "—"} · zona {zona?.nombre ?? "—"} · {u.subscription_status ?? "—"} · {new Date(u.created_at).toLocaleDateString("es-CL")}
                </div>
                <UserDetail userId={u.id} email={u.email} />
              </div>
            );
          })}
          <div className="flex justify-between text-sm">
            <span> {total} totales</span>
            <span>Página {page} de {totalPages}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
