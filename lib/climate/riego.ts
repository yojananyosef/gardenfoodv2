/**
 * cuánta agua hay que poner, a partir del clima.
 *
 * Esta es la parte donde la app puede ser más útil que un pronóstico: Google te
 * dice que van a hacer 17°, esto te dice cuántos milímetros reponer. Y sale del
 * mismo endpoint sin costo.
 *
 * SE TRATA DE ET₀, NO DE LA DOSIS FINAL. Requiere el multiplicative del
 * cultivo, que depende de la especie, la edad y el estado fenológico, así que
 * el número que sale acá es la demanda del pasto de referencia, no la del árbol.
 *
 * ASSUMTO AGRONÓMICO — a validar con el socio:
 * - El coeficiente de cultivo (Kc) por defecto es el de un frutal adulto en
 *   fructificación. Para un plantón hay que bajarlo a la mitad.
 * - La lluvia se cuenta al 80% efectivo: el resto se va en escorrentía,
 *   evaporación y quedan en el follaje. Es el valor clásico de la FAO-56 para
 *   uso agrícola y va de 0,7 a 0,9 según el suelo.
 *
 * Si INIA manda los Kc por especie, este archivo pasa a ser el punto donde se
 * busca el valor y no hay que tocar nada más.
 */

import type { DiaPronostico } from "./alertas";

/**
 * Kc de un frutal adulto con ET₀ diario en mm.
 *
 * FAO-56 da 0,65-0,95 para huertos de fruta de hoja caduca en la etapa de
 * máximo desarrollo vegetativo. 0,85 es un valor prudente para un frutal
 * doméstico: más bajo que un árbol adulto en pleno desarrollo, más alto que
 * un frutal en reposo.
 */
export const KC_HUERTO = 0.85;

/** Fracción de la lluvia que realmente llega a la zona de raíces. */
export const EFICACIA_LLUVIA = 0.8;

/** Por debajo de esto no se riega: el daño viene de la faena, no de la falta. */
export const UMBRAL_MINIMO_MM = 1;

export interface DiaRiego {
  fecha: string;
  /** Demanda del pasto de referencia, en mm/día. */
  et0: number;
  /** Lo que llueve, en mm. */
  lluvia: number;
  /** Déficit: lo que hay que reponer, en mm. Redondeado a un decimal. */
  riego: number;
}

/**
 * Déficit hídrico de un día: ET₀ ajustado por el cultivo menos la lluvia
 * efectiva, sin bajar de cero.
 */
export function deficitDelDia(
  et0: number,
  lluviaMm: number,
  kc = KC_HUERTO,
): number {
  const demanda = et0 * kc;
  const efectivo = Math.max(0, lluviaMm) * EFICACIA_LLUVIA;
  return Math.max(0, demanda - efectivo);
}

/**
 * Los siete días con su riego estimado.
 *
 * El ET₀ de un día con sol y calor alto es un problema; el mismo día con lluvia
 * no. Por eso la demanda y la lluvia van separadas en el objeto aunque el
 * resultado sea uno solo.
 */
export function riegoDeSemana(
  dias: DiaPronostico[],
  kc = KC_HUERTO,
): DiaRiego[] {
  return dias.map((d) => {
    const et0 = d.et0 ?? 0;
    // Los mm previstos, que es lo que repone el suelo. La probabilidad dice
    // cuánto probable es que llueva, no cuánta agua deja.
    const lluvia = d.mmLluvia ?? 0;
    return {
      fecha: d.fecha,
      et0,
      lluvia,
      riego: Math.round(deficitDelDia(et0, lluvia, kc) * 10) / 10,
    };
  });
}

/** Días que de verdad piden riego, de más a menos. */
export function diasDeRiego(dias: DiaRiego[]): DiaRiego[] {
  return dias
    .filter((d) => d.riego >= UMBRAL_MINIMO_MM)
    .sort((a, b) => b.riego - a.riego);
}

/**
 * Una frase corta para el encabezado del bloque.
 *
 * Sin ET₀ —cuando Open-Meteo no respondió o la variable vino nula— no se inventa
 * un número de riego: se dice que no hay dato.
 */
export function fraseRiego(dias: DiaRiego[]): string {
  const conEt0 = dias.filter((d) => d.et0 > 0);
  if (!conEt0.length) return "Sin dato de evapotranspiración";
  const total = conEt0.reduce((s, d) => s + d.riego, 0);
  if (total < UMBRAL_MINIMO_MM) {
    return "La lluvia cubre la demanda de la semana";
  }
  return `${total.toFixed(1).replace(".", ",")} mm de riego en 7 días`;
}