/**
 * Datos de apoyo del módulo Suelo y Riego que NO viven en la base.
 *
 * Antes este archivo declaraba además los factores de suelo, edades, humedad
 * y zonas de riego, más un mapa de zona→zona de riego hecho de `if`. Todo eso
 * ya estaba en `gf_riego_*` (vistas sobre `dim_*`) y en `dim_comunas`, y el
 * motor lo leía de ahí. Lo que queda acá es lo que de verdad no tiene tabla:
 * el texto del quiz y una constante de unidad.
 *
 * - Los factores de suelo llegan por props desde `getSuelos()`
 *   (`lib/agronomy/catalogos.ts`).
 * - La zona de riego la trae el catálogo de comunas, no un `if`.
 *   Ver `tests/zona-riego-catalogo.test.ts` para el detalle de por qué.
 */

export type SueloId = "G" | "MG" | "M" | "F";

export type ZonaRiegoId = "N1" | "N2" | "C1" | "C2" | "S1" | "S2" | "P1" | "V1" | "V2" | "V3" | "V4";

/** Quiz cinta (paso 1): 6 pasos USDA adaptados. */
export const PASOS_CINTA: { titulo: string; detalle: string }[] = [
  { titulo: "Saque la muestra a 20 cm", detalle: "Bajo el borde de la copa, nunca al pie del tronco." },
  { titulo: "Limpie la tierra", detalle: "Saque piedras, raíces y pasto. Desarme los terrones." },
  { titulo: "Moje de a gotitas", detalle: "Nunca de golpe. Si se pasó de agua, agregue tierra seca." },
  { titulo: "Amase como plasticina", detalle: "Que se deje moldear, sin chorrear ni desarmarse." },
  { titulo: "Forme la cinta", detalle: "Bola entre pulgar e índice, empuje suave hacia arriba." },
  { titulo: "Mida hasta que se corte", detalle: "No forma cinta = G · <2,5 cm = MG · 2,5-5 cm = M · >5 cm = F." },
];

/** Quiz bola (paso 2): se hace antes de cada riego, 15 segundos. */
export const PASOS_BOLA: { titulo: string; detalle: string }[] = [
  { titulo: "No riegue antes de medir", detalle: "Ni justo después de una lluvia." },
  { titulo: "Saque de 20-30 cm", detalle: "Ahí están las raíces que absorben." },
  { titulo: "Apriete fuerte una vez", detalle: "Una sola vez, no amase." },
  { titulo: "Abra y mire", detalle: "Si se armó la bola, si se desarma, si mancha agua." },
  { titulo: "Compare", detalle: "Riegue solo si está en 0-50 % (niveles 1-2)." },
];

/** Balde de 10 litros: la unidad en la que el usuario piensa el riego. */
export const BALDE_L = 10;