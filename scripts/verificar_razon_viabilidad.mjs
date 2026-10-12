/**
 * Verifica `fact_viabilidad_zona.razon` con el parser CORREGIDO.
 *
 * La version anterior de esto usaba el mismo regex roto que el script que
 * pobla, asi que los dos secian '551 de 600, y 49 sin razon, que es lo
 * esperado': uno se comia 49 entradas y el otro se comia las mismas 49, y
 * quedaban de acuerdo. Un verificador que comparte el error con lo que
 * verifica no verifica nada.
 *
 * Ahora el corte es por nombre de especie, y ademas se cuenta el total de
 * entradas del archivo para que una regresion en el parser se vea.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const vTxt = readFileSync("lib/agronomy/viabilidad.ts", "utf8").replace(/\r\n/g, "\n");
const inicios = [...vTxt.matchAll(/\n  "([^"]+)": \{/g)];
const codigo = [];
for (let i = 0; i < inicios.length; i++) {
  const desde = inicios[i].index;
  const hasta = i + 1 < inicios.length ? inicios[i + 1].index : vTxt.length;
  for (const e of vTxt
    .slice(desde, hasta)
    .matchAll(/\n    (\d+): \{ v: "([^"]*)", razon: "((?:[^"\\]|\\.)*)" \}/g)) {
    codigo.push({
      dbKey: inicios[i][1],
      zona: Number(e[1]),
      v: e[2],
      razon: JSON.parse(`"${e[3]}"`),
    });
  }
}

const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const { rows: esp } = await db.query(
  `select especie_id, especie, coalesce(alias_riego,'') as alias, coalesce(nombre_en_excel_riego,'') as excel from dim_especies`,
);
const mapa = new Map();
for (const e of esp) {
  for (const c of [e.especie, e.alias, e.excel, e.especie_id]) if (c) mapa.set(c, e.especie_id);
  mapa.set(norm(e.especie), e.especie_id);
  if (e.alias) mapa.set(norm(e.alias), e.especie_id);
}
const resolver = (k) => mapa.get(k) ?? mapa.get(norm(k));

const { rows: filas } = await db.query(`
  select especie_id, zona_agro_id::int as zona, viabilidad, razon from fact_viabilidad_zona`);
const idx = new Map(filas.map((r) => [`${r.especie_id}|${r.zona}`, r]));

console.log("== el parser ==");
console.log(`   especies: ${inicios.length}   entradas leidas: ${codigo.length} (esperado ${inicios.length * 20})`);
console.log(`   ${codigo.length === inicios.length * 20 ? "completo" : "INCOMPLETO: al parser se le escapan entradas"}`);

let malas = 0;
const sinFila = [];
const sinRazon = [];
const cambiosV = [];
for (const c of codigo) {
  const id = resolver(c.dbKey);
  const f = id ? idx.get(`${id}|${c.zona}`) : null;
  if (!f) {
    sinFila.push(`${c.dbKey} z${c.zona}`);
    continue;
  }
  if (f.razon !== c.razon) {
    malas += 1;
    if (malas <= 3) sinRazon.push(`${f.especie_id}|${f.zona}: "${String(f.razon ?? "(null)").slice(0, 40)}" vs "${c.razon.slice(0, 40)}"`);
  }
  if (norm(f.viabilidad) !== norm(c.v)) cambiosV.push(`${f.especie_id}|${f.zona}: ${c.v} vs ${f.viabilidad}`);
}

const huerfanas = filas.filter((r) => !codigo.some((c) => resolver(c.dbKey) && idx.get(`${resolver(c.dbKey)}|${c.zona}`) === r));

console.log("\n== razon ==");
console.log(`   filas que no coinciden: ${malas}`);
for (const s of sinRazon) console.log(`      ${s}`);
console.log(`   filas de la base que el array no cubre: ${huerfanas.length}`);
for (const h of huerfanas.slice(0, 5)) console.log(`      ${h.especie_id} z${h.zona}`);
console.log(`   sin razon: ${filas.filter((r) => r.razon === null).length}`);

console.log("\n== viabilidad ==");
console.log(`   veredictos distintos: ${cambiosV.length}`);
for (const c of cambiosV.slice(0, 5)) console.log(`      ${c}`);

const ok = malas === 0 && huerfanas.length === 0 && codigo.length === inicios.length * 20 && filas.filter((r) => r.razon === null).length === 0;
console.log(`\n${ok ? "OK: las 600 entradas del array estan en la base, con su razon" : "HAY QUE REVISAR"}`);

await db.end();