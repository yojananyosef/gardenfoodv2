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

import {
  EDADES_GUIA,
  FACTORES_EDAD,
  MESES_GUIA,
  METODOS_GUIA,
  REPOSO_MOMENTO,
  guiaRegional,
  medidaCasera,
  regionDelPerfil,
  regionesGuia,
  textoGramos,
  type GuiaRegional,
  type MedidaCasera,
  type MetodoGuia,
  type MomentoGuia,
  type RangoEdad,
} from "@/lib/agronomy/fertilizacion";

/**
 * Un color por momento, tomado de los tokens --momento-* de globals.css.
 * Token y no color literal a propósito: así la paleta es la de Gardenfood
 * (verde de marca + oro del papel + terracota) y no la del prototipo, y
 * sobre todo cambia sola con el modo oscuro — con `bg-lime-500` /
 * `bg-purple-600` escritos a mano el calendario se quedaba en claro.
 * Clases literales de Tailwind, nunca interpoladas: el scanner v4 no las ve.
 *   0 despierta → oro · 1 engorda → verde de marca · 2 se recupera → terracota
 */
const TEMA_MOMENTO = [
  {
    punto: "bg-momento-0",
    anillo: "ring-momento-0/30",
    barra: "bg-momento-0",
    tinta: "text-momento-0-ink",
  },
  {
    punto: "bg-momento-1",
    anillo: "ring-momento-1/30",
    barra: "bg-momento-1",
    tinta: "text-momento-1-ink",
  },
  {
    punto: "bg-momento-2",
    anillo: "ring-momento-2/30",
    barra: "bg-momento-2",
    tinta: "text-momento-2-ink",
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

/**
 * Anuncio de un mes del calendario para lector de pantalla.
 *
 * Describe el mes por los meses en que se abona, no por el nombre del estado
 * fenológico: «Julio: Jul y Ago» y no «Julio: cuando engorda la fruta». Cuando
 * hay dos momentos en el mismo mes (el de traspaso) se anuncia el cambio, que
 * es lo único que distingue ese mes de los demás.
 *
 * Puro y exportado para testearlo: es la clase de función que se rompe en
 * silencio, con un `.join()` sobre lista vacía dejando el mes sin descripción.
 */
export function nombreMesEnCalendario(
  mes: number,
  momentos: { meses: number[]; mesesTexto: string }[],
): string {
  const largo = NOMBRE_LARGO[MESES_GUIA[mes - 1]] ?? `Mes ${mes}`;
  const lista = momentos.filter((m) => m.meses.includes(mes));
  if (!lista.length) return `${largo}: no se abona`;
  if (lista.length === 1) return `${largo}: se abona en ${lista[0].mesesTexto}`;
  return `${largo}: se abona en ${lista[0].mesesTexto} y ${lista[1].mesesTexto}, y este mes cambia de momento`;
}

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

  /**
   * Cómo se anuncia un mes del calendario al lector de pantalla.
   *
   * Antes componía con los títulos de momento («Agosto: cuando despierta»).
   * Sin títulos, el anuncio se hace con los meses en que ese mes se abona,
   * que es la información que el calendario transmite. Se separa en una
   * función pura y exportada para poder testearla: un `aria-label` que se arma
   * con un `.join()` sobre una lista vacía deja el mes mudo.
   */
  const nombreDe = (mes: number) => nombreMesEnCalendario(mes, guia.momentos);

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
      <CardHeader className="gap-1 pb-3">
        {/* El badge «Los meses en que le toca» se quitó junto con la leyenda de
            colores: los doce círculos ya dicen mes a mes si hay aplicación y
            cuántas, así que el rótulo repetía lo que estaba justo debajo. */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 rounded-full font-mono text-xs">
            <CalendarDays className="size-3" /> {region}
          </Badge>
        </div>
        <CardTitle className="text-base leading-tight">
          {guia.totalAplicaciones} {guia.totalAplicaciones === 1 ? "vez" : "veces"} al año —{" "}
          {porMes === 1 ? "una vez al mes" : "dos veces al mes"}, solo en los meses con número
        </CardTitle>
        <CardDescription className="text-xs">
          Las cantidades reponen lo que el árbol se lleva en una temporada, para un{" "}
          <span className="font-medium text-foreground">árbol adulto en suelo franco</span>. Ajusta la
          edad más abajo y se recalcula.
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
                  {orden === null ? (
                    /* Sin figura, el círculo vacío se leía como un disco
                       roto en vez de "aquí no se hace nada". Se probó una
                       luna primero, pero en el contexto de un huerto dice
                       "noche", no "descanso del cultivo"; el Zzz calza con
                       el copy de REPOSO_MOMENTO («el árbol descansa») y se
                       sigue leyendo a 48 px, que es el ancho real del
                       círculo en móvil. SVG <text> para que herede la fuente
                       de la app en vez de depender de un archivo de letras. */
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="currentColor"
                      aria-hidden
                      className="text-muted-foreground/70"
                    >
                      <text x="1.5" y="19" fontSize="13" fontWeight="800">Z</text>
                      <text x="11" y="13.5" fontSize="10" fontWeight="800">z</text>
                      <text x="18" y="9.5" fontSize="8" fontWeight="800">z</text>
                    </svg>
                  ) : (
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
  const esFrase = medida.unidad === "pesa" || medida.valor < 1;

  return (
    /* Sin flex-wrap y con la medida en columna de ancho FIJO: antes la fila
       era wrap, así que según cuántos íconos cupieran las horas caían al
       costado o se bajaban, y dentro de una misma card unas quedaban al
       costado y otras abajo. Ahora el texto se encoge (min-w-0 flex-1) y la
       medida siempre ocupa la misma columna: los números quedan alineados
       verticalmente y se comparan de un vistazo. */
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
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

      {/* Número arriba, unidad debajo y el dibujo debajo de los dos: en una
          sola columna el bloque no necesita ancho variable, así que los
          íconos se reparten en dos filas cuando son muchos en vez de
          empujar la medida hacia abajo. */}
      <div className="flex w-[118px] shrink-0 flex-col items-start gap-1">
        {esFrase ? (
          <p className={cn("text-sm font-bold leading-tight", tema.tinta)}>{medida.texto}</p>
        ) : (
          <>
            <p className={cn("text-xl font-bold leading-none", tema.tinta)}>
              {String(medida.valor).replace(".", ",")}
            </p>
            <p className="text-[11px] leading-tight text-muted-foreground">{medida.unidadTexto}</p>
          </>
        )}
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-0.5 rounded-xl bg-muted/60 px-1.5 py-1.5 text-muted-foreground",
            tema.tinta,
          )}
        >
          <CaserasVisual medida={medida} />
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
          {/* El título son los meses. Antes era el estado fenológico del XLSX
              («cuando engorda la fruta»), que se pidió quitar. */}
          <p className="text-sm font-bold leading-tight text-white">{momento.mesesTexto}</p>
        </div>
      </div>
      <CardContent className="flex flex-col gap-3 pt-4">
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

/**
 * Edad y método de fertilizante.
 *
 * NO hay selector de región acá a propósito. La región viene de la comuna del
 * perfil y se cambia en `/perfil`: ofrecerla también en la ficha daba dos
 * lugares para cambiar lo mismo, y el de la ficha no persistía, así que
 * cualquier cambio se perdía al recargar. Si la guía no cubre la región del
 * perfil, el estado vacío manda a configurar la comuna en vez de dejar elegir
 * una región a mano.
 */
function PanelAjuste({
  edad,
  onEdad,
  metodo,
  onMetodo,
  zonaDelPerfil,
}: {
  edad: RangoEdad;
  onEdad: (v: RangoEdad) => void;
  metodo: MetodoGuia;
  onMetodo: (v: MetodoGuia) => void;
  /** `true` cuando la región visible viene de la comuna del perfil. */
  zonaDelPerfil: boolean;
}) {
  const factor = FACTORES_EDAD[edad];
  const meta = EDADES_GUIA.find((e) => e.id === edad);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
        <Label>Qué fertilizante usas</Label>
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
                "flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-left transition-colors",
                metodo === m.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {m.id === "goteo" ? (
                <Droplets className="size-4 text-primary" />
              ) : (
                <TreeDeciduous className="size-4 text-primary" />
              )}
              <span className="text-sm font-semibold">{m.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* `justify-between` en vez de `gap-4`: el enlace queda pegado al borde
          derecho en vez de seguido del «Cálculo ajustado», que lo leía como
          parte de la misma frase. */}
      <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="inline-flex items-start gap-1.5 font-semibold">
          <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
          {/* Solo el factor: el nombre de la edad ya está en el botón de arriba
              («mediano», «grande»), y repetirlo acá producía «Ajustado a tu
              grande (×1)», donde «tu grande» se leía raro. */}
          Cálculo ajustado (×{String(factor).replace(".", ",")})
        </span>
        {/* El nombre de la región ya está en el badge de la cabecera del calendario,
            así que el pie no lo repite: «Región de tu comuna: Santiago-RM» decía
            tres veces la misma idea (región, comuna, Santiago) con el badge a
            veinte píxeles de ahí. Solo queda la acción, o el aviso cuando la
            comuna no está en la guía, que ahí sí es información nueva. */}
        <span className="text-xs text-muted-foreground sm:shrink-0 sm:text-right">
          {zonaDelPerfil ? (
            <Link href="/perfil" className="underline underline-offset-2">
              Cambia tu zona en tu perfil
            </Link>
          ) : (
            <>
              Tu comuna no está en la guía.{" "}
              <Link href="/perfil" className="underline underline-offset-2">
                configura tu comuna
              </Link>
            </>
          )}
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
 * Qué región se muestra en la ficha, o `null` si no se puede determinar.
 *
 * No hay override: la región sale de la comuna del perfil y se cambia en
 * `/perfil`.
 *
 * La diferencia entre los dos casos de `null` es la clave de este fix:
 *
 * - Sin comuna configurada, la región central es un punto de partida razonable
 *   y la ficha lo declara.
 * - Con comuna configurada pero sin guía para esa combinación, NO se cae a la
 *   región central: se muestra el estado vacío. Si se cayera, el calendario
 *   pintaría los meses y el color de otra región mientras el pie decía que la
 *   comuna del usuario no está en la guía, que es la contradicción exacta que
 *   este módulo vino a eliminar.
 */
export function regionVisible(
  regionDelPerfil: string | null,
  regionPorDefecto: string,
  sinComuna: boolean,
): { region: string | null; desdeElPerfil: boolean } {
  if (regionDelPerfil) return { region: regionDelPerfil, desdeElPerfil: true };
  return { region: sinComuna ? regionPorDefecto : null, desdeElPerfil: false };
}

export function NutricionGuia({
  dbKey,
  especieNombre,
  zonaId,
  esDefault,
}: {
  dbKey: string;
  especieNombre: string;
  zonaId: number;
  /**
   * `true` cuando la zona viene del fallback y no de una comuna del perfil.
   * Sin esto, un visitante sin comuna caería en Santiago-RM y la ficha le
   * anunciaría «Región de tu comuna (Santiago-RM)», que es falso: no tiene
   * comuna. En ese caso la región del perfil se trata como desconocida.
   */
  esDefault: boolean;
}) {
  const [edad, setEdad] = useState<RangoEdad>("adulto");
  const [metodo, setMetodo] = useState<MetodoGuia>("suelo");

  // La región se DERIVA en cada render, no se guarda en estado. Ese era el bug:
  // un `useState(() => regionInicial(...))` congela lo que llegó en el montaje,
  // y como el perfil se resuelve después, la región quedaba en la zona neutra
  // para siempre.
  const regionPerfil = esDefault ? null : regionDelPerfil(dbKey, zonaId);
  const { region, desdeElPerfil } = regionVisible(
    regionPerfil,
    regionesGuia()[2],
    esDefault,
  );

  // `region` es null cuando el usuario tiene comuna pero la guía no la cubre: en
  // ese caso no hay nada que mostrar y tampoco un programa al que caer.
  const guia = region ? guiaRegional(dbKey, region, metodo) : null;
  const factorEdad = FACTORES_EDAD[edad];

  return (
    <div className="flex flex-col gap-4">
      {guia && region ? (
        <>
          <CalendarioMeses guia={guia} region={region} />
          <PanelAjuste
            edad={edad}
            onEdad={setEdad}
            metodo={metodo}
            onMetodo={setMetodo}
            zonaDelPerfil={desdeElPerfil}
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
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MapPinned className="size-6" aria-hidden />
              </span>
              {/* Sin guía para la región del perfil: se dice en voz alta cuál es,
                  en vez de mostrar el programa de otra región como si fuera de
                  esta persona. La salida es configurar la comuna, porque la
                  región ya no se elige acá. */}
              <CardTitle className="text-base">
                {esDefault
                  ? `Sin guía de fertilización para ${especieNombre}`
                  : `Sin guía de fertilización para ${especieNombre} en tu zona`}
              </CardTitle>
              <CardDescription className="max-w-md text-sm leading-relaxed">
                {esDefault ? (
                  <>
                    No tienes comuna en tu perfil, así que no sabemos en qué zona estás. Elige tu
                    comuna y te mostramos el programa de tu zona.
                  </>
                ) : (
                  <>
                    La guía casera no tiene dosis calibradas para esta especie en la zona donde
                    estás. Si tu árbol está en otro lado del país, cambia la comuna en tu perfil y el
                    programa se recalcula solo.
                  </>
                )}
              </CardDescription>
              <Link
                href="/perfil"
                className="text-sm font-medium underline underline-offset-2"
              >
                {esDefault ? "Configurar mi comuna" : "Cambiar mi comuna"}
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
