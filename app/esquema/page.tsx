import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DiagramaEsquema, type ModeloEsquema } from "@/components/DiagramaEsquema";

export const dynamic = "force-static";

/**
 * Diagrama de la base de datos, en `/esquema`.
 *
 * Se lee de `data/esquema.json`, que produce
 * `scripts/generar_esquema_json.mjs` desde la base real. No consulta la base en
 * cada visita: el archivo va commiteado, asi que el diagrama no se cae si la
 * base esta lenta, y se regenera cuando cambia el esquema.
 *
 * No tiene nada que ver con la aplicacion ni con sus usuarios: es
 * documentacion interna, y por eso no esta enlazada desde ningun menu.
 */
export default async function PaginaEsquema() {
  const crudo = await readFile(join(process.cwd(), "data", "esquema.json"), "utf8");
  const modelo = JSON.parse(crudo) as ModeloEsquema;
  return <DiagramaEsquema modelo={modelo} />;
}