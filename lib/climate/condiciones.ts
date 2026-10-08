/**
 * Códigos WMO de clima → lo que el usuario lee.
 *
 * Antes la tira de 7 días mostraba solo números: `17° / 11° / 100%`. Tres
 * cifras sin decir qué tiempo hace. Google pone un ícono y una frase
 * («Lluvias de poca intensidad») y por eso se entiende de un vistazo; el dato
 * estaba disponible todo el tiempo y no se pedía: `weather_code` viene en la
 * misma llamada, sin costo.
 *
 * Todo lo de acá es función pura y sin JSX, para que los tests puedan correr sin
 * React. La correspondencia ícono → componente de lucide vive en el componente.
 */

export type ClaveIcono =
  | "sol"
  | "mayormente-sol"
  | "parcial-nublado"
  | "nublado"
  | "niebla"
  | "llovizna"
  | "lluvia"
  | "chubascos"
  | "nieve"
  | "tormenta"
  | "granizo";

export interface Condicion {
  /** Frase corta en español, como la pone Google. */
  etiqueta: string;
  /** Para elegir el ícono en el componente. */
  icono: ClaveIcono;
  /**
   * Fenómeno raro pero destructivo para un frutal. No es una alerta más: un
   * granizo a mitad de la cuaja deja la temporada perdida, así que sale con
   * severidad alta siempre.
   */
  granizo?: boolean;
  /** Congelación: llovizna o lluvia por debajo de 0 °C. */
  helada?: boolean;
}

/**
 * WMO 4677. Open-Meteo devuelve el número crudo y la documentación dice
 * explícitamente que el mapeo se hace del lado del cliente, así que esta tabla
 * es la fuente de verdad de lo que el usuario lee.
 *
 * Las etiquetas dicen «probable» cuando el código es incierto o de duración
 * corta. Preferimos ese matiz a decir «Lluvia» a secas: si la app se equivoca de
 * vez en cuando, es mejor que el usuario la-crea en vez de que le cueste un
 * riego malSaltado.
 */
const WMO: Record<number, Condicion> = {
  0: { etiqueta: "Despejado", icono: "sol" },
  1: { etiqueta: "Mayormente despejado", icono: "mayormente-sol" },
  2: { etiqueta: "Parcialmente nublado", icono: "parcial-nublado" },
  3: { etiqueta: "Nublado", icono: "nublado" },
  45: { etiqueta: "Niebla", icono: "niebla" },
  48: { etiqueta: "Niebla con escarcha", icono: "niebla" },

  51: { etiqueta: "Llovizna ligera", icono: "llovizna" },
  53: { etiqueta: "Llovizna", icono: "llovizna" },
  55: { etiqueta: "Llovizna intensa", icono: "llovizna" },
  56: { etiqueta: "Llovizna helada", icono: "llovizna", helada: true },
  57: { etiqueta: "Llovizna helada intensa", icono: "llovizna", helada: true },

  61: { etiqueta: "Lluvia ligera", icono: "lluvia" },
  63: { etiqueta: "Lluvia", icono: "lluvia" },
  65: { etiqueta: "Lluvia intensa", icono: "lluvia" },
  66: { etiqueta: "Lluvia helada", icono: "lluvia", helada: true },
  67: { etiqueta: "Lluvia helada intensa", icono: "lluvia", helada: true },

  71: { etiqueta: "Nevada ligera", icono: "nieve" },
  73: { etiqueta: "Nevada", icono: "nieve" },
  75: { etiqueta: "Nevada intensa", icono: "nieve" },
  77: { etiqueta: "Granos de nieve", icono: "nieve" },

  80: { etiqueta: "Chubascos ligeros", icono: "chubascos" },
  81: { etiqueta: "Chubascos", icono: "chubascos" },
  82: { etiqueta: "Chubascos intensos", icono: "chubascos" },
  85: { etiqueta: "Chubascos de nieve", icono: "nieve" },
  86: { etiqueta: "Chubascos de nieve fuertes", icono: "nieve" },

  95: { etiqueta: "Tormenta", icono: "tormenta" },
  96: { etiqueta: "Tormenta con granizo", icono: "granizo", granizo: true },
  97: { etiqueta: "Tormenta fuerte", icono: "tormenta" },
  99: { etiqueta: "Tormenta con granizo fuerte", icono: "granizo", granizo: true },
};

/** Desconocido: el modelogauza un día con un código fuera de la tabla. */
const DESCONOCIDA: Condicion = { etiqueta: "Sin dato", icono: "nublado" };

export function condicionDe(codigo: number | null | undefined): Condicion {
  if (typeof codigo !== "number") return DESCONOCIDA;
  return WMO[codigo] ?? DESCONOCIDA;
}

/**
 * Días con precipitación probable, de lo más probable a lo menos.
 *
 * Va aparte de `diasPorTipo` porque esta lista ordena por probabilidad —que es
 * lo que el usuario quiere ver arriba: el día que más llueve— y no por fecha.
 */
export function diasDeLluvia(
  dias: { fecha: string; probLluvia: number }[],
  umbral = 40,
): { fecha: string; probLluvia: number }[] {
  return dias
    .filter((d) => d.probLluvia >= umbral)
    .sort((a, b) => b.probLluvia - a.probLluvia);
}