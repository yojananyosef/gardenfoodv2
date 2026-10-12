/**
 * Busca de verdad por que el `alter type` choca con una politica.
 *
 * `pg_policies` filtra por privilegios y se le escapan cosas. El catalogo real
 * es `pg_policy`, asi que se lee ese. Ademas el error puede venir de una politica
 * de OTRA tabla que mencione la columna, o de un dominio/`check` que la use, no
 * solo de la misma tabla.
 *
 * Tambien imprime la definicion de `is_admin()`, que aparece en tres politicas
 * sin tocar ninguna columna: si su cuerpo llegara a leer una de las que se
 * castean, seria la causa escondida.
 *
 * Uso: node scripts/diagnosticar_bloqueo_enum.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const COLUMNAS = ["event_category", "event_name", "screen", "payment_status"];

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

console.log("== TODAS las politicas del usuario postgres, sin filtrar ==");
const { rows: todas } = await db.query(`
  select n.nspname as esquema, c.relname as tabla, p.polname as nombre, p.polcmd::text as cmd
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   order by c.relname, p.polname`);
console.log(`   ${todas.length} en total`);
for (const p of todas) {
  const usa = COLUMNAS.filter((col) => p.nombre.toLowerCase().includes(col));
  console.log(`   ${p.tabla}.${p.nombre}  (${p.cmd})  ${usa.length ? "*** " + usa.join(",") + " ***" : ""}`);
}

console.log("\n== dependencias reales (pg_depend) sobre esas columnas ==");
const { rows: deps } = await db.query(`
  select d.classid::regclass::text as clase, d.refclassid::regclass::text as ref_clase,
         d.objid::regclass::text as objeto, d.deptype
    from pg_depend d
    join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
   where d.refclassid = 'pg_class'::regclass
     and a.attname = any($1)`, [COLUMNAS]);
if (deps.length) for (const d of deps) console.log(`   ${d.clase} obj=${d.objeto} deptype=${d.deptype}`);
else console.log("   ninguna");

console.log("\n== definicion de is_admin() ==");
const { rows: fn } = await db.query(
  `select pg_get_functiondef(p.oid) as def from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace where n.nspname='public' and p.proname='is_admin'`,
);
console.log(fn.length ? fn[0].def : "   no existe");

console.log("\n== constraints que mencionan las columnas ==");
const { rows: cons } = await db.query(`
  select conname, pg_get_constraintdef(oid) as def from pg_constraint
   where pg_get_constraintdef(oid) ~* '(event_category|event_name|payment_status|\\.screen)'`);
if (cons.length) for (const c of cons) console.log(`   ${c.conname}: ${c.def}`);
else console.log("   ninguno");

await db.end();
