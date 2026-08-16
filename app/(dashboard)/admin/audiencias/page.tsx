import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

interface SearchParams {
  segment?: string;
  tier?: string;
  phenology?: string;
  crop?: string;
  region?: string;
  comuna?: string;
}

interface AudienceRow {
  id: string;
  commercial_segments: string[];
  purchasing_power_tier: string | null;
  last_active_phenology_stage: string | null;
  primary_interest_crop: string | null;
  total_ad_impressions: number;
  total_ad_clicks: number;
  perfiles: { region: string; comuna: string } | null;
}

const SEGMENT_OPTIONS = [
  "comprador_fertilizantes_bio",
  "busca_fertilizante_organico",
  "interes_citricos",
  "alta_atencion_fichas",
  "huerto_comercial",
];

const TIER_OPTIONS = ["low", "medium", "high", "commercial"];

export default async function AdminAudienciasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const isAdminUser = await isAdmin(supabase);
  if (!isAdminUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>
            Esta sección es exclusiva para administradores.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const params = await searchParams;

  let query = supabase
    .from("gf_user_audiences")
    .select("*, perfiles(region, comuna)")
    .order("total_ad_impressions", { ascending: false })
    .limit(200);

  if (params.segment) query = query.contains("commercial_segments", [params.segment]);
  if (params.tier) query = query.eq("purchasing_power_tier", params.tier);
  if (params.phenology) query = query.eq("last_active_phenology_stage", params.phenology);
  if (params.crop) query = query.eq("primary_interest_crop", params.crop);
  if (params.region) query = query.eq("perfiles.region", params.region);
  if (params.comuna) query = query.eq("perfiles.comuna", params.comuna);

  const { data, error } = await query;

  const href = (key: string, value: string | undefined) => {
    const next: Record<string, string | undefined> = { ...params, [key]: value };
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== "") search.set(k, v);
    }
    const queryString = search.toString();
    return `/admin/audiencias${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Explorador de audiencias</CardTitle>
          <CardDescription>
            Cohortes comerciales B2B derivadas de telemetría con consentimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" action="/admin/audiencias" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="segment">Segmento comercial</Label>
              <Select name="segment" defaultValue={params.segment}>
                <SelectTrigger id="segment" className="w-full">
                  <SelectValue placeholder="Todos los segmentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SEGMENT_OPTIONS.map((segment) => (
                      <SelectItem key={segment} value={segment}>
                        {segment}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tier">Nivel de poder adquisitivo</Label>
              <Select name="tier" defaultValue={params.tier}>
                <SelectTrigger id="tier" className="w-full">
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIER_OPTIONS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="region">Región</Label>
                <Input id="region" name="region" defaultValue={params.region} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="comuna">Comuna</Label>
                <Input id="comuna" name="comuna" defaultValue={params.comuna} />
              </div>
            </div>
            <Button type="submit" className="min-h-11 w-full">
              Filtrar cohortes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohortes</CardTitle>
          <CardDescription>
            {data?.length ?? 0} perfiles con los filtros actuales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error?.message}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {((data ?? []) as AudienceRow[]).map((audience) => (
                <li key={audience.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{audience.purchasing_power_tier ?? "—"}</Badge>
                    {audience.primary_interest_crop ? (
                      <Badge variant="outline">{audience.primary_interest_crop}</Badge>
                    ) : null}
                    {audience.last_active_phenology_stage ? (
                      <Badge variant="outline">{audience.last_active_phenology_stage}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {audience.perfiles?.region ?? "Región desconocida"} ·{" "}
                    {audience.perfiles?.comuna ?? "Comuna desconocida"} ·{" "}
                    {audience.total_ad_impressions} impresiones ·{" "}
                    {audience.total_ad_clicks} clics
                  </p>
                  {audience.commercial_segments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {audience.commercial_segments.map((segment) => (
                        <a key={segment} href={href("segment", segment)}>
                          <Badge variant="outline" className="hover:bg-accent">
                            {segment}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}