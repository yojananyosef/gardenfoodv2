import { getEspeciePorDbKey } from "@/lib/agronomy";
import type { Cultivo } from "@/types";

export type CultivoLite = Cultivo & { nombre?: string; grupo?: string };

export function prepararCultivos(cultivos: Cultivo[]): CultivoLite[] {
  return cultivos.map((c) => {
    const especie = getEspeciePorDbKey(c.especie);
    return { ...c, nombre: especie?.nombre ?? c.especie, grupo: especie?.grupo };
  });
}