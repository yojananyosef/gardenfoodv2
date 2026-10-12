/**
 * Puebla `fact_viabilidad_zona.razon` desde `lib/agronomy/viabilidad.ts`.
 *
 * Corre despues de la migracion 0048. Es idempotente: se puede volver a correr.
 *
 * NO cambia lo que ve el usuario. El codigo sigue leyendo el array; esto solo
 * deja la explicacion al lado del veredicto en la base.
 *
 * El mapeo de especie se hace con los tres nombres que tiene `dim_especies`:
 * `especie_id`, `especie` y `alias_riego`. El array usa el `dbKey`, que es el
 * nombre con mayusculas y a veces con especifico ("Avellano Europeo"). Si alguna
 * especie no se puede mapear, el script ABORTA: una fila con razon null sin
 * avisar es el mismo fallo silencioso que ya encontramos en `index.ts:99`.
 *
 * Uso: node scripts/poblar_razon_viabilidad.mjs [--dry-run]
 */
/**
 * Corta el array por nombre de especie, no por la coma de cierre.
 *
 * Antes usaba `/\n  "([^"]+)": \{\n([\s\S]*?)\n  \},/g`, que exige coma en el
 * cierre. El ultimo bloque del array cierra con `  }` sin coma, y el `.*?` sin
 *XuYu_HiuUibalado se comia bloques completos. Resultado: contaba 551 entradas
 * en vez de 600, poblababa 49 de menos, y el verificador que compartia el mismo
 * regex decia 'todo bien'. Un verificador que tiene el mismo error que lo que
 * verifica no verifica nada.
 *
 * Uso: node scripts/poblar_razon_viabilidad.mjs [--dry-run]
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");
const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const inicios = [...vTxt.matchAll(/\n  "([^"]+)": \{/g)];
const codigo = [];
for (let i = 0; i < inicios.length; i++) {
  const desde = inicios[i].index;
  const hasta = i + 1 < inicios.length ? inicios[i + 1].index : vTxt.length;
  const bloque = vTxt.slice(desde, hasta);
  for (const e of bloque.matchAll(/\n    (\d+): \{ v: "([^"]*)", razon: "((?:[^"\\]|\\.)*)" \}/g)) {
    codigo.push({
      dbKey: inicios[i][1],
      zona: Number(e[1]),
      v: e[2],
      razon: JSON.parse(`"${e[3]}"`),
    });
  }
}
console.log(`== ${codigo.length} entradas en el array (${inicios.length} especies) ==`);

// --- mapear dbKey -> especie_id ---
const { rows: especies } = await db.query(
  `select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel
     from dim_especies`,
);
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const porNorm = new Map();
for (const r of especies) {
  for (const c of [r.especie_id, r.especie, r.alias, r.excel]) if (c) porNorm.set(norm(c), r.especie_id);
}
const porExacto = new Map();
for (const r of especies) {
  if (r.especie) porExacto.set(r.especie, r.especie_id);
  if (r.alias) porExacto.set(r.alias, r.especie_id);
}

const resolver = (dbKey) => porExacto.get(dbKey) ?? porNorm.get(norm(dbKey)) ?? null;
const sinMapear = [...new Set(codigo.map((c) => c.dbKey))].filter((k) => !resolver(k));
if (sinMapear.length) {
  console.error(`\nABORTA: ${sinMapear.length} dbKey sin mapear: ${sinMapear.join(", ")}`);
  await db.end();
  process.exit(1);
}
console.log(`   las 30 especies se mapean\n`);

// --- cruzar con la tabla y ver que cambia ---
const { rows: actuales } = await db.query(
  `select v.clave, v.especie_id, v.zona_agro_id::int as zona, v.viabilidad, v.razon
     from fact_viabilidad_zona v`,
);
const idx = new Map(actuales.map((r) => [`${r.especie_id}|${r.zona}`, r]));

let aPoblar = 0;
let yaTenian = 0;
let cambia = 0;
let sinRazon = 0;
const ejemplosCambio = [];

for (const c of codigo) {
  const id = resolver(c.dbKey);
  const fila = idx.get(`${id}|${c.zona}`);
  if (!fila) continue;
  if (fila.razon === c.razon) yaTenian += 1;
  else {
    aPoblar += 1;
    if (fila.razon) {
      cambia += 1;
      if (ejemplosCambio.length < 5)
        ejemplosCambio.push(`   ${fila.clave}\n      en la base: "${fila.razon}"\n      en el array: "${c.razon}"`);
    }
  }
}
sinRazon = actuales.length - codigo.filter((c) => idx.has(`${resolver(c.dbKey)}|${c.zona}`)).length;

console.log(`== ${actuales.length} filas en fact_viabilidad_zona ==`);
console.log(`   ya con la misma razon : ${yaTenian}`);
console.log(`   a poblar              : ${aPoblar}`);
console.log(`   de las cuales, cambian : ${cambia}`);
for (const e of ejemplosCambio) console.log(e);
console.log(`\n   quedan SIN razon      : ${sinRazon}`);
const porZona = {};
for (const r of actuales) {
  if (!codigo.some((c) => idx.get(`${resolver(c.dbKey)}|${c.zona}`) === r)) {
    porZona[r.zona] = (porZona[r.zona] ?? 0) + 1;
  }
}
console.log(`   por zona              : ${JSON.stringify(porZona)}`);

if (DRY) {
  console.log("\n(dry-run, no se escribe)");
  await db.end();
  process.exit(0);
}

await db.query("begin");
try {
  let n = 0;
  for (const c of codigo) {
    const id = resolver(c.dbKey);
    const r = await db.query(
      `update fact_viabilidad_zona set razon = $1
        where especie_id = $2 and zona_agro_id = $3 and coalesce(razon, '') is distinct from $1`,
      [c.razon, id, c.zona],
    );
    n += r.rowCount;
  }
  console.log(`\n   filas actualizadas: ${n}`);
  await db.query("commit");
} catch (e) {
  await db.query("rollback");
  console.error(`\n   FALLO, se revirtió todo: ${e.message}`);
  await db.end();
  process.exit(1);
}

const { rows: check } = await db.query(`
  select count(*)::int as total,
         count(razon)::int as con_razon,
         count(*) filter (where razon = 'Viable')::int as solo_viable
    from fact_viabilidad_zona`);
console.log(`\n== verificacion ==`);
console.log(`   total ${check[0].total}   con razon ${check[0].con_razon}   ("Viable" exacto: ${check[0].solo_viable})`);

await db.end();