import { resolverZonaDeComuna, getZonaDeComuna } from "@/lib/agronomy";
import { puntoDeConsulta } from "@/lib/agronomy/centroides";
import {
  hoyLocal,
  mesEnChile,
  resolverClima,
  umbralHelada,
  type Ahora,
  type DiaPronostico,
  type HoraClima,
  type Pronostico,
} from "./alertas";

/**
 * Pronóstico real, de Open-Meteo.
 *
 * Por qué Open-Meteo y no la Dirección Meteorológica: la DMC no expone API
 * pública consumible desde el cliente, y agrometeorologia.cl (INIA) expone
 * formularios PHP POST, no JSON. Eso ya estaba documentado en el módulo
 * anterior y sigue siendo cierto. Open-Meteo entrega JSON, no exige credencial
 * para este uso, y trae exactamente los tres campos que se pidieron: mínima,
 * máxima y probabilidad de lluvia por día.
 *
 * La ausencia de API key también evita el problema de guardar un secreto en
 * Vercel, que ya está documentado en `PENDING.md` para el webhook de
 * MercadoPago.
 *
 * La CSP de `proxy.ts` no se toca: este fetch es server-side y la CSP gobierna
 * al navegador. Lo mismo que con las llamadas a Supabase y MercadoPago.
 */

const URL_API = "https://api.open-meteo.com/v1/forecast";
const DIAS = 7;

/** Una hora. El pronóstico no cambia cada minuto y /huerto se pide en cada visita. */
const REVALIDATE_S = 3600;

/**
 * Variables que se piden. Todas vienen en la misma llamada y ninguna cuesta
 * extra: la API es una por variables, no una por variable.
 *
 * `-hourly` es lo que permite el gráfico de temperatura por hora que se parece
 * al de Google. Antes solo se pedía el agregado diario, que no tiene forma: siete
 * máximos y siete mínimas son catorce números sueltos, no una curva.
 *
 * `et0_fao_evapotranspiration` es el agregado que da el riego en mm. Es lo que
 * la app puede aportar y un pronóstico general no: no el qué, el cuánto.
 */
const DIARIAS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "precipitation_hours",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "uv_index_max",
  "sunrise",
  "sunset",
  "et0_fao_evapotranspiration",
].join(",");

const HORARIAS = [
  "temperature_2m",
  "precipitation_probability",
  "weather_code",
].join(",");

const ACTUALES = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "weather_code",
  "wind_speed_10m",
  "precipitation",
].join(",");

interface RespuestaOpenMeteo {
  current?: {
    time?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    weather_code?: number | null;
    wind_speed_10m?: number | null;
    precipitation?: number | null;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: (number | null)[];
    precipitation_probability?: (number | null)[];
    weather_code?: (number | null)[];
  };
  daily?: {
    time?: string[];
    weather_code?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    apparent_temperature_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_hours?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
    wind_gusts_10m_max?: (number | null)[];
    uv_index_max?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
    et0_fao_evapotranspiration?: (number | null)[];
  };
}

/**
 * Pronóstico por punto. Devuelve `null` ante cualquier fallo: quien llama tiene
 * el respaldo del perfil de zona y `/huerto` no puede romperse por un tercero.
 */
export async function fetchPronostico(
  lat: number,
  lng: number,
): Promise<Pronostico | null> {
  const url =
    `${URL_API}?latitude=${lat}&longitude=${lng}` +
    `&daily=${DIARIAS}&hourly=${HORARIAS}&current=${ACTUALES}` +
    `&timezone=America%2FSantiago&forecast_days=${DIAS}&past_days=1`;

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_S } });
    if (!res.ok) return null;
    const json = (await res.json()) as RespuestaOpenMeteo;
    const d = json.daily;
    if (!d?.time?.length) return null;

    const dias: DiaPronostico[] = [];
    d.time.forEach((fecha, i) => {
      const max = d.temperature_2m_max?.[i];
      const min = d.temperature_2m_min?.[i];
      if (typeof min !== "number" || typeof max !== "number") return;
      dias.push({
        fecha,
        max,
        min,
        probLluvia: d.precipitation_probability_max?.[i] ?? 0,
        codigo: d.weather_code?.[i] ?? null,
        // La lluvia prevista, no la probabilidad: para saber si hay que regar
        // importa cuántos mm caen, no cuánto probable es que caigan.
        mmLluvia: d.precipitation_sum?.[i] ?? 0,
        et0: d.et0_fao_evapotranspiration?.[i] ?? null,
        viento: d.wind_speed_10m_max?.[i] ?? null,
        uv: d.uv_index_max?.[i] ?? null,
        amanecer: d.sunrise?.[i] ?? null,
        atardecer: d.sunset?.[i] ?? null,
      });
    });

    // `past_days=1` hace que la respuesta empiece ayer. La app muestra los
    // próximos días, así que ayer al principio se descarta.
    const hoy = hoyLocal();
    const desdeHoy = dias.filter((x) => x.fecha >= hoy);

    if (!desdeHoy.length) return null;
    return {
      dias: desdeHoy,
      lugar: `${lat},${lng}`,
      actual: leerActual(json.current),
      horas: leerHoras(json.hourly),
    };
  } catch {
    return null;
  }
}

/** Condiciones de este momento, para el bloque «Ahora». */
function leerActual(c: RespuestaOpenMeteo["current"]): Ahora | null {
  if (!c || typeof c.temperature_2m !== "number") return null;
  return {
    temp: c.temperature_2m,
    sensacion: c.apparent_temperature ?? null,
    humedad: c.relative_humidity_2m ?? null,
    viento: c.wind_speed_10m ?? null,
    lluvia: c.precipitation ?? null,
    codigo: c.weather_code ?? null,
  };
}

/**
 * Las próximas 24 horas desde ahora, no desde las 00:00.
 *
 * La serie horaria arranca a medianoche del primer día devuelto, así que
 * recortar por hora actual es lo que hace que la curva sea «próximas 24 h» y no
 * «ayer y hoy». Con `past_days=1` la lista sí empieza ayer, y por eso el corte es
 * por valor de fecha y no por índice.
 */
function leerHoras(h: RespuestaOpenMeteo["hourly"]): HoraClima[] {
  if (!h?.time?.length) return [];
  const desdeHoy = h.time.filter((t) => t.slice(0, 10) >= hoyLocal());
  const salida: HoraClima[] = [];
  for (const t of desdeHoy.slice(0, 24)) {
    const i = h.time.indexOf(t);
    const temp = h.temperature_2m?.[i];
    if (typeof temp !== "number") continue;
    salida.push({
      hora: `${t.slice(0, 10)}T${t.slice(11, 13)}`,
      temp,
      probLluvia: h.precipitation_probability?.[i] ?? 0,
      codigo: h.weather_code?.[i] ?? null,
    });
  }
  return salida;
}

export interface ClimaDeComuna {
  pronostico: Pronostico | null;
  /** `true` si la coordenada es el centro de la zona y no el de la comuna. */
  puntoAproximado: boolean;
}

/**
 * Atribución que la licencia CC BY 4.0 de los datos exige mostrar.
 *
 * No es un detalle: la licencia de los datos de Open-Meteo obliga a dar crédito
 * e indicar modificaciones. Una pantalla de clima sin atribución es un
 * incumplimiento de licencia, por muy bien que funcione.
 */
export const ATRIBUCION = "Open-Meteo";

/**
 * Pronóstico de la comuna del usuario, con caída al centro de su zona.
 *
 * Devuelve `null` si no hay ni coordenada de comuna ni de zona, en vez de
 * consultar un punto inventado: una alerta en el lugar equivocado es peor que
 * no tener alerta.
 */
export async function pronosticoDeComuna(
  comuna?: string | null,
  zonaId?: number | null,
): Promise<ClimaDeComuna | null> {
  const objetivo = puntoDeConsulta(comuna, zonaId);
  if (!objetivo) return null;
  const pronostico = await fetchPronostico(objetivo.punto.lat, objetivo.punto.lng);
  return { pronostico, puntoAproximado: objetivo.deZona };
}

/**
 * Clima listo para la vista: pronóstico si se pudo, respaldo del perfil si no.
 *
 * Es el único punto donde se junta zona + pronóstico + alertas, para que la
 * página no tenga que saber de respaldos.
 */
export async function climaDePerfil(
  comuna?: string | null,
): Promise<{
  pronostico: Pronostico | null;
  alertas: import("./alertas").AlertaClimatica[];
  fuente: import("./alertas").FuenteClima;
  zonaNombre: string;
  puntoAproximado: boolean;
  /** `true` cuando el usuario no tiene comuna: el pronóstico es el de la zona neutra. */
  sinComuna: boolean;
  /** Umbral de helada de la zona, para la línea de referencia del gráfico. */
  umbralHelada: number;
} | null> {
  const { zonaId, esDefault } = resolverZonaDeComuna(comuna);
  const zona = getZonaDeComuna(comuna);
  if (!zona) return null;

  const clima = await pronosticoDeComuna(comuna, zonaId);
  // Mes en hora de Chile. `getMonth()` daba el mes del servidor, que en Vercel
  // (UTC) es el mes siguiente cuando Chile todavía está en el anterior.
  const mes = mesEnChile();
  const resuelto = resolverClima(clima?.pronostico ?? null, zona, mes);

  return {
    pronostico: resuelto.pronostico,
    alertas: resuelto.alertas,
    fuente: resuelto.fuente,
    zonaNombre: zona.nombre,
    puntoAproximado: clima?.puntoAproximado ?? false,
    sinComuna: esDefault,
    umbralHelada: umbralHelada(zona),
  };
}