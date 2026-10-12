import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MarcadorConsejos, type ConsejoNuevo } from "@/components/consejos/MarcadorConsejos";

/**
 * Marcador de consejos, en `/consejos`.
 *
 * Lee `data/consejos_nuevos.json`, que produce
 * `scripts/generar_consejos_json.mjs` desde la base y desde `consejos.ts`.
 *
 * SIN `force-static`, a proposito. La CSP de produccion lleva un nonce por
 * request, y el proxy lo pasa en la cabecera `x-nonce` para que Next lo aplique
 * a sus scripts. Con `force-static` el HTML se hornea en el build, cuando no hay
 * nonce, y queda sin ninguno: el HTML llega al navegador sin `nonce=` mientras
 * la cabecera trae uno nuevo, asi que CSP bloquea cada script y la pagina se ve
 * pero no responde. Es el mismo modo de fallo que el script inline.
 *
 * Documentación interna: no está enlazada desde ningún menú.
 */
export default async function PaginaConsejos() {
  const crudo = await readFile(join(process.cwd(), "data", "consejos_nuevos.json"), "utf8");
  const datos = JSON.parse(crudo) as ConsejoNuevo[];
  return <MarcadorConsejos datos={datos} />;
}