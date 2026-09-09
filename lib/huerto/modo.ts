/** Modo de la vista /huerto: guiado (Propuesta C/E) o modular (Propuesta B). */
export type ModoHuerto = "guiado" | "modular";

/**
 * Modo efectivo: la preferencia guardada manda; sin preferencia,
 * huerto armado → modular, huerto nuevo → guiado (onboarding).
 */
export function modoEfectivo(estado: {
  huertoModo: string | null;
  tieneHuertos: boolean;
  tieneCultivosOArboles: boolean;
}): ModoHuerto {
  if (estado.huertoModo === "guiado" || estado.huertoModo === "modular") {
    return estado.huertoModo;
  }
  return estado.tieneHuertos || estado.tieneCultivosOArboles ? "modular" : "guiado";
}
