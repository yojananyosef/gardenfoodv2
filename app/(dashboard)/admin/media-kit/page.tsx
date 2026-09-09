import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { getMediaKit } from "@/lib/admin/mediakit";
import { MediaKitExport } from "@/components/admin/MediaKitExport";

export const dynamic = "force-dynamic";

function TablaKit({ titulo, segmentos }: { titulo: string; segmentos: { etiqueta: string; total: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {segmentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin segmentos sobre el umbral k≥50</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {segmentos.map((s) => (
              <li key={s.etiqueta} className="flex justify-between border-b py-1.5 last:border-0">
                <span>{s.etiqueta}</span>
                <span className="font-medium">{s.total}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminMediaKitPage() {
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

  const kit = await getMediaKit();
  const total =
    kit.porSegmento.length + kit.porTier.length + kit.porEspecie.length + kit.porRegion.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Media kit</h2>
        <p className="text-sm text-muted-foreground">
          Segmentos comercializables con k-anonymity ≥{kit.kMinimo}: solo conteos agregados,
          nunca datos individuales. Los conteos incluyen únicamente titulares con la
          elección «Compartir con socios comerciales» vigente.
        </p>
      </div>

      {total === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no hay segmentos publicables (k≥{kit.kMinimo})</CardTitle>
            <CardDescription>
              Con la audiencia actual ningún segmento alcanza el mínimo de {kit.kMinimo} usuarios.
              El export está deshabilitado: no se comercializan estadísticas con menos de {kit.kMinimo}{" "}
              personas por grupo.
              {kit.bajoUmbral > 0 ? ` ${kit.bajoUmbral} segmentos quedaron bajo el umbral.` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <MediaKitExport data={kit} />
            {kit.bajoUmbral > 0 ? (
              <Badge variant="outline">{kit.bajoUmbral} segmentos omitidos por k-anonymity</Badge>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TablaKit titulo="Segmento comercial" segmentos={kit.porSegmento} />
            <TablaKit titulo="Poder adquisitivo" segmentos={kit.porTier} />
            <TablaKit titulo="Especie de interés" segmentos={kit.porEspecie} />
            <TablaKit titulo="Región" segmentos={kit.porRegion} />
          </div>
        </>
      )}

      <Card>
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            El modelo clean-room (Fase 5) vende <strong>entrega de publicidad contra un
            segmento</strong>, no datos: la marca nunca recibe identidades ni listas de usuarios.
            Estos conteos provienen solo de telemetría con consentimiento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
