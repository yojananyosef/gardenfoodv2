/**
 * Vuelca `gf_riego_kc` a CSV antes de borrarla (Fase 10.3).
 *
 * Precaucion, no rescate: `dim_etapas` ya tiene las 8 etapas con el mismo Kc y
 * la misma descripcion, y `scripts/comparar_kc_con_dim_etapas.mjs` lo comprueba
 * fila por fila. El volcado existe para que, si algun dia aparece un lector de
 * la tabla vieja, los datos esten en el repo y no haya que ir a un backup.
 *
 * Detalle que se pierde al dropear y conviene no olvidar: para la etapa CAL,
 * `gf_riego_kc.kc` es NULL y `dim_etapas.kc_referencial` es el texto `—`. La
 * columna vieja era numeric y la hoja traia un guion; la nueva es text y lo
 * conserva. Misma ausencia de dato, distinta manera de escribirla.
 *
 * Uso: node scripts/volcar_gf_riego_kc.mjs
 * Salida: data/gf_riego_kc_historico.csv
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
if (!m) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows } = await db.query(`select codigo, descripcion, kc from gf_riego_kc order by codigo`);
await db.end();

const escapar = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const lineas = [
  "# Volcado previo a borrar la tabla (Fase 10.3 del plan).",
  "# El contenido sigue vivo en dim_etapas: mismas 8 etapas, mismo Kc, misma",
  "# descripcion. Ver scripts/comparar_kc_con_dim_etapas.mjs.",
  "# CAL tiene kc vacio porque la columna vieja era numeric y la hoja traia un",
  "# guion; en dim_etapas.kc_referencial (text) el guion se conserva.",
  "codigo,descripcion,kc",
  ...rows.map((r) => [r.codigo, escapar(r.descripcion), r.kc === null ? "" : r.kc].join(",")),
  "",
].join("\n");

writeFileSync("data/gf_riego_kc_historico.csv", lineas, "utf8");
console.log(`${rows.length} filas -> data/gf_riego_kc_historico.csv`);