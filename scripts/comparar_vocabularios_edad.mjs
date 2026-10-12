/**
 * Estado de los vocabularios de edad de la Fase 10.5.
 *
 * El plan dice que hay dos vocabularios para lo mismo: `gf_arboles.edad_clase`
 * con codigos cortos y `gf_riego_edad.nombre` con rotulos largos, y que se
 * unifiquen en `dim_edad`.
 *
 * El realidad habia TRES, y el tercero no estaba en ninguna tabla: dos mapas
 * escritos a mano en `components/huerto/EditarArbolDialog.tsx` que traducian
 * entre `dim_edad.edad_n` (1-4) y el codigo corto. La 0041 guardó el numero y
 * los borro.
 *
 * Este script sirve antes y despues: detecta que columna existe y arma el
 * informe del estado que encuentre, asi que no queda atado a una version.
 *
 * Uso: node scripts/comparar_vocabularios_edad.mjs
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
const pedir = async (sql, params = []) => (await db.query(sql, params)).rows;

console.log("== dim_edad (la tabla canonica) ==");
const dim = await pedir("select * from dim_edad order by edad_n");
for (const r of dim) {
  console.log(
    `   edad_n=${r.edad_n}  edad=${JSON.stringify(r.edad)}  factor_litros=${r.factor_litros}  factor_dias=${r.factor_dias}`,
  );
}

console.log("\n== gf_riego_edad (vista de compatibilidad, leida por la app) ==");
for (const r of await pedir("select * from gf_riego_edad order by n")) {
  console.log(`   ${JSON.stringify(r)}`);
}

console.log("\n== columnas de edad en gf_arboles ==");
const cols = await pedir(`
  select column_name, data_type from information_schema.columns
   where table_name = 'gf_arboles' and column_name like '%edad%'`);
console.log(`   ${cols.map((c) => `${c.column_name} (${c.data_type})`).join(", ") || "(ninguna)"}`);

const tieneEdadN = cols.some((c) => c.column_name === "edad_n");
const tieneClase = cols.some((c) => c.column_name === "edad_clase");
const columna = tieneEdadN ? "edad_n" : "edad_clase";

console.log(`\n== gf_arboles.${columna}: valores reales ==`);
const reales = await pedir(
  `select coalesce("${columna}"::text, '(null)') as valor, count(*)::int as n
     from gf_arboles group by 1 order by n desc, 1`,
);
for (const r of reales) console.log(`   ${String(r.valor).padEnd(18)} ${r.n} arboles`);

console.log("\n== claves foraneas de gf_arboles ==");
const fk = await pedir(`
  select conname, convalidated, conrelid::regclass::text as rel,
         (select string_agg(att.attname, ', ' order by k.ord)
            from unnest(con.conkey) with ordinality as k(attnum, ord)
            join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k.attnum) as columnas
    from pg_constraint con where con.conrelid = 'gf_arboles'::regclass and con.contype = 'f'
   order by con.conname`);
if (fk.length) for (const f of fk) console.log(`   ${f.conname} (${f.columnas}) validada=${f.convalidated}`);
else console.log("   ninguna");

console.log("\n== cruce: cada valor contra dim_edad ==");
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]/g, "");
const porNombre = new Map(dim.map((d) => [norm(d.edad), d]));
const porN = new Map(dim.map((d) => [String(d.edad_n), d]));
let sinMapeo = 0;
for (const r of reales) {
  if (r.valor === "(null)") {
    console.log(`   ${"(null)".padEnd(18)} -> sin edad elegida  ${r.n} arboles`);
    continue;
  }
  const d = porNombre.get(norm(r.valor)) ?? porN.get(String(r.valor));
  if (d) console.log(`   ${String(r.valor).padEnd(18)} -> ${d.edad} (edad_n=${d.edad_n})  ${r.n} arboles`);
  else {
    sinMapeo += r.n;
    console.log(`   ${String(r.valor).padEnd(18)} -> SIN MAPEO  ${r.n} arboles`);
  }
}

console.log("\n== estado ==");
console.log(`   edad_n: ${tieneEdadN ? "si" : "NO"}    edad_clase: ${tieneClase ? "si" : "NO"}`);
if (tieneEdadN && !tieneClase) console.log("   OK: un solo vocabulario, el numero de dim_edad, con FK.");
else if (tieneClase) console.log("   PENDIENTE: la 0041 todavia no se aplico.");
if (sinMapeo) console.log(`   *** ${sinMapeo} arboles con un valor que no mapea a dim_edad.`);

await db.end();