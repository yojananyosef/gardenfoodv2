/**
 * Exporta el esquema a `data/esquema.json`, que es lo que dibuja `/esquema`.
 *
 * Sale de la base, no de una copia: si mañana se agrega una tabla, se regenera
 * y el diagrama la muestra. `node scripts/generar_esquema_json.mjs`.
 *
 * Lleva de cada tabla lo que hace falta para dibujarla bien: sus columnas, cual
 * es la primaria, cuales son foraneas y hacia donde apuntan, y a que familia
 * pertenece. Eso ultimo es lo que permite colorearlas por rol y ordenarlas de
 * forma que se vea la normalizacion: las dimensiones a la izquierda, los hechos
 * a la derecha, y las lineas cruzando.
 */
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(readFileSync(".env.local", "utf8"));
const db = new pg.Client({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: tablas } = await db.query(`
  select c.relname::text as tabla,
         obj_description(c.oid) as comentario,
         (xpath('/row/c/text()',
           query_to_xml(format('select count(*) as c from %I.%I',
                               'public', c.relname), false, true, '')))[1]::text::int as filas
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
   order by c.relname`);

const { rows: columnas } = await db.query(`
  select table_name, column_name, data_type, is_nullable, ordinal_position
    from information_schema.columns
   where table_schema = 'public'
     and table_name = any($1)
   order by table_name, ordinal_position`, [tablas.map((t) => t.tabla)]);

const { rows: pks } = await db.query(`
  select t.relname::text as tabla, a.attname as columna
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    cross join lateral unnest(c.conkey) as k(attnum)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
   where c.contype = 'p' and n.nspname = 'public'`);

const { rows: fks } = await db.query(`
  select c.conrelid::regclass::text as tabla,
         c.confrelid::regclass::text as destino,
         (select string_agg(a.attname, ',' order by k.ord)
            from unnest(c.conkey) with ordinality as k(attnum, ord)
            join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum) as columnas
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
   where c.contype = 'f' and n.nspname = 'public'`);

await db.end();

const pkDe = new Map();
for (const p of pks) {
  if (!pkDe.has(p.tabla)) pkDe.set(p.tabla, new Set());
  pkDe.get(p.tabla).add(p.columna);
}

// A que familia pertenece cada tabla. Determina el color y la posicion.
const FAMILIAS = [
  ["dim", /^dim_/],
  ["fact", /^fact_/],
  ["especies", /^especies_/],
  ["cat", /^cat_/],
  ["gf", /^(gf_|perfiles$)/],
];
function familia(nombre) {
  if (nombre === "perfiles") return "gf";
  for (const [f, re] of FAMILIAS) if (re.test(nombre)) return f;
  return "gf";
}

const fkPorTabla = new Map();
for (const f of fks) {
  for (const c of f.columnas.split(",")) {
    if (!fkPorTabla.has(f.tabla)) fkPorTabla.set(f.tabla, []);
    fkPorTabla.get(f.tabla).push({ columna: c, destino: f.destino });
  }
}

const porTabla = new Map();
for (const c of columnas) {
  if (!porTabla.has(c.table_name)) porTabla.set(c.table_name, []);
  porTabla.get(c.table_name).push(c);
}

const salida = tablas.map((t) => ({
  tabla: t.tabla,
  familia: familia(t.tabla),
  filas: t.filas,
  descripcion: t.comentario,
  columnas: (porTabla.get(t.tabla) ?? []).map((c) => ({
    nombre: c.column_name,
    tipo: c.data_type,
    pk: pkDe.get(t.tabla)?.has(c.column_name) ?? false,
    fk: (fkPorTabla.get(t.tabla) ?? []).find((f) => f.columna === c.column_name)?.destino ?? null,
  })),
}));

writeFileSync(
  "data/esquema.json",
  JSON.stringify({ generado: new Date().toISOString(), tablas: salida }, null, 2),
  "utf8",
);

const porFam = {};
for (const t of salida) (porFam[t.familia] ??= []).push(t.tabla);
console.log(`data/esquema.json: ${salida.length} tablas, ${columnas.length} columnas, ${fks.length} FKs`);
for (const [f, ts] of Object.entries(porFam)) console.log(`   ${f}: ${ts.length}`);