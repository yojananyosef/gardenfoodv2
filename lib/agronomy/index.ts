import { COMUNAS, buscarComuna, getZonaIdDeComuna, COMUNAS_ZONA, type ComunaEntry } from "./comunas";
import { CONSEJOS } from "./consejos";
import { GRUPO_DISTANCIA } from "./distancias";
import { ESPECIES, type Especie } from "./especies";
import { FENOLOGIA, MACROZONA_MAP, type FenologiaEntrada } from "./fenologia";
import { FICHAS, type CalMes, type FichaEspecie } from "./fichas";
import { VIABILIDAD, type Viabilidad } from "./viabilidad";
import { ZONA_NEUTRA_ID } from "./catalogo";
import type { Mes } from "@/lib/fechas";

export type {
  CalMes,
  ComunaEntry,
  Especie,
  FenologiaEntrada,
  FichaEspecie,
  Viabilidad,
};
export { COMUNAS, COMUNAS_ZONA, CONSEJOS, ESPECIES, FENOLOGIA, FICHAS, GRUPO_DISTANCIA, MACROZONA_MAP, VIABILIDAD, buscarComuna, getZonaIdDeComuna };

export { MESES } from "@/lib/fechas";
export type { Mes } from "@/lib/fechas";

export type EspeciePorZona = Especie & {
  viabilidad: Viabilidad;
  viabRazon?: string;
};

export const ESPECIE_MUESTRA_GRATIS = "duraznero";

export function esMuestraGratuis(slug: string): boolean {
  return slug === ESPECIE_MUESTRA_GRATIS;
}

export interface ZonaResuelta {
  /** Id de la zona agroclimática, con fallback a la zona neutra si no hay. */
  zonaId: number;
  /** La comuna tal cual venía del perfil, o null si no había. */
  comuna: string | null;
  /**
   * `true` cuando la zona viene del fallback y NO de la comuna del usuario:
   * no tiene comuna, o su comuna no existe en el catálogo de las 346.
   *
   * Existe para que la interfaz pueda decir «no tienes comuna configurada» en
   * vez de presentar datos de la zona neutra como si fueran los de esa persona.
   * Antes esto se escondía en el `?? 7` de los call-sites.
   */
  esDefault: boolean;
}

/**
 * Resuelve la zona del perfil dejando explícito si salió de la comuna o del
 * fallback.
 *
 * Sigue siendo **síncrona** y por eso puede vivir en `index.ts`, que es
 * client-safe: solo mira `COMUNAS_ZONA`, el mapa comuna→zona que deriva de
 * `comunas.ts`. Ese mapa todavía no viene de la base, así que no necesita
 * `await`. Quien necesite el objeto `ZonaCatalogo` (el nombre, el clima, las
 * temperaturas) usa `getZonaDeComuna()` de `catalogos.ts`, que sí es async.
 */
export function resolverZonaDeComuna(comuna?: string | null): ZonaResuelta {
  // El string vacío es «sin comuna», no una comuna: sin esto el perfil guardaría
  // "" y la interfaz no podría distinguirlo de una comuna real.
  const valor = comuna?.trim() ? comuna.trim() : null;
  const desdeCatalogo = getZonaIdDeComuna(valor);
  return {
    zonaId: desdeCatalogo ?? ZONA_NEUTRA_ID,
    comuna: valor,
    esDefault: desdeCatalogo == null,
  };
}

export function getEspeciePorSlug(slug: string): Especie | null {
  return ESPECIES.find((e) => e.slug === slug) ?? null;
}

export function getEspeciePorDbKey(dbKey: string): Especie | null {
  return ESPECIES.find((e) => e.dbKey === dbKey) ?? null;
}

/** URL de la ficha de una especie (ruta pública aprobada).
 *  Relativa a propósito: los puentes árbol → ficha navegan en la misma
 *  pestaña (o en un sheet) y funcionan en prod, previews y local. */
export function urlFichaEspecie(dbKey: string): string {
  const slug = getEspeciePorDbKey(dbKey)?.slug ?? dbKey.toLowerCase();
  return `/especies/${slug}`;
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