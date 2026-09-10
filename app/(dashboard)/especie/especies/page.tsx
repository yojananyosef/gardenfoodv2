import { Leaf } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ESPECIES,
  MESES,
  getZonaIdDeComuna,
  getZonaDeComuna,
} from "@/lib/agronomy";
import {
  fenologiaPorEspecie,
  regionGuiaDeRegion,
  tieneFertilizacion,
} from "@/lib/agronomy/fertilizacion";
import { IndiceEspecies } from "./IndiceEspecies";
import { createClient } from "@/lib/supabase/server";
import { getArboles, getCultivos, getPerfil } from "@/lib/huerto/data";

export const dynamic = "force-dynamic";

/** Módulo Especies (Propuesta E): tarjetas de especie con el estado del
 *  mes por región y enlace a la ficha con el programa de fertilización. */
export default async function EspeciesIndex() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const [perfil, cultivos, arboles] = await Promise.all([
    getPerfil(user.id),
    getCultivos(user.id),
    getArboles(user.id),
  ]);

  const zonaId = getZonaIdDeComuna(perfil?.comuna ?? undefined);
  const region = zonaId != null ? getZonaDeComuna(perfil?.comuna)?.region ?? null : null;
  const regionGuia = regionGuiaDeRegion(region);
  const porEspecie = new Map<string, number>();
  for (const a of arboles) {
    porEspecie.set(a.especie, (porEspecie.get(a.especie) ?? 0) + a.cantidad);
  }

  const fichas = ESPECIES.filter((e) => tieneFertilizacion(e.dbKey));
  const otras = ESPECIES.filter((e) => !tieneFertilizacion(e.dbKey));
  const enUso = cultivos.map((c) => c.especie);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-2.5 py-1">
          <Leaf className="size-3" /> Especies
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
          Cuidados por especie
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          La guía de fertilización casera del socio (base INIA, Boletín 426) adaptada a tu región:
          qué se aplica en cada estación, en cucharadas y tazas, según tu zona y método de riego.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full">
            {MESES[new Date().getMonth()]}
          </Badge>
          <Badge variant={regionGuia ? "secondary" : "outline"} className="rounded-full">
            {regionGuia ?? `Fuera de la cobertura regional${region ? ` (${region})` : ""}`}
          </Badge>
        </div>
      </div>

      <IndiceEspecies
        fichas={fichas.map((e) => {
          const estado = regionGuia
            ? fenologiaPorEspecie(e.dbKey).find((f) => f.region_guia === regionGuia)
            : undefined;
          return {
            especie: e,
            momentoActual: estado?.se_cultiva === false ? estado.nota ?? null : null,
            cantidad: porEspecie.get(e.dbKey) ?? 0,
          };
        })}
        otras={otras.map((e) => ({ especie: e, cantidad: porEspecie.get(e.dbKey) ?? 0 }))}
        enUso={enUso}
      />
    </div>
  );
}
