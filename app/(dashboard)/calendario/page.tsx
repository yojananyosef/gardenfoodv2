import { CalendarioView, type Sugerencia } from "@/components/calendario/CalendarioView";
import { getCultivos, getTareasDelMes } from "@/lib/huerto/data";
import { getEspeciePorDbKey, getTareasDelMes as getTareasAgronomicasDelMes } from "@/lib/agronomy";
import { MESES } from "@/lib/fechas";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const anio = now.getFullYear();
  const mes = now.getMonth() + 1;
  const mesISO = String(mes).padStart(2, "0");

  const [tareas, cultivos] = await Promise.all([
    getTareasDelMes(user.id, mesISO, anio),
    getCultivos(user.id),
  ]);

  const sugerencias: Sugerencia[] = [];
  for (const cultivo of cultivos) {
    const especie = getEspeciePorDbKey(cultivo.especie);
    if (!especie) continue;
    const tareasAgro = getTareasAgronomicasDelMes(especie.dbKey, MESES[mes - 1]);
    for (const t of tareasAgro) {
      sugerencias.push({
        dbKey: especie.dbKey,
        tipo: t.tipo,
        descripcion: t.descripcion,
        mes: MESES[mes - 1],
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-fraunces text-2xl font-semibold">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          Tareas programadas y sugerencias agronómicas.
        </p>
      </div>
      <CalendarioView
        tareasMes={tareas}
        sugerencias={sugerencias}
        anioInicial={anio}
        mesInicial={mes - 1}
      />
    </div>
  );
}