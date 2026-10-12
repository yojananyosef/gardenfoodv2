/**
 * Chequea de qué dependen las 5 tablas que la Fase 10.3 propone borrar.
 *
 * No se confía en el plan: dice que son write-only y que no las lee nadie,
 * pero lo escribio hace semanas. Antes de un `drop table` en produccion con
 * dos usuarios reales, se comprueba.
 *
 * Busca en tres lugares: definiciones de funciones, definiciones de vistas y
 * claves foraneas que apunten a ellas. Ademas imprime el contenido de
 * `gf_riego_kc` para poder decidir si sus 8 filas se pierden o se archivan.
 *
 * Uso: node scripts/checar_tablas_muertas.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const OBJETIVOS = [
  "gf_riego_kc",
  "gf_fertilizacion_cosecha_tipica",
  "gf_fertilizacion_fenologia",
  "gf_fertilizacion_fertilizantes",
  "gf_fertilizacion_programa",
];

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
if (!m) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: existen } = await db.query(
  `select c.relname, c.relkind
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1)
    order by c.relname`,
  [OBJETIVOS],
);

console.log("== tablas objetivo ==");
const KIND = { r: "tabla", v: "vista", m: "vista materializada", p: "tabla partida" };
for (const t of existen) {
  const { rows: n } = await db.query(`select count(*)::int as c from "${t.relname}"`);
  // El tipo importa: `drop table` no borra una vista y falla con
  // '"x" is not a table'. Las gf_riego_* son vistas desde la migracion 0039.
  console.log(
    `   ${t.relname.padEnd(34)} ${String(KIND[t.relkind] ?? t.relkind).padEnd(18)} filas=${n[0].c}`,
  );
}
const ausentes = OBJETIVOS.filter((o) => !existen.some((t) => t.relname === o));
if (ausentes.length) console.log(`   ya no existen: ${ausentes.join(", ")}`);

console.log("\n== funciones que las mencionan ==");
const { rows: fns } = await db.query(`
  select p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'`);
let fnDep = 0;
for (const f of fns) {
  const usadas = OBJETIVOS.filter((o) => f.def.includes(o));
  if (usadas.length) {
    fnDep++;
    console.log(`   ${f.proname} usa ${usadas.join(", ")}`);
  }
}
if (!fnDep) console.log("   ninguna");

console.log("\n== vistas que las mencionan ==");
const { rows: vws } = await db.query(
  `select table_name, view_definition from information_schema.views where table_schema = 'public'`,
);
let vwDep = 0;
for (const v of vws) {
  const usadas = OBJETIVOS.filter((o) => v.view_definition.includes(o));
  if (usadas.length) {
    vwDep++;
    console.log(`   ${v.table_name} usa ${usadas.join(", ")}`);
  }
}
if (!vwDep) console.log("   ninguna");

console.log("\n== claves foraneas que apuntan a ellas ==");
const { rows: fks } = await db.query(`
  select conrelid::regclass::text as desde, confrelid::regclass::text as hacia, conname
    from pg_constraint
   where contype = 'f' and confrelid::regclass::text = any($1)`, [OBJETIVOS]);
if (fks.length) for (const f of fks) console.log(`   ${f.desde} -> ${f.hacia} (${f.conname})`);
else console.log("   ninguna");

console.log("\n== triggers sobre ellas ==");
const { rows: trs } = await db.query(`
  select c.relname, t.tgname
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
   where not t.tgisinternal and c.relname = any($1)`, [OBJETIVOS]);
if (trs.length) for (const t of trs) console.log(`   ${t.relname}: ${t.tgname}`);
else console.log("   ninguno");

if (existen.some((t) => t.relname === "gf_riego_kc")) {
  console.log("\n== contenido de gf_riego_kc (8 filas) ==");
  const { rows } = await db.query(`select * from gf_riego_kc`);
  console.log(`   columnas: ${Object.keys(rows[0] ?? {}).join(", ")}`);
  for (const r of rows) console.log("   " + JSON.stringify(r));
}

await db.end();