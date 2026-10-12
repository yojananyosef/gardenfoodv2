import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MarcadorConsejos, type ConsejoNuevo } from "@/components/consejos/MarcadorConsejos";

export const dynamic = "force-static";

/**
 * Marcador de consejos, en `/consejos`.
 *
 * Lee `data/consejos_nuevos.json`, que produce
 * `scripts/generar_consejos_json.mjs` desde la base y desde `consejos.ts`.
 *
 * Es una ruta de Next y no un HTML suelto en `public/` a proposito: la CSP de
 * produccion es `script-src 'self' 'nonce-...' 'strict-dynamic'`, y con
 * `strict-dynamic` no corre ni un script inline sin ese nonce ni un archivo
 * externo — el `'self'` se ignora. Como ruta de Next, el nonce ya viene
 * resuelto y el JS del componente se renderiza con él.
 *
 * Documentación interna: no está enlazada desde ningún menú.
 */
export default async function PaginaConsejos() {
  const crudo = await readFile(join(process.cwd(), "data", "consejos_nuevos.json"), "utf8");
  const datos = JSON.parse(crudo) as ConsejoNuevo[];
  return <MarcadorConsejos datos={datos} />;
}