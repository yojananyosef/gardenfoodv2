import type { ZonaClimatica } from "@/lib/agronomy";

export interface AlertaClimatica {
  tipo: "helada" | "sequia" | "lluvia" | "calor";
  titulo: string;
  detalle: string;
  severidad: "baja" | "media" | "alta";
}

/**
 * Proveedor de alertas climáticas por zona + mes.
 *
 * Implementación actual: datos estáticos derivados del perfil climático de la
 * zona (horas de frío, heladas, sequía) combinados con la fenología estacional.
 *
 * Integración futura (documentada, no implementada): consumir la red de
 * estaciones INIA de agrometeorologia.cl. El sitio expone formularios PHP POST
 * (`estaciones[]`, `variables[]`) y NO tiene una API JSON pública; la
 * integración requeriría un endpoint propio que consulte las estaciones por
 * comuna y traduzca los datos a alertas por zona/mes.
 */
export interface ClimateAlertProvider {
  getAlertas(zona: ZonaClimatica, mes: number): AlertaClimatica[];
}

const MESES_HELADAS = [6, 7, 8];
const MESES_SEQUIA = [11, 12, 1, 2, 3];

function nivelHelada(zona: ZonaClimatica): "baja" | "media" | "alta" {
  if (zona.heladas.includes("Sin heladas") || zona.heladas.includes("0–5")) return "baja";
  if (zona.heladas.includes("20")) return "alta";
  if (zona.heladas.includes("15")) return "alta";
  return "media";
}

function nivelSequia(zona: ZonaClimatica): "baja" | "media" | "alta" {
  if (zona.sequia === "Extremo" || zona.sequia === "Alto") return "alta";
  if (zona.sequia === "Medio-Alto" || zona.sequia === "Medio") return "media";
  return "baja";
}

export const climateAlertsProvider: ClimateAlertProvider = {
  getAlertas(zona, mes) {
    const alertas: AlertaClimatica[] = [];

    if (MESES_HELADAS.includes(mes)) {
      alertas.push({
        tipo: "helada",
        titulo: "Riesgo de heladas",
        detalle: `En ${zona.nombre} se esperan ${zona.heladas.toLowerCase()} de heladas. Protege flores y brotes tiernos.`,
        severidad: nivelHelada(zona),
      });
    }

    if (MESES_SEQUIA.includes(mes)) {
      alertas.push({
        tipo: "sequia",
        titulo: "Estrés hídrico",
        detalle: `Precipitación baja (${zona.pp} mm/año) en ${zona.nombre}. Prioriza riego por goteo y mulch.`,
        severidad: nivelSequia(zona),
      });
    }

    if (zona.sequia === "Nulo" || zona.sequia === "Muy bajo") {
      if ([5, 6, 7].includes(mes)) {
        alertas.push({
          tipo: "lluvia",
          titulo: "Exceso de humedad",
          detalle: `Temporada de lluvias en ${zona.nombre}. Revisa drenaje y evita riego adicional.`,
          severidad: "media",
        });
      }
    }

    if ([12, 1, 2].includes(mes) && zona.txMax >= 30) {
      alertas.push({
        tipo: "calor",
        titulo: "Ola de calor",
        detalle: `Máximas de hasta ${zona.txMax}°C en verano. Riega al alba y da sombra a plantas sensibles.`,
        severidad: zona.txMax >= 32 ? "alta" : "media",
      });
    }

    return alertas;
  },
};