/**
 * Los dos huecos que dejaria migrar especies.ts a la base.
 *
 *  1. `clima`: el array lo tiene para las 30 especies, pero
 *     especies_ficha_bd20.clima_ideal solo para 20. Migrar asi perderia el
 *     clima de 10 especies, y no es algo que se note al developing: se nota
 *     cuando alguien busca una ficha y le sale vacio.
 *
 *  2. `descripcion`: el array la tiene para las 30. Hay que ver si
 *     especies_bc.observaciones realmente es lo mismo o si es otra cosa, porque
 *     si no lo son, migrar seria cambiar el texto que ve el usuario.
 *
 * Uso: node scripts/checar_clima_y_descripcion.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

console.log("== 1. CLIMA: 10 especies sin clima_ideal en la base ==");
const { rows: sinClima } = await db.query(`
  select d.especie_id, d.especie, f.clima_ideal, b.tipo_suelo, b.horas_frio
    from dim_especies d
    join especies_bc b on b.especie_id = d.especie_id
    left join especies_ficha_bd20 f on f.especie_id = d.especie_id
   where f.clima_ideal is null or btrim(f.clima_ideal) = ''
   order by d.especie_id`);
for (const e of sinClima) {
  console.log(`   ${e.especie_id.padEnd(20)} ${e.especie}`);
}

// Del array del codigo
const fuente = readFileSync("lib/agronomy/especies.ts", "utf8");
const climas = [...fuente.matchAll(/slug:\s*"([^"]+)"[\s\S]*?clima:\s*"([^"]*)"/g)];
console.log(`\n   el array tiene clima para ${climas.length} especies`);
console.log("   ejemplo de lo que dice el array para esas 10:");
for (const e of sinClima) {
  const c = climas.find((x) => x[1] === e.especie_id || e.especie_id.startsWith(x[1]));
  if (c) console.log(`      ${e.especie_id.padEnd(20)} "${c[2].slice(0, 60)}"`);
}

console.log("\n\n== 2. DESCRIPCION: observaciones vs descripcion del array ==");
const { rows: obs } = await db.query(`
  select d.especie_id, d.especie, b.observaciones
    from dim_especies d join especies_bc b on b.especie_id = d.especie_id
   order by d.especie_id limit 6`);
for (const o of obs) {
  console.log(`   ${o.especie_id}`);
  console.log(`      observaciones: ${String(o.observaciones ?? "(null)").slice(0, 110)}`);
}
const descs = [...fuente.matchAll(/slug:\s*"([^"]+)"[\s\S]*?descripcion:\s*"([^"]*)"/g)];
console.log(`\n   descripcion del array (${descs.length} especies):`);
for (const d of descs.slice(0, 6)) {
  console.log(`      ${d[1].padEnd(20)} "${d[2].slice(0, 90)}"`);
}

// Solapamiento literal: cuantas descripciones del array aparecen tal cual en
// observaciones. Si el solapamiento es 0, son textos distintos.
const { rows: todasObs } = await db.query(`select observaciones from especies_bc`);
const conjunto = new Set(todasObs.map((o) => String(o ?? "").trim()).filter(Boolean));
const iguales = descs.filter((d) => conjunto.has(d[2].trim()));
console.log(`\n   descripciones del array que aparecen EXACTAS en observaciones: ${iguales.length} de ${descs.length}`);

const { rows: nulos } = await db.query(
  `select count(*)::int as n from especies_bc where observaciones is null or btrim(observaciones) = ''`,
);
console.log(`   especies_bc con observaciones vacia: ${nulos[0].n} de 30`);

await db.end();