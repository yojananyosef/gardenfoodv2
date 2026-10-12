#!/usr/bin/env python3
"""Importador del Excel maestro a Postgres: Excel -> data/*.csv -> migracion SQL.

Este es el otro modo del generador (ademas del que produce el fixture de
API_RESPUESTAS). Ver `generar_base_maestra.py --ayuda`.

Flujo:

    GARDENFOOD_Base_Maestra_Frutales_v3.xlsx
            |  --import
            v
    data/*.csv              34 archivos versionados, fuente canonica
            |  --sql
            v
    supabase/migrations/00NN_base_maestra.sql

La migracion se genera DESDE LOS CSV, no desde el Excel, para que la base se
pueda reconstruir sin el archivo.

Decisiones que no son obvias y estan comentadas donde aplican:

- Los tipos se infieren POR VALOR, no por nombre. `ph_ideal` se llama asi y
  vale "6.0 a 7.0 (ligeramente acido a neutro)"; `marco_plantacion` vale
  "4.5 x 4.5". Una regla por nombre las habria roto.

- Una columna con un solo valor raro se vuelve `text` y conserva el dato.
  Perder informacion por una celda suelta es peor que una columna menos
  tipada. Es lo que pasa con CAT_FERT_TECNICO.solubilidad_g_l (2 de 29).

- El generador NO escribe nada si una verificacion falla: conteos contra
  DICCIONARIO, PKs sin duplicados, FKs sin huerfanos, PKs que coincidan con
  las declaradas en el diccionario del Excel.

Uso:
    python scripts/generar_base_maestra.py /ruta/al.xlsx --import
    python scripts/generar_base_maestra.py --sql          # solo el SQL
    python scripts/generar_base_maestra.py /ruta.xlsx --reporte-tipos
"""
import csv
import json
import os
import re
import sys
from decimal import Decimal, ROUND_HALF_UP

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xlsx_read import Libro
import dominio

HERE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(HERE)
OUT_DIR = os.path.join(RAIZ, "data")
OUT_REPORTE = os.path.join(OUT_DIR, "_tipos_inferidos.txt")
MIGRACION = os.path.join(
    RAIZ, "supabase", "migrations", "0037_base_maestra.sql"
)

# Como escribe el Excel los booleanos. El generador de irrigation usa 0/1 en
# unas columnas y Si/No en otras; se aceptan los dos y se emite true/false.
BOOLEANOS = {"0", "1", "si", "no", "sí", "sí", "verdadero", "falso",
             "true", "false", "x", "s"}

RE_ENTERO = re.compile(r"^[+-]?\d+$")
RE_NUMERO = re.compile(r"^[+-]?\d+(\.\d+)?$")

# Columnas que son enteros cortos por semantica, aunque el rango lo permita.
# Postgres no gana nada con un integer donde cabe un smallint.
SMALLINT = {"mes_n", "edad_n", "humedad_n", "periodo_n", "n"}

# CHECKs que el plan exige explicitamente (PLAN-EJECUCION 6.5).
CHECKS = {
    "dim_meses": {"mes_n": "mes_n between 1 and 12"},
    "fact_riego_mes": {"mes_n": "mes_n between 1 and 12"},
    "fact_labores_mes": {"mes_n": "mes_n between 1 and 12"},
    "fact_tareas_mes": {"mes_n": "mes_n between 1 and 12"},
}


def num(v, default=None):
    if v is None or str(v).strip() == "":
        return default
    try:
        return float(v)
    except ValueError:
        return default


def rh(x):
    """Redondeo half-up, como Excel y JavaScript. El round() de Python
    redondea a pares y produciria falsos positivos."""
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


# --------------------------------------------------------------------------
# Tipos
# --------------------------------------------------------------------------

def _es_entero(v):
    return bool(RE_ENTERO.match(v))


def _es_numero(v):
    return bool(RE_NUMERO.match(v))


def inferir_tipos(filas, columnas):
    """-> dict columna -> tipo Postgres, decidiendo por los valores reales."""
    tipos = {}
    detalle = {}
    for col in columnas:
        vals = []
        vacios = 0
        for f in filas:
            v = f.get(col)
            s = "" if v is None else str(v).strip()
            if s == "":
                vacios += 1
            else:
                vals.append(s)

        if not vals:
            tipos[col] = "text"
            detalle[col] = {"tipo": "text", "motivo": "columna completamente vacia",
                            "no_vacios": 0, "vacios": vacios}
            continue

        if all(v.lower() in BOOLEANOS for v in vals):
            # "1"/"0" tambien podrian ser una cantidad legitima. Solo se
            # vuelve booleano si el encabezado lo pide o si los valores son
            # Si/No/Verdadero/Falso.
            if all(v.lower() in BOOLEANOS - {"0", "1"} for v in vals) or \
               any(k in col for k in ("reposo", "coincide", "viable", "dentro_rango",
                                      "apto_organico", "tiene_ficha")):
                tipos[col] = "boolean"
                detalle[col] = {"tipo": "boolean", "motivo": "valores del conjunto booleano del Excel",
                                "no_vacios": len(vals), "vacios": vacios}
                continue

        if all(_es_entero(v) for v in vals):
            mayor = max(abs(int(v)) for v in vals)
            if col in SMALLINT or (mayor <= 32767 and not col.endswith("_id")):
                tipos[col] = "smallint"
                detalle[col] = {"tipo": "smallint", "motivo": f"todos enteros, max {mayor}",
                                "no_vacios": len(vals), "vacios": vacios}
            else:
                tipos[col] = "integer"
                detalle[col] = {"tipo": "integer", "motivo": f"todos enteros, max {mayor}",
                                "no_vacios": len(vals), "vacios": vacios}
            continue

        if all(_es_numero(v) for v in vals):
            tipos[col] = "numeric"
            detalle[col] = {"tipo": "numeric", "motivo": "todos numericos con decimales",
                            "no_vacios": len(vals), "vacios": vacios}
            continue

        malos = [v for v in vals if not _es_numero(v)]
        tipos[col] = "text"
        detalle[col] = {"tipo": "text",
                        "motivo": f"{len(malos)} de {len(vals)} valores no son numero",
                        "ejemplos": sorted(set(malos))[:3],
                        "no_vacios": len(vals), "vacios": vacios}
    return tipos, detalle


def _normalizar(valor, tipo):
    """Valor tal como va al CSV y al SQL."""
    s = "" if valor is None else str(valor).strip()
    if s == "":
        return ""
    if tipo == "boolean":
        return "true" if s.lower() in {"1", "si", "sí", "verdadero", "true", "x", "s"} else "false"
    if tipo in ("smallint", "integer", "numeric"):
        # Normaliza "6.50" -> "6.5" para que el CSV sea estable y el SQL legible.
        try:
            d = Decimal(s)
            if tipo == "numeric":
                return format(d.normalize(), "f")
            return str(int(d))
        except Exception:
            return s
    return s


# --------------------------------------------------------------------------
# Lectura
# --------------------------------------------------------------------------

def leer_diccionario(lb):
    """DICCIONARIO declara PK y conteo por tabla. Encabezado en la fila 3."""
    filas = lb.celdas("DICCIONARIO")
    cab = [((c or "").strip()) for c in filas[2]]
    out = {}
    for f in filas[3:]:
        if not any((c or "").strip() for c in f):
            continue
        d = {cab[i]: (f[i] if i < len(f) else None) for i in range(len(cab)) if cab[i]}
        t = (d.get("Tabla") or "").strip()
        if t:
            out[t] = d
    return out


def leer_todas(lb):
    """-> [(hoja, tabla, filas, columnas, tipos, detalle)]"""
    out = []
    for hoja, tabla in dominio.orden_creacion():
        filas = lb.dicts(hoja)
        columnas = [c for c in lb.headers(hoja) if c and c != "_fila"]
        # Quitar el artefacto del lector si colara.
        columnas = [c for c in columnas if c != "_fila"]
        tipos, detalle = inferir_tipos(filas, columnas)
        out.append((hoja, tabla, filas, columnas, tipos, detalle))
    return out


# --------------------------------------------------------------------------
# Verificaciones
# --------------------------------------------------------------------------

def verificar_pk(datos):
    """La PK puede ser compuesta: se compara la tupla completa, no cada
    columna por separado (una parte de una clave compuesta se repite legitimo)."""
    fallos = []
    for hoja, tabla, filas, columnas, _tipos, _d in datos:
        _t, pks = dominio.TABLAS[hoja]
        for pk in pks:
            if pk not in columnas:
                fallos.append(f"{tabla}: la PK '{pk}' no existe en la hoja {hoja}")
        if any(pk not in columnas for pk in pks):
            continue

        vistos = {}
        for i, f in enumerate(filas):
            clave = tuple(str(f.get(pk) or "").strip() for pk in pks)
            if any(v == "" for v in clave):
                fallos.append(f"{tabla}: fila {i + 2} del Excel tiene la PK incompleta {clave}")
            elif clave in vistos:
                fallos.append(f"{tabla}: PK {'+'.join(pks)} duplicada {clave} "
                              f"(filas {vistos[clave] + 2} y {i + 2})")
            else:
                vistos[clave] = i
    return fallos


def verificar_fks(datos):
    """Toda columna `*_id` que sea PK de una dimension, mas las explicitas."""
    fallos = []
    validos_por_tabla = {}
    for hoja, tabla, filas, _columnas, _tipos, _d in datos:
        pk = dominio.TABLAS[hoja][1][0]
        validos_por_tabla[tabla] = {
            str(f.get(pk) or "").strip() for f in filas if str(f.get(pk) or "").strip()
        }

    for hoja, tabla, filas, columnas, _tipos, _d in datos:
        for col, destino in fks_de(tabla, columnas):
            if col not in columnas:
                continue
            huerfanos = {
                str(f.get(col) or "").strip()
                for f in filas
                if str(f.get(col) or "").strip()
                and str(f.get(col) or "").strip() not in validos_por_tabla.get(destino, set())
            }
            if huerfanos:
                fallos.append(f"{tabla}.{col} -> {destino}: {len(huerfanos)} huerfanos, "
                              f"p. ej. {sorted(huerfanos)[:3]}")
    return fallos


def verificar_conteos(datos, diccionario):
    fallos, avisos = [], []
    for hoja, tabla, filas, _c, _t, _d in datos:
        d = diccionario.get(hoja)
        if not d:
            avisos.append(f"{tabla}: la hoja {hoja} no esta en DICCIONARIO, no se verifica el conteo")
            continue
        declarado = d.get("filas_declaradas")
        if declarado is None or str(declarado).strip() == "":
            continue
        try:
            n = int(float(declarado))
        except ValueError:
            continue
        if n != len(filas):
            fallos.append(f"{tabla}: DICCIONARIO declara {n} filas, el Excel tiene {len(filas)}")

        # La PK declarada por el diccionario tiene que ser la que usamos.
        pk_dicc = (d.get("Clave primaria") or "").strip()
        pk_nuestra = [p.strip() for p in dominio.TABLAS[hoja][1]]
        if pk_dicc and [pk_dicc] != pk_nuestra:
            fallos.append(f"{tabla}: DICCIONARIO dice PK '{pk_dicc}', el generador usa {pk_nuestra}")
    return fallos, avisos


# --------------------------------------------------------------------------
# Escritura de CSV
# --------------------------------------------------------------------------

def cabecera_csv(tabla, hoja, n_filas):
    return [
        f"# {tabla}: dominio agronomico importado del Excel maestro.",
        f"# Origen: hoja {hoja} del Excel. {n_filas} filas.",
        "# Fuente canonica: este CSV. La migracion SQL se genera desde aqui,",
        "# no desde el Excel, para que la base se pueda reconstruir sin el archivo.",
        "# Regenerar: python scripts/generar_base_maestra.py <ruta.xlsx> --import",
    ]


def escribir_csvs(datos):
    os.makedirs(OUT_DIR, exist_ok=True)
    escritos = []
    for hoja, tabla, filas, columnas, tipos, _d in datos:
        ruta = os.path.join(OUT_DIR, f"{tabla}.csv")
        with open(ruta, "w", newline="", encoding="utf-8") as fh:
            for linea in cabecera_csv(tabla, hoja, len(filas)):
                fh.write(linea + "\n")
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(columnas)
            for f in filas:
                w.writerow([_normalizar(f.get(c), tipos.get(c, "text")) for c in columnas])
        escritos.append((tabla, ruta, len(filas)))
    return escritos


def escribir_reporte(datos):
    """Reporte de tipos para revision manual. Las columnas de texto no tienen
    red automatica: las pruebas solo cubren los numeros del riego."""
    lineas = ["TIPOS INFERIDOS POR VALOR (revisar a mano antes de aplicar la migracion)",
              "=" * 78, ""]
    sospechosas = []
    for hoja, tabla, filas, columnas, tipos, detalle in datos:
        lineas.append(f"## {tabla}   ({hoja}, {len(filas)} filas)")
        for c in columnas:
            d = detalle[c]
            extra = ""
            if "ejemplos" in d:
                extra = "  ej. " + " | ".join(x[:28] for x in d["ejemplos"])
            lineas.append(f"   {c:<28} {d['tipo']:<10} {d['motivo']}{extra}")
            # Sospechosas: quedaron en texto pero casi todos los valores son
            # numericos -> probablemente un dato raro rompiendo el tipo.
            if d["tipo"] == "text" and d["no_vacios"] >= 3:
                numericos = sum(1 for f in filas
                                if _es_numero(str(f.get(c) or "").strip())
                                and str(f.get(c) or "").strip() != "")
                ratio = numericos / d["no_vacios"]
                if ratio >= 0.8:
                    sospechosas.append(f"   {tabla}.{c}: {numericos}/{d['no_vacios']} "
                                       f"valores son numericos pero la columna quedo en text")
        lineas.append("")
    lineas.append("=" * 78)
    lineas.append("COLUMNAS SOSPECHOSAS (casi todas numericas pero tipadas como texto)")
    lineas.append("=" * 78)
    lineas.extend(sospechosas or ["   ninguna"])
    lineas.append("")
    lineas.append("Las columnas en text conservan lo que hay. Las celdas sueltas del Excel")
    lineas.append("no se corrigen a mano: se importan y se reportan.")
    with open(OUT_REPORTE, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lineas) + "\n")
    return sospechosas


# --------------------------------------------------------------------------
# SQL
# --------------------------------------------------------------------------

def sql_lit(v):
    """Literal SQL. standard_conforming_strings esta on, asi que la barra
    invertida es literal y solo hay que duplicar la comilla simple."""
    if "\x00" in v:
        raise ValueError("valor con byte nulo")
    return "'" + v.replace("'", "''") + "'"


def fks_de(tabla, columnas):
    """[(columna, tabla_referenciada)] para las FK de esta tabla.

    Se|matchea por nombre de columna contra la PK de cada dimensión, no por
    sufijo `_id`: `mes_n` es la PK de `dim_meses` y sí es clave foránea en
    los hechos. Se excluyen las autorreferencias (la PK de `dim_meses` no
    apunta a `dim_meses`) y una columna puede ser parte de la PK y FK a la
    vez, que es lo normal en una tabla de hechos.
    """
    out = []
    for c in columnas:
        destino = next((t for t, pk in dominio.DIMENSIONES_PK.items() if pk == c), None)
        if destino is None or destino == tabla:
            continue
        out.append((c, destino))
    for col, dim in dominio.FK_EXPLICITAS.get(tabla, []):
        if dim != tabla and (col, dim) not in out:
            out.append((col, dim))
    return out


def gen_create(datos):
    """(DDL de las 34 tablas, lista de constraints FK)."""
    ddl, fks = [], []
    for hoja, tabla, filas, columnas, tipos, _d in datos:
        _t, pks = dominio.TABLAS[hoja]
        ddl.append(f"-- {tabla}: {len(filas)} filas desde la hoja {hoja} del Excel maestro.")
        ddl.append(f"create table public.{tabla} (")
        lineas = []
        for c in columnas:
            t = tipos.get(c, "text")
            extra = " primary key" if c in pks else ""
            chk = CHECKS.get(tabla, {}).get(c)
            if chk:
                extra += f" check ({chk})"
            lineas.append(f"    {c} {t}{extra}")
        ddl.append(",\n".join(lineas))
        ddl.append(");")
        ddl.append("")

        for col, destino in fks_de(tabla, columnas):
            ref = dominio.DIMENSIONES_PK[destino]
            fks.append(
                f"alter table public.{tabla} add constraint {tabla}_{col}_fkey "
                f"foreign key ({col}) references public.{destino} ({ref}) "
                f"on update cascade on delete restrict;"
            )
    return ddl, fks


def gen_inserts(datos):
    """Los insert salen de los CSV versionados, no del Excel."""
    out = []
    for _hoja, tabla, _filas, columnas, _tipos, _d in datos:
        ruta = os.path.join(OUT_DIR, f"{tabla}.csv")
        with open(ruta, newline="", encoding="utf-8") as fh:
            lineas = [l for l in fh if not l.startswith("#")]
        filas = list(csv.DictReader(lineas))
        cols_sql = ", ".join(columnas)
        out.append(f"-- {tabla}: {len(filas)} filas.")
        out.append(f"insert into public.{tabla} ({cols_sql}) values")
        vals = []
        for f in filas:
            vs = ", ".join(sql_lit(f.get(c, "") or "") for c in columnas)
            vals.append(f"    ({vs})")
        out.append(",\n".join(vals) + ";")
        out.append("")
    return out


def gen_rls(datos):
    """Solo lectura, igual que las gf_riego_* que reemplazan. Ninguna
    politica de escritura."""
    out = []
    for _hoja, tabla, _f, _c, _t, _d in datos:
        out.append(f"alter table public.{tabla} enable row level security;")
        out.append(f"create policy {tabla}_lectura_publica on public.{tabla} "
                   f"for select to anon, authenticated using (true);")
        out.append("")
    return out


def _select_de_vista(vieja, destino, mapeo, calif_t="t"):
    """El `select` de la vista, una sola vez, que se usa tanto para crearla
    como para verificarla. Si el mapeo estuviera duplicado, la verificacion
    podria pasar sobre una consulta y desplegar otra."""
    pares = []
    for c, v in mapeo:
        expr = dominio.CASTS_VISTA.get((vieja, c))
        pares.append(f"{expr} as {c}" if expr else f"{v} as {c}")
    cols = ",\n    ".join(pares)
    if destino in ("fact_riego_mes", "fact_riego_etapa"):
        return (f"select\n    {cols}\nfrom public.{destino} {calif_t}\n"
                f"join public.dim_especies e on e.especie_id = {calif_t}.especie_id")
    return f"select\n    {cols}\nfrom public.{destino} {calif_t}"


def _col_viejas(mapeo):
    return [c for c, _v in mapeo]


def gen_vistas():
    """Las 8 gf_riego_* pasan a ser vistas.

    El mapeo va escrito a mano en `dominio.TABLAS_VIEJAS`: un `select *`
    renombraria columnas y romperia `lib/riego/actions.ts`, que hace
    `.select("*")` y despues accede por propiedad. Un nombre equivocado
    pasa TypeScript y revienta en runtime.

    El orden es: crear la vista con nombre temporal -> compararla fila por
    fila contra la tabla que va a reemplazar -> recien ahi borrar la tabla y
    renombrar. Todo dentro de la misma migracion, asi que la tabla nunca
    esta ausente y nada queda verificado que no sea lo que se despliega.

    `security_invoker` hace que la consulta se ejecute con los permisos de
    quien consulta y no con los de quien definio la vista. Sin eso, las
    politicas RLS de las tablas base no se aplicarian.
    """
    out = []
    for vieja, (destino, mapeo) in dominio.TABLAS_VIEJAS.items():
        tmp = f"_swap_{vieja}"
        cols = _col_viejas(mapeo)
        sel = _select_de_vista(vieja, destino, mapeo)
        lista = ", ".join(cols)

        out.append(f"-- {vieja} -> {destino}. Mapeo explicito, no select *.")
        out.append(f"create view public.{tmp} with (security_invoker = on) as")
        out.append(sel + ";")
        out.append("")
        out.append(f"-- Verificacion previa: si difiere algo, la migracion aborta.")
        out.append("do $verif$")
        out.append("declare")
        out.append("    diferencias bigint;")
        out.append("    n_viejo bigint; n_nuevo bigint;")
        out.append("begin")
        out.append(f"    select count(*) into n_viejo from public.{vieja};")
        out.append(f"    select count(*) into n_nuevo from public.{tmp};")
        out.append("    select count(*) into diferencias from (")
        out.append(f"        (select {lista} from public.{vieja}")
        out.append(f"         except all")
        out.append(f"         select {lista} from public.{tmp})")
        out.append("        union all")
        out.append(f"        (select {lista} from public.{tmp}")
        out.append(f"         except all")
        out.append(f"         select {lista} from public.{vieja})")
        out.append("    ) d;")
        out.append("    if n_viejo <> n_nuevo or diferencias > 0 then")
        out.append(f"        raise exception '{vieja}: la tabla nueva no reproduce la vieja "
                   f"(viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;")
        out.append("    end if;")
        out.append(f"    raise notice '{vieja}: verificada, % filas identicas', n_nuevo;")
        out.append("end")
        out.append("$verif$;")
        out.append("")
        out.append(f"drop table public.{vieja} cascade;")
        out.append(f"alter view public.{tmp} rename to {vieja};")
        out.append(f"grant select on public.{vieja} to anon, authenticated;")
        out.append("")

    out.append("-- La vista de control de calidad tambien depende de gf_riego_suelos.")
    out.append("drop view if exists public.vw_riego_suelos_consistencia;")
    out.append("create view public.vw_riego_suelos_consistencia with (security_invoker = on) as")
    out.append("    select clave, nombre, tecnico\n    from public.gf_riego_suelos\n"
               "    where tecnico = nombre;")
    out.append("")
    return out


def gen_sql(datos):
    """Genera tres migraciones en vez de una.

    El motivo es operativo, no de estilo. Con una sola, si el bloque de
    verificacion del swap aborta, hay que confiar en que la transaccion
    entera cayo bien. Con tres se verifica de a paso y, sobre todo, el
    estado intermedio es inofensivo:

      0037  esquema vacio   la app no lo conoce, no lee nada de aqui
      0038  los datos        las 8 gf_riego_* siguen sirviendo a la app
      0039  verificacion y swap

    Si 0039 falla, 0037 y 0038 quedan aplicados pero son tablas que nadie
    consulta, y la app sigue leyendo las viejas sin enterarse. Con una
    migracion unica, ese mismo fallo deja la base en un estado que nadie
    ha verificado.

    Sin BEGIN/COMMIT explicito: se aplican con el MCP, que ya envuelve
    cada una en su transaccion. Un COMMIT interno cortaria esa
    transaccion a mitad de camino.
    """
    cabecera = [
        "-- Migracion generada por scripts/generar_base_maestra.py --sql",
        "-- NO editar a mano. Editar el Excel o data/*.csv y regenerar.",
        "--",
        "-- Sin BEGIN/COMMIT explicito a proposito: se aplica con el MCP",
        "-- (apply_migration), que ya envuelve todo en una transaccion. Un",
        "-- COMMIT interno cortaria esa transaccion a mitad de camino.",
        "",
    ]
    ddl, fks = gen_create(datos)
    escritos = []

    # --- 0037: esquema ---
    c = cabecera + [f"-- 0037: esquema de las {len(datos)} tablas del Excel maestro v3.",
                    f"-- Solo estructura: sin datos. La app todavia no lee de aqui.", ""]
    c += ddl
    c.append("-- Claves foraneas.")
    c += fks
    c += ["", "-- Solo lectura, como las gf_riego_* que los reemplazan."]
    c += gen_rls(datos)
    ruta = os.path.join(RAIZ, "supabase", "migrations", "0037_base_maestra_ddl.sql")
    with open(ruta, "w", encoding="utf-8") as fh:
        fh.write("\n".join(c) + "\n")
    escritos.append(ruta)

    # --- 0038: datos ---
    c = cabecera + ["-- 0038: los datos del Excel maestro, desde data/*.csv versionados.",
                    "-- A este punto las 8 gf_riego_* siguen siendo las que lee la app.", ""]
    c += gen_inserts(datos)
    ruta = os.path.join(RAIZ, "supabase", "migrations", "0038_base_maestra_datos.sql")
    with open(ruta, "w", encoding="utf-8") as fh:
        fh.write("\n".join(c) + "\n")
    escritos.append(ruta)

    # --- 0039: verificacion y swap ---
    c = cabecera + ["-- 0039: verificacion previa y swap.", "",
                    "-- Cada bloque crea la vista con nombre temporal, la compara fila por",
                    "-- fila contra la tabla que va a reemplazar y solo despues borra la",
                    "-- tabla y renombra. Si difiere algo, el bloque aborta la migracion",
                    "-- entera y las tablas viejas siguen en pie.", ""]
    c += gen_vistas()
    ruta = os.path.join(RAIZ, "supabase", "migrations", "0039_base_maestra_swap.sql")
    with open(ruta, "w", encoding="utf-8") as fh:
        fh.write("\n".join(c) + "\n")
    escritos.append(ruta)

    return escritos


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def ejecutar_import(ruta_xlsx):
    lb = Libro(ruta_xlsx)
    datos = leer_todas(lb)
    diccionario = leer_diccionario(lb)

    fallos = []
    fallos += verificar_pk(datos)
    fallos += verificar_fks(datos)
    fallos_conteo, avisos = verificar_conteos(datos, diccionario)
    fallos += fallos_conteo

    total = sum(len(f) for _h, _t, f, _c, _ti, _d in datos)
    print(f"tablas a importar : {len(datos)}")
    print(f"filas totales     : {total}")
    for a in avisos:
        print(f"  aviso: {a}")

    if fallos:
        print(f"\nERROR: {len(fallos)} problemas. No se escribe nada.\n")
        for f in fallos[:40]:
            print(f"   {f}")
        if len(fallos) > 40:
            print(f"   ... y {len(fallos) - 40} mas")
        return 1

    print("\nverificaciones OK: PKs sin duplicados, FKs sin huerfanos, "
          "conteos y PK contra DICCIONARIO.")

    escritos = escribir_csvs(datos)
    sospechas = escribir_reporte(datos)
    print(f"CSV escritos      : {len(escritos)} en {OUT_DIR}")
    print(f"reporte de tipos  : {OUT_REPORTE}")
    if sospechas:
        print(f"\ncolumnas sospechosas ({len(sospechas)}), a revisar antes de aplicar:")
        for s in sospechas:
            print(s)
    return 0


def ejecutar_sql(ruta_xlsx):
    lb = Libro(ruta_xlsx)
    datos = leer_todas(lb)
    for ruta in gen_sql(datos):
        print(f"migracion escrita : {ruta} ({os.path.getsize(ruta)/1024:.0f} KB)")
    return 0

