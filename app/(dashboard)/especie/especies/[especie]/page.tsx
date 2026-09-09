import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Leaf, Trees } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BotonLoEche } from "@/components/especie/BotonLoEche";
import { ESPECIES, getZonaIdDeComuna, getZonaDeComuna } from "@/lib/agronomy";
import {
  cosechaTipicaAdulta,
  fenologiaPorEspecie,
  gramosACaseras,
  programaDeEspecie,
  regionGuiaDeRegion,
  tieneFertilizacion,
  type DetallePrograma,
  type ProgramaFertilizacion,
} from "@/lib/agronomy/fertilizacion";
import { createClient } from "@/lib/supabase/server";
import { getArboles, getCultivos, getPerfil } from "@/lib/huerto/data";

export const dynamic = "force-dynamic";

function activosDe(detalle: DetallePrograma[]) {
  return detalle
    .filter((d) => d.gramos_cada_vez != null && d.gramos_cada_vez > 0)
    .map((d) => ({
      nutriente: d.nutriente,
      producto: d.producto,
      gramos: d.gramos_cada_vez,
      caseras: gramosACaseras(d.gramos_cada_vez, d.producto),
    }));
}

/** Meses del momento siguiente al actual (para agendar «Lo eché»). */
function proximosMeses(programa: ProgramaFertilizacion[], orden: number): string | null {
  const siguiente = programa.find((p) => p.orden === orden + 1) ?? programa[0];
  return siguiente?.meses ?? null;
}

/**
 * Ficha de especie (módulo Especies, Propuesta E): etapa actual del mes,
 * programa de fertilización con dosis caseras por región y método de riego,
 * fenología y trazabilidad a la fuente INIA.
 */
export default async function FichaEspecie(props: {
  params: Promise<{ especie: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { especie } = await props.params;
  const base = ESPECIES.find((e) => e.dbKey === especie);
  if (!base) notFound();

  const sp = await props.searchParams;
  const metodo = sp["riego"] === "goteo" ? "goteo" : "suelo";

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

  const programa =
    regionGuia && tieneFertilizacion(especie)
      ? programaDeEspecie(especie, regionGuia, metodo)
      : [];
  const feno = regionGuia
    ? fenologiaPorEspecie(especie).find((f) => f.region_guia === regionGuia)
    : undefined;

  // Árboles propios de esta especie (para el «Lo eché» grupal).
  const propios = arboles.filter((a) => a.especie === especie);
  const cultivoPropio = cultivos.find((c) => c.especie === especie);
  const cosechaTipica = cosechaTipicaAdulta(especie);

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-2.5 py-1">
            <Leaf className="size-3" /> Ficha de especie
          </Badge>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
            {base.nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {regionGuia ?? "sin calibración regional"}
            </Badge>
            <Badge variant="outline" className="rounded-full capitalize">
              riego {metodo}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              dosis para planta adulta
            </Badge>
            {cultivoPropio ? (
              <Badge className="rounded-full">
                <Trees className="size-3" /> {propios.length} {propios.length === 1 ? "ejemplar" : "ejemplares"} en tu huerto
              </Badge>
            ) : null}
          </div>
        </div>
        <Badge variant="outline" className="rounded-full" render={<Link href="/especie/especies" />}>
          ← Todas las fichas
        </Badge>
      </div>

      {/* Programas por momento */}
      <div className="grid gap-4 lg:grid-cols-3">
        {programa.length > 0 ? (
          programa.map((p) => {
            const activos = activosDe(p.detalle);
            return (
              <Card key={`${p.metodo}-${p.orden}`} className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CalendarDays className="size-4 text-primary" /> {p.momento}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Meses: {p.meses} · {p.veces} {p.veces === 1 ? "aplicación" : "aplicaciones"}{" "}
                    ({p.cada_dias} días)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {activos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sin aplicaciones en este momento del año.
                    </p>
                  ) : (
                    activos.map((a) => (
                      <div key={a.nutriente} className="rounded-xl border bg-card px-3 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{a.nutriente}</span>
                          <span className="text-xs text-muted-foreground">
                            {a.producto} · {a.gramos} g cada vez
                          </span>
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-primary">
                          ≈ {a.caseras}
                        </div>
                      </div>
                    ))
                  )}

                  <BotonLoEche
                    especie={especie}
                    nombreEspecie={base.nombre}
                    momento={p.momento}
                    producto={activos[0]?.producto ?? `Programa casero ${p.momento}`}
                    gramos={activos.reduce((acc, a) => acc + (a.gramos ?? 0), 0)}
                    mesesProximoMomento={proximosMeses(programa, p.orden)}
                    arbolesPropios={propios.length}
                  />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="rounded-2xl border-dashed lg:col-span-3">
            <CardContent className="p-5 text-sm text-muted-foreground">
              Sin programa de fertilización casera para {base.nombre}
              {regionGuia ? ` en ${regionGuia}` : " (región sin cobertura de la guía)"}: revisa la
              ficha técnica o configura tu comuna en el perfil.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fenología + trazabilidad */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calendario anual · cuándo le toca</CardTitle>
            <CardDescription className="text-xs">
              Región {regionGuia ?? "sin datos regionales"} — «cada cuánto» según tu método de riego
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-xs">
            {feno ? (
              <ul className="flex flex-col gap-1">
                <li>Brota: {feno.brota ?? "—"}</li>
                <li>Florece: {feno.florece ?? "—"}</li>
                <li>Cosecha: {feno.cosecha ?? "—"}</li>
                <li>Cuando despierta: {feno.m_despierta ?? "—"}</li>
                <li>Cuando engorda la fruta: {feno.m_engorda ?? "—"}</li>
                <li>Cuando se recupera: {feno.m_recupera ?? "—"}</li>
                <li>
                  Veces al año: {feno.veces_suelo ?? "—"} al suelo · {feno.veces_goteo ?? "—"} por goteo
                </li>
                {feno.nota ? <li className="italic">{feno.nota}</li> : null}
              </ul>
            ) : (
              <p className="text-muted-foreground">Sin datos de fenología para tu región.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-muted/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">De dónde salen estos números</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p>
              Guía de Fertilización Casera (XLSX del socio, seed reproducible en Git) — gramos por
              producto para patios y huertos caseros, con ajuste por edad.
            </p>
            <p>
              Base técnica: INIA — Hirzel y Hepp, Boletín INIA N° 426 (cuadros 3.5–3.8); Hirzel,
              Barrera y Ried 2013 (olivo cv. Arbequina); INIA 2014, Libros INIA N° 31.
            </p>
            {cosechaTipica ? (
              <p>
                Dosis de referencia para un {base.nombre.toLowerCase()} adulto con una cosecha típica
                de {cosechaTipica} kg por árbol; ajusta con la cosecha real de tu árbol cuando la
                tengas.
              </p>
            ) : null}
            <Separator className="my-2" />
            <p className="flex gap-1.5">
              <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
              Verifica siempre la etiqueta del envase: cambian entre proveedores y lotes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
