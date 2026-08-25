import {
  AgregarRegistro,
  Estadisticas,
  Historial,
  Logros,
  ProduccionChart,
  DistribucionEspecieChart,
  LogrosChart,
} from "@/components/cosechas/CosechasView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularLogros } from "@/lib/cosechas/logros";
import { ESPECIES } from "@/lib/agronomy";
import { getRegistros } from "@/lib/cosechas/data";
import { createClient } from "@/lib/supabase/server";

export default async function CosechasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const registros = await getRegistros(user.id);
  const logros = calcularLogros(registros);
  const especies = ESPECIES.map((e) => e.dbKey);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Cosechas</h1>
        <p className="text-sm text-muted-foreground">Bitácora de tu producción y logros — ahora visual.</p>
      </div>

      <Estadisticas registros={registros} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ProduccionChart registros={registros} />
        </div>
        <div className="lg:col-span-4">
          <DistribucionEspecieChart registros={registros} />
        </div>
      </div>

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
          <LogrosChart logros={logros} />
          <Card>
            <CardHeader>
              <CardTitle>Logros</CardTitle>
            </CardHeader>
            <CardContent>
              <Logros logros={logros} />
            </CardContent>
          </Card>
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