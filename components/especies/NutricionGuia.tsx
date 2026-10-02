/**
 * Tab «Nutrición» de la ficha de especie, en modo visual.
 *
 * Reemplaza la lista técnica de «Ene-Feb · Compost + salitre · 5 kg + 200 g»
 * por los dos materiales del prototipo del socio:
 *
 *   1. CALENDARIO DE 12 MESES — dónde está cada momento del año, de un vistazo.
 *   2. LA DOSIS DIBUJADA — cucharadas y tazas en vez de gramos.
 *
 * La fuente es el programa de fertilización casera (INIA, vía el xlsx del
 * socio) que ya vive en lib/agronomy/fertilizacion.ts y que esta tab no
 * usaba. Sigue el mismo patrón que TabRiego: gráfico/visual primero, panel de
 * ajuste al usuario (región · edad · método de riego), y el ajuste a la vista
 * con la referencia «base» al lado.
 *
 * Cuando la guía no cubre la especie en la región elegida se dice con todas
 * las letras y se ofrece cambiar de región, en vez de inventar un dato.
 */
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Droplets, Leaf, MapPinned, TreeDeciduous } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CaserasVisual } from "@/components/especies/IlustracionesCaseras";
import { cn } from "@/lib/utils";
import { ZONAS } from "@/lib/agronomy";
import {
  EDADES_GUIA,
  FACTORES_EDAD,
  MESES_GUIA,
  METODOS_GUIA,
  REPOSO_MOMENTO,
  guiaRegional,
  medidaCasera,
  regionesGuia,
  regionGuiaDeRegion,
  textoGramos,
  type GuiaRegional,
  type MedidaCasera,
  type MetodoGuia,
  type MomentoGuia,
  type RangoEdad,
} from "@/lib/agronomy/fertilizacion";

/**
 * Un color por momento. Clases LITERALES de Tailwind a propósito: si se
 * armaran con interpolación el scanner de Tailwind v4 no las encuentra y las
 * círculos del calendario salen sin pintar.
 *   0 despierta → lima · 1 engorda → verde de marca · 2 se recupera → morado
 */
const TEMA_MOMENTO = [
  {
    punto: "bg-lime-500",
    anillo: "ring-lime-500/30",
    barra: "bg-lime-500",
    tinta: "text-lime-700 dark:text-lime-400",
  },
  {
    punto: "bg-primary",
    anillo: "ring-primary/30",
    barra: "bg-primary",
    tinta: "text-primary",
  },
  {
    punto: "bg-purple-600",
    anillo: "ring-purple-600/30",
    barra: "bg-purple-600",
    tinta: "text-purple-700 dark:text-purple-400",
  },
] as const;

const SIN_APLICAR = {
  punto: "bg-muted",
  anillo: "ring-border",
} as const;

const NOMBRE_LARGO: Record<string, string> = {
  Ene: "Enero", Feb: "Febrero", Mar: "Marzo", Abr: "Abril", May: "Mayo", Jun: "Junio",
  Jul: "Julio", Ago: "Agosto", Sep: "Septiembre", Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre",
};

/* ══════════════════════════════════════════════════════════════════
   MATERIAL 1 — CALENDARIO DE 12 MESES
   ══════════════════════════════════════════════════════════════════ */

function CalendarioMeses({
  guia,
  region,
}: {
  guia: GuiaRegional;
  region: string;
}) {
  const mesActual = new Date().getMonth() + 1;
  const porMes = guia.metodo === "goteo" ? 2 : 1;

  /** Momento(s) que tocan este mes. Puede ser más de uno: el mes de traspaso. */
  const momentosDe = (mes: number) => guia.momentos.filter((m) => m.meses.includes(mes));

  const nombreDe = (mes: number) => {
    const largo = NOMBRE_LARGO[MESES_GUIA[mes - 1]];
    const lista = momentosDe(mes);
    if (!lista.length) return `${largo}: no se abona`;
    const t = lista.map((m) => m.titulo.toLowerCase());
    const texto = t.length === 1 ? t[0] : `${t.slice(0, -1).join(", ")} y ${t[t.length - 1]}`;
    const extra = lista.length > 1 ? " — este mes cambia de momento" : "";
    return `${largo}: ${texto}${extra}`;
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
      <CardHeader className="gap-1 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1 rounded-full">
            <CalendarDays className="size-3" /> Los meses en que le toca
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{region}</span>
        </div>
        <CardTitle className="text-base leading-tight">
          {guia.totalAplicaciones} {guia.totalAplicaciones === 1 ? "vez" : "veces"} al año —{" "}
          {porMes === 1 ? "una vez al mes" : "dos veces al mes"}, solo en los meses de color
        </CardTitle>
        <CardDescription className="text-xs">
          Las cantidades reponen lo que el árbol se lleva en una temporada, para un{" "}
          <span className="font-medium text-foreground">árbol adulto en suelo franco</span>. Cambia la
          región y la edad más abajo y se recalcula.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {/* 6 columnas en escritorio, 4 en móvil: con 6 a 390 px cada círculo
            queda en ~48 px y el número ya no se lee. */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {MESES_GUIA.map((abrev, i) => {
            const mes = i + 1;
            const orden = guia.calendario[i];
            const tema = orden === null ? SIN_APLICAR : TEMA_MOMENTO[orden];
            const esActual = mes === mesActual;
            return (
              <div key={abrev} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex aspect-square w-full max-w-[70px] flex-col items-center justify-center rounded-full border-2 border-transparent",
                    tema.punto,
                    esActual && "ring-2 ring-offset-2 ring-offset-background",
                    esActual && tema.anillo,
                  )}
                  title={nombreDe(mes)}
                  aria-label={nombreDe(mes)}
                  role="img"
                >
                  {orden !== null && (
                    <>
                      <span className="text-lg font-bold leading-none text-white">{porMes}</span>
                      <span className="text-[10px] font-semibold leading-tight text-white/90">
                        {porMes === 1 ? "vez" : "veces"}
                      </span>
                    </>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    orden === null ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {abrev}
                </span>
              </div>
            );
          })}
        </div>

        {/* Leyenda: sin esto los tres colores son decorativos. */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          {guia.momentos.map((m) => (
            <span key={m.orden} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", TEMA_MOMENTO[m.orden].barra)} aria-hidden />
              <span className="text-muted-foreground">{m.titulo}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full border border-border", SIN_APLICAR.punto)} aria-hidden />
            <span className="text-muted-foreground">No se hace nada</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MATERIAL 2 — LA DOSIS DIBUJADA (cucharas y tazas)
   ══════════════════════════════════════════════════════════════════ */

function FilaProducto({
  nombre,
  producto,
  gramos,
  medida,
  veces,
  factorEdad,
  tema,
  esBase,
}: {
  nombre: string;
  producto: string | null;
  gramos: number;
  medida: MedidaCasera;
  veces: number;
  factorEdad: number;
  tema: (typeof TEMA_MOMENTO)[number];
  esBase: boolean;
}) {
  const ajustado = gramos * factorEdad;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-sm font-semibold leading-tight">{producto ?? nombre}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {textoGramos(ajustado)} cada vez
          {veces > 1 && ` · ${veces} veces en el momento`}
        </p>
        {/* El nombre comercial no siempre dice qué aporta («Sulpomag» es
            magnesio, «Urea» es nitrógeno), así que el nutriente se aclara
            aparte. Solo cuando el nombre NO lo dice ya: «Nitrato de calcio ·
            aporta calcio» es ruido. */}
        {producto && !producto.toLowerCase().includes(nombre.toLowerCase()) && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">Aporta {nombre.toLowerCase()}</p>
        )}
        {esBase && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Base árbol adulto: {textoGramos(gramos)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-xl bg-muted/60 px-2.5 py-2 text-muted-foreground",
            tema.tinta,
          )}
        >
          <CaserasVisual medida={medida} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-xl font-bold leading-none", tema.tinta)}>
            {medida.unidad === "pesa"
              ? textoGramos(ajustado).split(" ")[0]
              : String(medida.valor).replace(".", ",")}
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{medida.texto}</p>
        </div>
      </div>
    </div>
  );
}

function BloqueMomento({
  momento,
  factorEdad,
}: {
  momento: MomentoGuia;
  factorEdad: number;
}) {
  const tema = TEMA_MOMENTO[momento.orden];

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      {/* Cabecera a color: el número + el color son el mismo código que el
          calendario, así que el usuario ya sabe dónde está antes de leer. */}
      <div className={cn("flex items-center gap-3 px-4 py-3", tema.punto)}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg font-bold text-white">
          {momento.orden + 1}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-white">{momento.titulo}</p>
          <p className="text-xs font-medium text-white/90">{momento.mesesTexto}</p>
        </div>
      </div>
      <CardContent className="flex flex-col gap-3 pt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{momento.proposito}</p>
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {momento.veces} {momento.veces === 1 ? "aplicación" : "aplicaciones"}
          </span>{" "}
          en este momento, una cada ~{momento.cadaDias} días.
        </div>
        {momento.productos.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{REPOSO_MOMENTO}</p>
        ) : (
          <div>
            {momento.productos.map((p) => (
              <FilaProducto
                key={p.nutriente}
                nombre={p.nutriente}
                producto={p.producto}
                gramos={p.gramos}
                medida={medidaCasera(p.gramos * factorEdad, p.producto)}
                veces={p.veces}
                factorEdad={factorEdad}
                tema={tema}
                esBase={factorEdad !== 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PANEL DE AJUSTE — región · edad · método (mismo patrón que TabRiego)
   ══════════════════════════════════════════════════════════════════ */

function PanelAjuste({
  region,
  onRegion,
  edad,
  onEdad,
  metodo,
  onMetodo,
  ajestado,
}: {
  region: string;
  onRegion: (v: string) => void;
  edad: RangoEdad;
  onEdad: (v: RangoEdad) => void;
  metodo: MetodoGuia;
  onMetodo: (v: MetodoGuia) => void;
  ajestado: boolean;
}) {
  const factor = FACTORES_EDAD[edad];
  const meta = EDADES_GUIA.find((e) => e.id === edad);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="nut-region">Tu zona</Label>
          <Select value={region} onValueChange={(v) => v && onRegion(v)}>
            <SelectTrigger id="nut-region" className="min-h-11 w-full">
              {/* Sin hijos, Base UI cae al valor crudo y el trigger pintaba
                  la clave de la región en vez del nombre. */}
              <SelectValue>{region}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {regionesGuia().map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="nut-edad">Qué tan grande está</Label>
          <Select value={edad} onValueChange={(v) => v && onEdad(v as RangoEdad)}>
            <SelectTrigger id="nut-edad" className="min-h-11 w-full">
              <SelectValue>{meta?.nombre ?? "Elige la edad"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDADES_GUIA.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre} · {e.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cómo le das el agua</Label>
        {/* Dos opciones: un Select de dos ítems es más pesado que dos
            botones, y aquí elegir es un gesto de un toque. */}
        <div className="grid grid-cols-2 gap-2">
          {METODOS_GUIA.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metodo === m.id}
              onClick={() => onMetodo(m.id)}
              className={cn(
                "flex min-h-11 flex-col items-start justify-center gap-0.5 rounded-xl border-2 px-3 py-2 text-left transition-colors",
                metodo === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {m.id === "goteo" ? (
                  <Droplets className="size-4 text-primary" />
                ) : (
                  <TreeDeciduous className="size-4 text-primary" />
                )}
                {m.nombre}
              </span>
              <span className="text-[11px] text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm sm:flex-row sm:gap-4">
        <span className="inline-flex items-start gap-1.5 font-semibold">
          <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
          Ajustado a tu {meta?.nombre.toLowerCase() ?? "árbol"} (×
          {String(factor).replace(".", ",")})
        </span>
        <span className="text-xs text-muted-foreground">
          {ajestado
            ? "Región y árbol salen de tu perfil."
            : "Sin comuna en tu perfil, mostramos la región central."}{" "}
          <Link href="/perfil" className="underline underline-offset-2">
            cambiar en tu perfil
          </Link>
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AVISOS DE LA REGIÓN
   ══════════════════════════════════════════════════════════════════ */

/**
 * Aviso de la región, en ámbar. NO se clasifica por gravedad a propósito: cuando la
 * guía dice «no prospera» no hay programa y esta caja no se llega a ver (la
 * ficha cae en el estado vacío). Lo que llega aquí es el caso «zona justa /
 * límite», que en el xlsx siempre viene con dosis calibradas pero con una
 * advertencia — y la advertencia ya trae su propia gravedad en el texto.
 */
function AvisoRegion({ nota }: { nota: string | null }) {
  if (!nota) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="leading-relaxed">
        <span className="font-semibold">Ten en cuenta esto en tu zona.</span> {nota}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB
   ══════════════════════════════════════════════════════════════════ */

/**
 * Región de la guía que corresponde a la zona del perfil. La ficha cae en
 * Santiago-RM (zona 7) cuando no hay comuna, igual que TabFenologia, y si la
 * región administrativa no cae en ninguna de las 6 de la guía se busca la
 * primera que sí tenga programa para esta especie.
 */
function regionInicial(dbKey: string, zonaId: number | null): string {
  const region = regionGuiaDeRegion(ZONAS[zonaId ?? 7]?.region);
  const candidatas = regionesGuia();
  if (region && guiaRegional(dbKey, region, "suelo")) return region;
  return candidatas.find((r) => guiaRegional(dbKey, r, "suelo")) ?? region ?? candidatas[2];
}

export function NutricionGuia({
  dbKey,
  especieNombre,
  zonaId,
}: {
  dbKey: string;
  especieNombre: string;
  zonaId: number | null;
}) {
  const [region, setRegion] = useState<string>(() => regionInicial(dbKey, zonaId));
  const [edad, setEdad] = useState<RangoEdad>("adulto");
  const [metodo, setMetodo] = useState<MetodoGuia>("suelo");

  const guia = guiaRegional(dbKey, region, metodo);
  const factorEdad = FACTORES_EDAD[edad];

  return (
    <div className="flex flex-col gap-4">
      {guia ? (
        <>
          <CalendarioMeses guia={guia} region={region} />
          <PanelAjuste
            region={region}
            onRegion={setRegion}
            edad={edad}
            onEdad={setEdad}
            metodo={metodo}
            onMetodo={setMetodo}
            ajestado={zonaId != null}
          />
          {guia.nota && <AvisoRegion nota={guia.nota} />}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Qué echarle en cada momento</h3>
            <p className="text-xs text-muted-foreground">
              Las cantidades son de <span className="font-medium text-foreground">cada vez</span>, no
              de todo el año.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {guia.momentos.map((m) => (
              <BloqueMomento key={m.orden} momento={m} factorEdad={factorEdad} />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Preparado por Gardenfood a partir del Boletín INIA N° 426 y de estudios de INIA, la
            Universidad de Concepción y la Universidad de Talca. Estas cantidades reponen lo que la
            planta se lleva en una temporada; no reemplazan un análisis de suelo. Verifica siempre la
            etiqueta del envase: cambia entre proveedores.
          </p>
        </>
      ) : (
        <>
          <PanelAjuste
            region={region}
            onRegion={setRegion}
            edad={edad}
            onEdad={setEdad}
            metodo={metodo}
            onMetodo={setMetodo}
            ajestado={zonaId != null}
          />
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MapPinned className="size-6" aria-hidden />
              </span>
              <CardTitle className="text-base">Sin programa para {especieNombre} en {region}</CardTitle>
              <CardDescription className="max-w-md text-sm leading-relaxed">
                La guía de fertilización casera no tiene dosis calibradas para esta especie en esa
                zona del país. Prueba con otra región arriba, o revisa la ficha técnica de la
                pestaña Info.
              </CardDescription>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
