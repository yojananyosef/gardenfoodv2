import { ESPECIES } from "@/lib/agronomy";
import { FICHAS } from "@/lib/agronomy";

export const SINTOMAS = [
  { id: "amarillas", l: "Hojas amarillas", kw: ["amarill", "clorosis"] },
  { id: "manchas", l: "Manchas en hojas", kw: ["mancha"] },
  { id: "marchitez", l: "Marchitez / planta decaída", kw: ["marchit", "decaimiento", "muerte", "seca"] },
  { id: "frutos_pequenos", l: "Frutos pequeños o deformes", kw: ["pequeñ", "deform", "raquít"] },
  { id: "insectos", l: "Insectos o larvas visibles", kw: ["pulgón", "mosca", "larva", "gusano", "chanchito", "cochinilla", "araña", "curculio", "barrenador", "polilla", "insecto"] },
  { id: "polvo", l: "Polvo blanco / ceniciento", kw: ["oidio", "ceniz", "polvo"] },
  { id: "caida", l: "Caída prematura de frutos", kw: ["caída", "aborto"] },
  { id: "raiz", l: "Problemas en raíz o cuello", kw: ["raíz", "pudrición", "phytophthora", "cuello"] },
] as const;

export type SintomaId = (typeof SINTOMAS)[number]["id"];

export interface ResultadoDiagnostico {
  especie: string;
  slug: string;
  plaga: string;
  sintoma: string;
  epoca: string;
  accionOrganica: string;
  accionQuimica: string;
  fisiologia: string;
  matchCount: number;
  gravedad: "Leve-Media" | "Media-Alta";
}

export function diagnosticar(idsSeleccionados: SintomaId[]): ResultadoDiagnostico[] {
  if (idsSeleccionados.length === 0) return [];

  const defs = idsSeleccionados
    .map((id) => SINTOMAS.find((s) => s.id === id))
    .filter((s) => s !== undefined) as Array<(typeof SINTOMAS)[number]>;

  const out: ResultadoDiagnostico[] = [];

  for (const especie of ESPECIES) {
    const db = FICHAS[especie.dbKey];
    if (!db?.san) continue;
    for (const s of db.san) {
      const txt = (s.sintoma ?? "").toLowerCase();
      const matchCount = defs.reduce((acc, def) => {
        return acc + (def.kw.some((k) => txt.includes(k)) ? 1 : 0);
      }, 0);
      if (matchCount > 0) {
        out.push({
          especie: especie.nombre,
          slug: especie.slug,
          plaga: s.nombre,
          sintoma: s.sintoma,
          epoca: s.epoca,
          accionOrganica: s.org,
          accionQuimica: s.quim,
          fisiologia: s.fisiologia,
          matchCount,
          gravedad: matchCount >= 2 ? "Media-Alta" : "Leve-Media",
        });
      }
    }
  }

  out.sort((a, b) => b.matchCount - a.matchCount);
  return out.slice(0, 8);
}