import Link from "next/link";
import { Lock } from "lucide-react";
import {
  AgregarRegistro,
  Estadisticas,
  Historial,
  Logros,
  ProduccionChart,
  DistribucionEspecieChart,
  LogrosChart,
} from "@/components/cosechas/CosechasView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularLogros } from "@/lib/cosechas/logros";
import { ESPECIES } from "@/lib/agronomy";
import { getRegistros } from "@/lib/cosechas/data";
import { isPaidTier } from "@/lib/payments/plans";
import { createClient } from "@/lib/supabase/server";

function UpsellCard({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border-dashed px-6 py-8 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="size-5" aria-hidden />
      </span>
      <CardTitle className="text-base leading-tight">{titulo}</CardTitle>
      <CardDescription className="max-w-xs text-xs leading-relaxed">{descripcion}</CardDescription>
      <Button render={<Link href="/pricing" />}>Ver planes</Button>
    </Card>
  );
}

export default async function CosechasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [registros, perfil] = await Promise.all([
    getRegistros(user.id),
    supabase.from("perfiles").select("plan").eq("id", user.id).maybeSingle(),
  ]);

  const plan = perfil.data?.plan ?? "gratuito";
  const esAdmin = plan === "admin";
  const puedeLogros = isPaidTier(plan) || esAdmin;
  const puedeAnalitica = plan === "cosecha" || plan === "full" || esAdmin;
  const logros = puedeLogros ? calcularLogros(registros) : [];
  const especies = ESPECIES.map((e) => e.dbKey);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Cosechas</h1>
        <p className="text-sm text-muted-foreground">Bitácora de tu producción y logros — ahora visual.</p>
      </div>

      <Estadisticas registros={registros} />

      {puedeAnalitica ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ProduccionChart registros={registros} />
          </div>
          <div className="lg:col-span-4">
            <DistribucionEspecieChart registros={registros} />
          </div>
        </div>
      ) : (
        <UpsellCard
          titulo="Analítica de producción"
          descripcion="Kg por especie, comparativas de temporadas y exportación de registros. Disponible en los planes Cosecha y Full."
        />
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Registrar cosecha</CardTitle>
            <CardDescription>Anota qué produjo tu huerto esta temporada.</CardDescription>
          </CardHeader>
          <CardContent>
            <AgregarRegistro especies={especies} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 lg:col-span-5">
          {puedeLogros ? (
            <>
              <LogrosChart logros={logros} />
              <Card>
                <CardHeader>
                  <CardTitle>Logros</CardTitle>
                </CardHeader>
                <CardContent>
                  <Logros logros={logros} />
                </CardContent>
              </Card>
            </>
          ) : (
            <UpsellCard
              titulo="Logros de cosecha"
              descripcion="Desbloquea medallas por temporadas, especies y volumen cosechado con el plan Huertero."
            />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Historial registros={registros} />
        </CardContent>
      </Card>
    </div>
  );
}
