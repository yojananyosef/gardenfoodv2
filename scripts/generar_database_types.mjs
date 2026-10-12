/**
 * Genera `types/database.types.ts` desde el esquema real de Postgres.
 *
 * Por que no `supabase gen types`: ese comando pide la API key `service_role`
 * para leer el esquema, y este proyecto no la usa para nada. Acá se
 * introspecciona por SQL con `DATABASE_URL` (el mismo pooler de
 * `scripts/aplicar_migraciones.mjs`), que ya esta en `.env.local` y en
 * `.gitignore`.
 *
 * Por que importa: sin esto, `.from("dim_zonas_agro").select("tx_max_enero")`
 * es una cadena suelta y un typo (`tx_max_eneroo`) compila igual y devuelve
 * `null` en runtime. Con los tipos, el typo no compila.
 *
 * El archivo es GENERADO: no se edita a mano. Para regenerar:
 *   node scripts/generar_database_types.mjs
 */
import pg from "pg";
import { writeFileSync } from "node:fs";

const SALIDA = "types/database.types.ts";

/** Postgres -> TypeScript. Los text[] y companyas salen del `_` del udt_name. */
function ts(udt, nullable) {
  const base = tipo(udt);
  const t = nullable ? `${base} | null` : base;
  return t;
}

function tipo(udt) {
  // Los arrays vienen como _int4, _text, etc.
  if (udt.startsWith("_")) {
    const interno = tipo(udt.slice(1));
    // Los arrays de enumerados y compuestos no existen todavia (0 enums).
    return `${interno === "Json" ? "Json" : interno}[]`;
  }
  switch (udt) {
    case "int2":
    case "int4":
    case "int8":
    case "float4":
    case "float8":
    case "numeric":
    case "money":
      return "number";
    case "bool":
      return "boolean";
    case "json":
    case "jsonb":
      return "Json";
    case "date":
    case "time":
    case "timetz":
    case "timestamp":
    case "timestamptz":
      return "string";
    default:
      // text, varchar, uuid, bytea, name, y cualquier dominio de PostGIS.
      return "string";
  }
}

/**
 * Convierte la firma de Postgres que devuelve `pg_get_function_identity_arguments`
 * ("p_meses integer, p_lote integer") en un objeto de TypeScript.
 */
function argsTs(args) {
  const limpio = String(args || "").trim();
  if (!limpio) return "Record<string, never>";
  const campos = limpio.split(",").map((p) => {
    const partes = p.trim().split(/\s+/);
    const nombre = partes[0].replace(/^"|"$/g, "");
    const tipo = partes.slice(1).join(" ") || "unknown";
    return `${JSON.stringify(nombre)}: ${tipoDe(tipo)}`;
  });
  return `{ ${campos.join("; ")} }`;
}

/** El tipo de retorno, que Postgres devuelve como texto plano. */
function retornoTs(r) {
  const v = String(r || "").trim();
  if (!v) return "unknown";
  // Las funciones trigger no devuelven nada consultable.
  if (v === "trigger") return "unknown";
  if (/^(TABLE|SETOF|record)\b/i.test(v)) return "Json[]";
  return tipoDe(v);
}

/** Un nombre de tipo de Postgres suelto (de una firma o de un retorno). */
function tipoDe(udt) {
  const u = String(udt).trim().replace(/\[\]$/, "");
  const mapa = {
    int2: "number", int4: "number", int8: "number", integer: "number", bigint: "number",
    smallint: "number", numeric: "number", decimal: "number", real: "number",
    "double precision": "number", float4: "number", float8: "number", money: "number",
    bool: "boolean", boolean: "boolean",
    json: "Json", jsonb: "Json",
    void: "unknown", trigger: "unknown", record: "Json",
  };
  if (mapa[u]) return mapa[u];
  if (u.endsWith("[]")) return `${tipoDe(u.slice(0, -2))}[]`;
  return "string";
}

function leerEnv() {
  const buf = [];
  try {
    buf.push(readFileSyncRaw(".env.local"));
  } catch {}
  const m = /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(buf.join("\n"));
  return m ? m[1].trim() : process.env.DATABASE_URL;
}

import { readFileSync } from "node:fs";
function readFileSyncRaw(p) {
  return readFileSync(p, "utf8");
}

const url = leerEnv();
if (!url) {
  console.error("Falta DATABASE_URL en .env.local o en el entorno.\n");
  process.exit(1);
}

const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();

// ---------------------------------------------------------------- tablas
const { rows: tablas } = await db.query(`
  select c.relname as name, c.relkind as kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','v','p')
  order by c.relname
`);

const { rows: columnas } = await db.query(`
  select c.table_name, c.column_name, c.udt_name, c.is_nullable, c.column_default, c.ordinal_position
  from information_schema.columns c
  join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
  where c.table_schema = 'public' and t.table_type in ('BASE TABLE','VIEW')
  order by c.table_name, c.ordinal_position
`);

// ---------------------------------------------------------------- claves foraneas
const { rows: fks } = await db.query(`
  select
    tc.table_name,
    kcu.column_name,
    ccu.table_name  as foreign_table_name,
    ccu.column_name as foreign_column_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
  order by tc.table_name, kcu.column_name
`);

// ---------------------------------------------------------------- funciones
const { rows: funciones } = await db.query(`
  select p.proname as name,
         pg_get_function_identity_arguments(p.oid) as args,
         pg_get_function_result(p.oid) as returns,
         l.lanname as lang
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where n.nspname = 'public'
  order by p.proname
`);

// ---------------------------------------------------------------- enums
const { rows: enums } = await db.query(`
  select t.typname as name, e.enumlabel as value
  from pg_type t
  join pg_namespace n on n.oid = t.typnamespace
  join pg_enum e on e.enumtypid = t.oid
  where n.nspname = 'public'
  order by t.typname, e.enumsortorder
`);

// ---------------------------------------------------------------- armado
const porTabla = new Map();
for (const col of columnas) {
  if (!porTabla.has(col.table_name)) porTabla.set(col.table_name, []);
  porTabla.get(col.table_name).push(col);
}
const fkPorTabla = new Map();
for (const f of fks) {
  if (!fkPorTabla.has(f.table_name)) fkPorTabla.set(f.table_name, []);
  fkPorTabla.get(f.table_name).push(f);
}

/** Una columna que hay que escribir al insertar: no tiene default y no acepta null. */
const obligatoria = (c) => c.is_nullable === "NO" && c.column_default === null;

function bloqueRelaciones(nombre) {
  const lista = fkPorTabla.get(nombre) || [];
  if (!lista.length) return "        Relationships: []";
  const lineas = lista.map(
    (f) =>
      `        {\n` +
      `          foreignKeyName: "fk_${f.table_name}_${f.column_name}_${f.foreign_table_name}_${f.foreign_column_name}"\n` +
      `          columns: [${JSON.stringify(f.column_name)}]\n` +
      `          isOneToOne: false\n` +
      `          referencedRelation: ${JSON.stringify(f.foreign_table_name)}\n` +
      `          referencedColumns: [${JSON.stringify(f.foreign_column_name)}]\n` +
      `        }`,
  );
  return `        Relationships: [\n${lineas.join(",\n")}\n        ]`;
}

function bloqueTabla(nombre, cols) {
  const row = cols.map((c) => `        ${JSON.stringify(c.column_name)}: ${ts(c.udt_name, c.is_nullable === "YES")}`);
  const ins = cols.map(
    (c) =>
      `        ${JSON.stringify(c.column_name)}${obligatoria(c) ? "" : "?"}: ${ts(c.udt_name, c.is_nullable === "YES" || !obligatoria(c))}`,
  );
  const upd = cols.map((c) => `        ${JSON.stringify(c.column_name)}?: ${ts(c.udt_name, c.is_nullable === "YES" || c.column_default === null)}`);
  return (
    `      ${nombre}: {\n` +
    `        Row: {\n${row.join("\n")}\n        }\n` +
    `        Insert: {\n${ins.join("\n")}\n        }\n` +
    `        Update: {\n${upd.join("\n")}\n        }\n` +
    `${bloqueRelaciones(nombre)}\n` +
    `      }`
  );
}

const base = tablas.filter((t) => t.kind !== "v");
const vistas = tablas.filter((t) => t.kind === "v");

const cuerpo = [
  "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]",
  "",
  "export type Database = {",
  "  public: {",
  "    Tables: {",
  ...base.map((t) => bloqueTabla(t.name, porTabla.get(t.name) || [])),
  "    }",
  "    Views: {",
  ...vistas.map((t) => {
    const cols = porTabla.get(t.name) || [];
    const row = cols.map((c) => `        ${JSON.stringify(c.column_name)}: ${ts(c.udt_name, c.is_nullable === "YES")}`);
    return `      ${t.name}: {\n        Row: {\n${row.join("\n")}\n        }\n        Relationships: []\n      }`;
  }),
  "    }",
  "    Functions: {",
  ...funciones.map(
    (f) =>
      `      ${f.name}: {\n` +
      `        Args: ${argsTs(f.args)}\n` +
      `        Returns: ${retornoTs(f.returns)}\n` +
      `      }`,
  ),
  "    }",
  "    Enums: {",
  "      " +
    (enums.length
      ? [...new Set(enums.map((e) => e.name))]
          .map((n) => `${n}: ${enums.filter((e) => e.name === n).map((e) => JSON.stringify(e.value)).join(" | ")}`)
          .join("\n      ")
      : `never: never`),
  "    }",
  "    CompositeTypes: {",
  "      never: never",
  "    }",
  "  }",
  "}",
  "",
].join("\n");

writeFileSync(
  SALIDA,
  `/**\n * GENERADO por scripts/generar_database_types.mjs. No editar a mano.\n *\n * Refleja el esquema de Postgres en el momento de correrlo. Para cambiarlo,\n * se cambia la migracion y se regenera.\n */\n\n${cuerpo}`,
  "utf8",
);

await db.end();

console.log(
  `${SALIDA}: ${base.length} tablas, ${vistas.length} vistas, ${funciones.length} funciones, ` +
    `${new Set(enums.map((e) => e.name)).size} enums, ${fks.length} claves foraneas`,
);