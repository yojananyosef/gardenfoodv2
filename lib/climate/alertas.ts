import type { ZonaClimatica } from "@/lib/agronomy";

/**
 * Alertas climáticas a partir del PRONÓSTICO, no del perfil histórico.
 *
 * Todo lo de este archivo es función pura: recibe números y devuelve alertas.
 * El fetch vive en `open-meteo.ts`. La separación no es purismo, es lo que
 * permite testear umbrales en un CI sin red, que es donde un test de
 * integración con un tercero falla un jueves a las 23:50.
 */

export type TipoAlerta = "helada" | "lluvia" | "calor" | "sequia";
export type Severidad = "baja" | "media" | "alta";

export interface AlertaClimatica {
  tipo: TipoAlerta;
  titulo: string;
  detalle: string;
  severidad: Severidad;
  /**
   * Día al que se refiere la alerta, en `YYYY-MM-DD`. Todo aviso que se emita
   * la trae: una alerta sin fecha es un evento que ya pasó, que es exactamente
   * lo que se pidió eliminar.
   */
  fecha: string;
}

export interface DiaPronostico {
  fecha: string;
  /** Tª máxima en °C. */
  max: number;
  /** Tª mínima en °C. */
  min: number;
  /** Probabilidad de precipitación en %, 0-100. */
  probLluvia: number;
  /** Código WMO del día. Sin él no hay ícono ni frase de tiempo. */
  codigo?: number | null;
  /** Milímetros de lluvia previstos, que no es lo mismo que la probabilidad. */
  mmLluvia?: number;
  /** ET₀ en mm/día: la demanda del pasto de referencia. */
  et0?: number | null;
  /** Viento máximo en km/h. */
  viento?: number | null;
  /** Índice UV máximo. */
  uv?: number | null;
  /** `YYYY-MM-DDTHH:mm` en hora de Chile. */
  amanecer?: string | null;
  atardecer?: string | null;
}

/** Una hora del pronóstico, para la curva de temperatura. */
export interface HoraClima {
  /** `YYYY-MM-DDTHH`, ya recortada a hora local de Chile. */
  hora: string;
  temp: number;
  probLluvia: number;
  codigo?: number | null;
}

/** Condiciones del momento en que se consultó. */
export interface Ahora {
  temp: number;
  sensacion: number | null;
  /** Humedad relativa en %. */
  humedad: number | null;
  viento: number | null;
  lluvia: number | null;
  codigo?: number | null;
}

export interface Pronostico {
  dias: DiaPronostico[];
  /** Dónde se consultó, para mostrarlo y para depurar. */
  lugar: string;
  /** Condiciones actuales. `null` si no vinieron: la pantalla sigue igual. */
  actual?: Ahora | null;
  /** Próximas 24 horas. Vacío si no vino: el gráfico solo se oculta. */
  horas?: HoraClima[];
}

/**
 * Umbrales. Los de helada y calor se derivan de la zona (abajo); los de lluvia
 * son absolutos porque no dependen de la zona.
 */
export const UMBRAL_LLUVIA_PCT = 60;
/** Por debajo de esto la mínima prevista es helada para un frutal. */
export const CERO_CENTIGRADOS = 0;

const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const NOMBRES_DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/**
 * Índice del día de la semana (0 = domingo) de una fecha `YYYY-MM-DD`.
 *
 * Va aparte de `fechaCorta` porque la tira de 7 días necesita el índice para
 * pintar la columna, no el nombre. Y vive acá, y no duplicado en el componente,
 * porque la copia anterior usaba `Date.UTC(2000, …)`: el 7 de octubre salía
 * «sáb» (día de la semana de ese 7 de octubre de 2000) cuando era miércoles.
 */
export function diaSemanaDe(fecha: string): number {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) return 0;
  return new Date(
    Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])),
  ).getUTCDay();
}

/** «2026-10-09» → «vie 9». */
export function fechaCorta(fecha: string): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!dia) return fecha;
  return `${NOMBRES_DIA[diaSemanaDe(fecha)]} ${Number(dia[3])}`;
}

/** Zona horaria de todo el país. Chile continental no usa DST. */
export const TZ_CHILE = "America/Santiago";

/**
 * Fecha de Chile en formato `YYYY-MM-DD`.
 *
 * NI `toISOString()` NI `getDate()`.
 *
 * - `toISOString()` devuelve UTC: en Chile (UTC−3/−4) después de las 21:00 ya es
 *   el día siguiente, y el pronóstico marcaba «Hoy» en el día que viene.
 * - `getDate()`/`getMonth()` dan la hora **del proceso**. Sirve en local, donde
 *   el TZ de la máquina es America/Santiago, y falla en Vercel, que corre en
 *   UTC: ahí `getDate()` devuelve el jueves 8 cuando en Chile todavía es
 *   miércoles 7. El bug no se reproduce en local y aparece en producción a
 *   partir de las 21:00 hora chilena.
 *
 * `Intl` con `timeZone` explícito es la única forma que no depende de dónde
 * corra el código: en mi máquina, en Vercel y en el navegador del usuario da lo
 * mismo. Chile continental no aplica horario de verano, pero la zona incluye la
 * hora de verano de las islas, así que `America/Santiago` cubre el país.
 */
export function hoyLocal(fecha: Date = new Date()): string {
  // `en-CA` rinde `AAAA-MM-DD`, que es justo el formato que necesitamos.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/**
 * Mes (1-12) en Chile.
 *
 * Mismo problema que `hoyLocal()`: `getMonth()` da el mes del servidor, y en
 * la frontera de un cambio de mes eso elige el mes equivocado — el respaldo
 * estático decide con este número qué alerta mostrar.
 */
export function mesEnChile(fecha: Date = new Date()): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ_CHILE,
    month: "numeric",
  }).format(fecha);
  return Number(partes);
}

/** Fecha larga en español, ya en hora de Chile. */
export function fechaLargaChile(fecha: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: TZ_CHILE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
}

const conDecimal = (n: number) => n.toFixed(1).replace(".", ",");

/**
 * Umbral de helada de la zona, en °C.
 *
 * `ZonaClimatica` no trae un umbral en grados: trae `tnMin` (la mínima
 * promedio anual) y un string de «días de helada por año». El umbral sale de
 * `tnMin` con un margen, y es el dato que hay que validar con el socio: si
 * queda corto, avisa de heladas donde no las hay; si queda largo, se las come.
 *
 * ASSUMTO AGRONÓMICO: el margen es 3 °C sobre la mínima promedio, que es la
 * desviación típica entre el promedio de un mes y su mínimo absoluto en el
 * centro de Chile. Si INIA confirma otro número, se cambia acá y en un solo
 * lugar, porque esta función es el único punto donde se decide.
 */
export function umbralHelada(zona: ZonaClimatica): number {
  return zona.tnMin - 3;
}

/**
 * Severidad de una helada por su mínima prevista, no por el rango de días de
 * helada de la zona.
 *
 * El código anterior hacía `heladas.includes("15")` sobre el string
 * `"5–15 días"`, que contiene "15" como subcadena: por eso Copiapó, Quillota,
 * Pichilemu y Concepción salían con severidad `alta` teniendo 5 a 15 días.
 */
/**
 * Cuántos grados por debajo del umbral pasa la mínima, y eso define la
 * severidad. Con el umbral en -2 °C: una mínima de -7 da 5 grados de margen y
 * es `alta`; una de -3 da 1 y es `baja`.
 */
const GRADOS_MEDIA = 2;
const GRADOS_ALTA = 5;

export function severidadHelada(min: number, umbral: number): Severidad {
  const bajo = umbral - min;
  if (bajo >= GRADOS_ALTA) return "alta";
  if (bajo >= GRADOS_MEDIA) return "media";
  return "baja";
}

export function severidadCalor(max: number): Severidad {
  if (max >= 35) return "alta";
  if (max >= 32) return "media";
  return "baja";
}

/**
 * Alertas de los próximos días a partir del pronóstico.
 *
 * Una alerta por día y por tipo, no una acumulada: si van a caer cuatro días
 * de helada, el usuario necesita saber cuáles, no un «Riesgo de heladas» sin
 * fecha. El resumen por tipo lo arma el gráfico, no esta función.
 */
export function alertasDesdePronostico(
  pronostico: Pronostico | null,
  zona: ZonaClimatica,
): AlertaClimatica[] {
  if (!pronostico) return [];
  const alertas: AlertaClimatica[] = [];
  const umbral = umbralHelada(zona);

  for (const dia of pronostico.dias) {
    if (dia.min <= umbral) {
      const sev = severidadHelada(dia.min, umbral);
      alertas.push({
        tipo: "helada",
        titulo: sev === "alta" ? "Helada fuerte" : "Riesgo de helada",
        detalle: `Mínima prevista de ${conDecimal(dia.min)} °C, ${Math.abs(Math.round(dia.min - umbral))} °C bajo el umbral de ${zona.nombre}. Protege brotes y flores.`,
        severidad: sev,
        fecha: dia.fecha,
      });
    }

    if (dia.probLluvia >= UMBRAL_LLUVIA_PCT) {
      alertas.push({
        tipo: "lluvia",
        titulo: "Lluvia probable",
        // El «hasta » lo pone `detalleEnPlural` del componente cuando agrupa varios días:
// el detalle se arma por día, y cinco días juntos no pueden prometer la
// probabilidad de uno.
      detalle: `${dia.probLluvia}% de probabilidad en ${MESES_LARGOS[Number(dia.fecha.slice(5, 7)) - 1].toLowerCase()}. El riego al pie se puede saltear ese día.`,
        severidad: dia.probLluvia >= 80 ? "media" : "baja",
        fecha: dia.fecha,
      });
    }

    if (dia.max >= 32) {
      alertas.push({
        tipo: "calor",
        titulo: "Calor fuerte",
        detalle: `Máxima prevista de ${conDecimal(dia.max)} °C. Riega al alba y da sombra a lo más tierno.`,
        severidad: severidadCalor(dia.max),
        fecha: dia.fecha,
      });
    }
  }

  return alertas;
}

export interface GrupoAlerta {
  tipo: TipoAlerta;
  titulo: string;
  detalle: string;
  /** La más alta del grupo: si un día trae helada alta y otro media, el grupo es alto. */
  severidad: Severidad;
  /** Días con ese aviso. Vacío en el respaldo estático, que no tiene fechas. */
  fechas: string[];
}

const ORDEN_SEVERIDAD: Record<Severidad, number> = { alta: 3, media: 2, baja: 1 };

/**
 * Alertas agrupadas por tipo, para no repetir la misma línea cinco veces.
 *
 * Con el pronóstico es fácil tener cinco días de lluvia seguidos. Desplegados,
 * son cinco filas idénticas —«Lluvia probable», la misma explicación, cinco
 * veces— que ocupan media pantalla para decir «llueve el 7, 8, 9, 12 y 13».
 * Agrupadas son una línea con los días adentro.
 *
 * El orden es por severidad, no por fecha: si el pronóstico trae helada fuerte
 * y lluvia leve, la helada va primero aunque sea el segundo día.
 */
export function agruparAlertas(alertas: AlertaClimatica[]): GrupoAlerta[] {
  const porTipo = new Map<TipoAlerta, AlertaClimatica[]>();
  for (const a of alertas) {
    const grupo = porTipo.get(a.tipo);
    if (grupo) grupo.push(a);
    else porTipo.set(a.tipo, [a]);
  }

  return Array.from(porTipo.entries())
    .map(([tipo, items]) => ({
      tipo,
      titulo: items[0].titulo,
      detalle: items[0].detalle,
      severidad: items.reduce(
        (peor, a) => (ORDEN_SEVERIDAD[a.severidad] > ORDEN_SEVERIDAD[peor] ? a.severidad : peor),
        items[0].severidad,
      ),
      fechas: Array.from(new Set(items.map((a) => a.fecha).filter(Boolean))),
    }))
    .sort((a, b) => ORDEN_SEVERIDAD[b.severidad] - ORDEN_SEVERIDAD[a.severidad]);
}

/** «1 día» / «3 días», sin pluralizar a mano en cada lado. */
const plural = (n: number, sing: string, plur: string) => `${n} ${n === 1 ? sing : plur}`;

/**
 * Qué dice el número del badge, en palabras.
 *
 * El badge mostraba el total pelado — un «5» al lado de un gráfico de una sola
 * barra que decía «lluvia: 5» — y el número no significaba nada para quien lo
 * miraba. Con el pronóstico, además, el total de alertas NO es el total de
 * días: una helada y lluvia el mismo día son dos avisos de un solo día.
 *
 * Por eso cuenta días distintos, y solo cuenta días si TODAS las alertas
 * tienen fecha. El respaldo del perfil estático no trae fechas, así que ahí no
 * puede hablar de días y cuenta avisos.
 */
export function resumenAlertas(alertas: AlertaClimatica[]): string {
  if (!alertas.length) return "sin avisos";
  if (alertas.some((a) => !a.fecha)) return plural(alertas.length, "aviso", "avisos");
  const dias = new Set(alertas.map((a) => a.fecha)).size;
  return `${plural(dias, "día con aviso", "días con aviso")}`;
}

/**
 * Perfil estático de la zona como RESPALDO, no como fuente principal.
 *
 * Se conserva porque cuando Open-Meteo no responde la pantalla tiene que
 * seguir mostrando algo, y el perfil anual de la zona es lo único que hay. Se
 * corrigen dos bugs que tenía:
 *
 * - La severidad de helada comparaba por substring sobre `"5–15 días"`, así que
 *   las zonas de 5 a 15 días salían con severidad `alta`.
 * - La sequía se disparaba por mes del calendario sin mirar `zona.sequia`, con
 *   lo que a Temuco (1200 mm/año) le decía «Precipitación baja».
 */
/**
 * Días de helada al año de la zona, tomando el techo del rango.
 *
 * `"5–15 días"` → 15. Es la lectura conservadora: el rango dice que puede
 * llegar a 15, y helar quince veces en la temporada no es un dato menor.
 *
 * La versión anterior comparaba por substring: `includes("15")` encuentra
 * `"15"` dentro de `"5–15 días"`, y le daba severidad alta a Copiapó,
 * Quillota, Pichilemu y Concepción.
 */
export function diasDeHelada(zona: ZonaClimatica): number {
  if (zona.heladas.includes("Sin heladas")) return 0;
  const numeros = zona.heladas.match(/\d+/g);
  if (!numeros?.length) return 0;
  return Math.max(...numeros.map(Number));
}

/**
 * ¿La zona es de las donde la helada es el riesgo del invierno?
 *
 * `ZonaClimatica` no trae heladas por mes, solo días al año. Las zonas que el
 * propio catálogo marca con sequía «Nulo» o «Muy bajo» (Temuco, Valdivia,
 * Osorno: 1200–1800 mm al año) son marítimas, y ahí el string de heladas es
 * demasiado grueso para usarlo como si fueran meses de junio a agosto.
 *
 * Sin este filtro el sur recibía «Riesgo de heladas» y «Temporada de
 * lluvias» en el mismo mes, que es la contradicción que se quería eliminar.
 *
 * ASSUMTO SOBRE EL DATASET: usa `sequia` como discriminante. Si INIA manda los
 * datos mensuales de helada, esto se reemplaza por la tabla.
 */
function zonaHelada(zona: ZonaClimatica): boolean {
  return zona.sequia !== "Nulo" && zona.sequia !== "Muy bajo";
}

export function alertasEstaticas(zona: ZonaClimatica, mes: number): AlertaClimatica[] {
  const alertas: AlertaClimatica[] = [];
  // Sin fecha real que dar: es un perfil anual, no un pronóstico. Se marca con
  // una fecha vacía y la interfaz lo declara como respaldo.
  const sinFecha = "";

  const heladas = diasDeHelada(zona);
  if ([6, 7, 8].includes(mes) && heladas > 0 && zonaHelada(zona)) {
    const severidad: Severidad = heladas >= 20 ? "alta" : heladas >= 10 ? "media" : "baja";
    alertas.push({
      tipo: "helada",
      titulo: "Temporada de heladas",
      detalle: `${zona.nombre} registra ${zona.heladas.toLowerCase()} de heladas al año. Sin pronóstico disponible: protege brotes tiernos.`,
      severidad,
      fecha: sinFecha,
    });
  }

  if (
    (zona.sequia === "Extremo" || zona.sequia === "Alto") &&
    [11, 12, 1, 2, 3].includes(mes)
  ) {
    alertas.push({
      tipo: "sequia",
      titulo: "Estrés hídrico",
      detalle: `${zona.nombre} es zona seca (${zona.pp} mm/año). Prioriza riego por goteo y mulch.`,
      severidad: "alta",
      fecha: sinFecha,
    });
  }

  if ((zona.sequia === "Nulo" || zona.sequia === "Muy bajo") && [5, 6, 7].includes(mes)) {
    alertas.push({
      tipo: "lluvia",
      titulo: "Temporada de lluvias",
      detalle: `${zona.nombre} recibe ${zona.pp} mm al año. Revisa el drenaje y evita riego extra.`,
      severidad: "baja",
      fecha: sinFecha,
    });
  }

  if ([12, 1, 2].includes(mes) && zona.txMax >= 32) {
    alertas.push({
      tipo: "calor",
      titulo: "Verano caluroso",
      detalle: `Máximas de hasta ${zona.txMax}°C en ${zona.nombre}. Riega al alba.`,
      severidad: severidadCalor(zona.txMax),
      fecha: sinFecha,
    });
  }

  return alertas;
}

/** De dónde salieron los datos, para que la interfaz lo diga. */
export type FuenteClima = "pronostico" | "perfil" | "ninguna";

export interface ResultadoClima {
  alertas: AlertaClimatica[];
  pronostico: Pronostico | null;
  fuente: FuenteClima;
  zona: ZonaClimatica;
}

export function resolverClima(
  pronostico: Pronostico | null,
  zona: ZonaClimatica,
  mes: number,
): ResultadoClima {
  if (pronostico && pronostico.dias.length) {
    const alertas = alertasDesdePronostico(pronostico, zona);
    // El pronóstico existe pero no alcanza ningún umbral: se dice, sin
    // inventar la alerta del perfil anual, que sería de otro periodo.
    return { alertas, pronostico, fuente: "pronostico", zona };
  }
  const alertas = alertasEstaticas(zona, mes);
  return {
    alertas,
    pronostico: null,
    fuente: alertas.length ? "perfil" : "ninguna",
    zona,
  };
}