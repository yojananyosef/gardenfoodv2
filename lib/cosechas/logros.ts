import type { RegistroCosecha } from "@/types";

export interface Logro {
  id: string;
  titulo: string;
  descripcion: string;
  unlocked: boolean;
}

export function calcularLogros(registros: RegistroCosecha[]): Logro[] {
  const conKg = registros.some((r) => (r.produccionKg ?? 0) > 0);
  const especies = new Set(registros.map((r) => r.especie));
  return [
    {
      id: "primer-registro",
      titulo: "Primer registro",
      descripcion: "Agrega tu primera entrada de bitácora.",
      unlocked: registros.length >= 1,
    },
    {
      id: "diez-registros",
      titulo: "Bitácora activa",
      descripcion: "Acumula 10 registros.",
      unlocked: registros.length >= 10,
    },
    {
      id: "tres-especies",
      titulo: "Huerto diverso",
      descripcion: "Cosecha al menos 3 especies distintas.",
      unlocked: especies.size >= 3,
    },
    {
      id: "primera-produccion",
      titulo: "Primera cosecha",
      descripcion: "Registra tu primera producción en kg.",
      unlocked: conKg,
    },
  ];
}