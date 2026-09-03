import { COMUNAS, buscarComuna, type ComunaEntry } from "./comunas";
import { CONSEJOS } from "./consejos";
import { GRUPO_DISTANCIA } from "./distancias";
import { ESPECIES, type Especie } from "./especies";
import { FENOLOGIA, MACROZONA_MAP, type FenologiaEntrada } from "./fenologia";
import { FICHAS, type CalMes, type FichaEspecie } from "./fichas";
import { VIABILIDAD, type Viabilidad } from "./viabilidad";
import { COMUNAS_ZONA, ZONAS, type ZonaClimatica } from "./zonas";

export type {
  CalMes,
  ComunaEntry,
  Especie,
  FenologiaEntrada,
  FichaEspecie,
  Viabilidad,
  ZonaClimatica,
};
export { COMUNAS, COMUNAS_ZONA, CONSEJOS, ESPECIES, FENOLOGIA, FICHAS, GRUPO_DISTANCIA, MACROZONA_MAP, VIABILIDAD, ZONAS, buscarComuna };

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export type Mes = (typeof MESES)[number];

export type EspeciePorZona = Especie & {
  viabilidad: Viabilidad;
  viabRazon?: string;
};

const ZONA_FALLBACK_ID = 7;

export const ESPECIE_MUESTRA_GRATIS = "duraznero";

export function esMuestraGratuis(slug: string): boolean {
  return slug === ESPECIE_MUESTRA_GRATIS;
}

export function getZonaIdDeComuna(comuna?: string | null): number | null {
  if (!comuna) return null;
  const entry = COMUNAS_ZONA[comuna];
  return entry ? entry[0] : null;
}

export function getZonaDeComuna(comuna?: string | null): ZonaClimatica | null {
  const zonaId = getZonaIdDeComuna(comuna);
  if (!zonaId) return ZONAS[ZONA_FALLBACK_ID] ?? null;
  return ZONAS[zonaId];
}

export function getComuna(comuna?: string | null): ComunaEntry | null {
  if (!comuna) return null;
  return COMUNAS.find((c) => c.comuna === comuna) ?? null;
}

export function getEspeciePorSlug(slug: string): Especie | null {
  return ESPECIES.find((e) => e.slug === slug) ?? null;
}

export function getEspeciePorDbKey(dbKey: string): Especie | null {
  return ESPECIES.find((e) => e.dbKey === dbKey) ?? null;
}

export function getEspeciesPorZona(zonaId: number): {
  si: EspeciePorZona[];
  riesgo: EspeciePorZona[];
  no: EspeciePorZona[];
} {
  const si: EspeciePorZona[] = [];
  const riesgo: EspeciePorZona[] = [];
  const no: EspeciePorZona[] = [];
  for (const especie of ESPECIES) {
    const viab = VIABILIDAD[especie.dbKey]?.[zonaId];
    if (!viab) continue;
    const item: EspeciePorZona = {
      ...especie,
      viabilidad: viab.v,
      viabRazon: viab.razon || undefined,
    };
    if (viab.v === "si") si.push(item);
    else if (viab.v === "riesgo") riesgo.push(item);
    else no.push(item);
  }
  return { si, riesgo, no };
}

export function getViabilidad(dbKey: string, zonaId: number): Viabilidad | null {
  const v = VIABILIDAD[dbKey]?.[zonaId];
  return v ? v.v : null;
}

export function getCalendario(dbKey: string): FichaEspecie["cal"] | null {
  return FICHAS[dbKey]?.cal ?? null;
}

export function getCalendarioPorMes(
  dbKey: string,
  mes: Mes | string,
): CalMes | null {
  const cal = getCalendario(dbKey);
  if (!cal) return null;
  return cal.find((m) => m.mes === mes) ?? null;
}

export type TareaSugerida = {
  dbKey: string;
  tipo: "riego" | "nutricion" | "sanidad";
  descripcion: string;
  mes: string;
};

export function getTareasDelMes(
  dbKey: string,
  mes: Mes | string,
): TareaSugerida[] {
  const entrada = getCalendarioPorMes(dbKey, mes);
  if (!entrada) return [];
  const tareas: TareaSugerida[] = [];
  if (entrada.riego && !esNinguno(entrada.riego)) {
    tareas.push({ dbKey, tipo: "riego", descripcion: entrada.riego, mes });
  }
  if (entrada.nutr && !esNinguno(entrada.nutr)) {
    tareas.push({ dbKey, tipo: "nutricion", descripcion: entrada.nutr, mes });
  }
  if (entrada.san && !esNinguno(entrada.san)) {
    tareas.push({ dbKey, tipo: "sanidad", descripcion: entrada.san, mes });
  }
  return tareas;
}

function esNinguno(valor: string): boolean {
  const n = valor.toLowerCase();
  return n === "ninguna" || n === "ninguno" || n === "no" || n === "—";
}

export function getAlertasDelMes(
  dbKey: string,
  mes: Mes | string,
): { alerta: string; etapa: string } | null {
  const entrada = getCalendarioPorMes(dbKey, mes);
  if (!entrada || !entrada.alerta) return null;
  return { alerta: entrada.alerta, etapa: entrada.etapa };
}

export function getFicha(dbKey: string): FichaEspecie | null {
  return FICHAS[dbKey] ?? null;
}

export function getMacrozona(zonaId: number): string {
  return MACROZONA_MAP[zonaId] ?? "Centro-Sur";
}

export function getFenologia(
  dbKey: string,
  zonaId: number,
): FenologiaEntrada | null {
  const macrozona = getMacrozona(zonaId);
  const fen = FENOLOGIA[dbKey]?.[macrozona];
  return fen ?? null;
}

export function getConsejos(dbKey: string): string[] {
  return CONSEJOS[dbKey] ?? [];
}

export function getDistanciaDeGrupo(
  grupo: string,
): { dist: string; porM2: number } | null {
  return GRUPO_DISTANCIA[grupo] ?? null;
}

export function getGrupoDistancia(
  dbKey: string,
): { dist: string; porM2: number } | null {
  const ficha = FICHAS[dbKey];
  if (!ficha?.gr) return null;
  return getDistanciaDeGrupo(ficha.gr);
}

export function getEspeciesPorGrupo(
  grupo: string,
): Especie[] {
  return ESPECIES.filter((e) => e.grupo === grupo);
}

export function getGrupos(): string[] {
  return [...new Set(ESPECIES.map((e) => e.grupo).filter(Boolean))];
}