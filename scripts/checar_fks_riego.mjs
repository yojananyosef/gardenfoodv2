/**
 * Chequea si las 4 claves foraneas de la Fase 10.4 se pueden agregar.
 *
 * Agregar una FK sobre una tabla con huerfanos falla, y el error no dice quais.
 * Este script dice, por cada una de las 4, cuantas filas tienen una referencia
 * que no existe en la tabla destino. Si todo da 0, la migracion 0041 puede ir
 * sin `not valid` y sin limpiar nada antes.
 *
 * Tambien imprime las columnas reales de las dos tablas `fact_riego_*`, porque
 * el plan nombra `mes_n` y `codigo_etapa` y conviene confirmar que el nombre es
 * el de hoy y no el de cuando se escribio el plan.
 *
 * Uso: node scripts/checar_fks_riego.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
if (!m) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

// Las 4 FKs que propone el plan 10.4.
const FKS = [
  { tabla: "fact_riego_mes", col: "especie_id", destino: "dim_especies", colDestino: "especie_id" },
  { tabla: "fact_riego_mes", col: "mes_n", destino: "dim_meses", colDestino: "mes_n" },
  { tabla: "fact_riego_etapa", col: "especie_id", destino: "dim_especies", colDestino: "especie_id" },
  { tabla: "fact_riego_etapa", col: "codigo_etapa", destino: "dim_etapas", colDestino: "codigo_etapa" },
];

console.log("== columnas reales ==");
for (const t of ["fact_riego_mes", "fact_riego_etapa", "dim_especies", "dim_meses", "dim_etapas"]) {
  const { rows } = await db.query(
    `select column_name, data_type from information_schema.columns
      where table_schema = 'public' and table_name = $1 order by ordinal_position`,
    [t],
  );
  console.log(`   ${t}: ${rows.map((r) => r.column_name).join(", ")}`);
}

console.log("\n== huerfanos ==");
let conHuerfanos = 0;
for (const fk of FKS) {
  const { rows: existe } = await db.query(
    `select 1 from information_schema.columns
      where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [fk.tabla, fk.col],
  );
  const { rows: existeDestino } = await db.query(
    `select 1 from information_schema.columns
      where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [fk.destino, fk.colDestino],
  );
  if (!existe.length || !existeDestino.length) {
    console.log(`   ${fk.tabla}.${fk.col} -> ${fk.destino}.${fk.colDestino}: NO EXISTE la columna`);
    conHuerfanos++;
    continue;
  }

  const { rows } = await db.query(`
    select count(*)::int as total,
           count(*) filter (where d."${fk.colDestino}" is null)::int as huerfanos,
           count(*) filter (where a."${fk.col}" is null)::int as nulos
      from "${fk.tabla}" a
      left join "${fk.destino}" d on d."${fk.colDestino}" = a."${fk.col}"`);
  const r = rows[0];
  const yaExiste = await db.query(
    `select 1 from pg_constraint
      where contype = 'f' and conrelid = $1::regclass and conname like $2`,
    [fk.tabla, `%${fk.col}%`],
  );
  if (r.huerfanos || r.nulos) conHuerfanos++;
  console.log(
    `   ${(fk.tabla + "." + fk.col).padEnd(30)} filas=${String(r.total).padEnd(5)} ` +
      `huerfanos=${String(r.huerfanos).padEnd(4)} nulos=${String(r.nulos).padEnd(4)} ` +
      `fk-ya-existe=${yaExiste.rowCount > 0 ? "si" : "no"}`,
  );
}

// Las PK/unicidad del destino: sin unicidad la FK no se puede crear.
console.log("\n== unicidad de las columnas destino ==");
for (const d of ["dim_especies.especie_id", "dim_meses.mes_n", "dim_etapas.codigo_etapa"]) {
  const [t, c] = d.split(".");
  const { rows } = await db.query(
    `select count(*)::int as n, count(distinct "${c}")::int as distintos from "${t}"`,
  );
  console.log(
    `   ${d.padEnd(28)} filas=${String(rows[0].n).padEnd(5)} distintos=${String(rows[0].distintos).padEnd(5)} ${rows[0].n === rows[0].distintos ? "ok" : "NO UNICA"}`,
  );
}

console.log(
  conHuerfanos
    ? "\n*** Hay huerfanos o nulos: hay que limpiar antes de agregar la FK."
    : "\nOK: las 4 FKs se pueden agregar sin limpiar nada.",
);

await db.end();