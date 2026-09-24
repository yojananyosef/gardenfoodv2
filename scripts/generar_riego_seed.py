#!/usr/bin/env python3
"""Genera supabase/migrations/0032_riego_excel.sql desde el xlsx de la guía.

Fuente: GARDENFOOD_Suelo_y_Riego_en_Casa.xlsx (Base de Datos Técnica GARDENFOOD).
No se inventa ningún valor: todo sale literal de las hojas
"BD Riego", "BD Etapas" y "Tablas y factores" (A-G).

Uso: python3 scripts/generar_riego_seed.py /ruta/al.xlsx
"""

import sys
import zipfile
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

# Excel -> dbKey de la app (lib/agronomy). Solo difieren estas 6.
MAPEO_ESPECIE = {
    "Avellano": "Avellano Europeo",
    "Níspero": "Níspero Japonés",
    "Lúcuma": "Lúcuma",
    "Palta": "Palto",
    "Chirimoya": "Chirimoya",
    "Papayo chileno": "Papayo Chileno",
}


def load(xlsx_path):
    z = zipfile.ZipFile(xlsx_path)
    ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    strs = [
        "".join(n.text or "" for n in si.findall(".//{%s}t" % NS))
        for si in ss_root.findall("{%s}si" % NS)
    ]

    def cells_of(sheet):
        root = ET.fromstring(z.read(sheet))
        cells = {}
        for c in root.findall(".//{%s}c" % NS):
            ref, t = c.get("r"), c.get("t")
            v = c.find("{%s}v" % NS)
            val = v.text if v is not None else ""
            if t == "s":
                try:
                    val = strs[int(val)]
                except (ValueError, IndexError):
                    pass
            cells[ref] = val
        return cells

    return (
        cells_of("xl/worksheets/sheet8.xml"),  # BD Riego
        cells_of("xl/worksheets/sheet9.xml"),  # BD Etapas
        cells_of("xl/worksheets/sheet10.xml"),  # Tablas y factores
    )


def colname(n):
    s = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        s = chr(65 + rem) + s
    return s


def row(cells, rr, c1=1, c2=12):
    return [cells.get(f"{colname(cc)}{rr}", "") for cc in range(c1, c2 + 1)]


def num(v):
    """Celda numérica del xlsx -> int/float; texto numérico también vale."""
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip().replace(",", ".")
    try:
        f = float(s)
        return int(f) if f.is_integer() else f
    except ValueError:
        raise ValueError(f"no numérico: {v!r}")


def sql_str(v):
    return "'" + str(v).replace("'", "''") + "'"


def main():
    xlsx = sys.argv[1] if len(sys.argv) > 1 else (
        "/home/j/Downloads/GARDENFOOD_Suelo_y_Riego_en_Casa.xlsx"
    )
    c_riego, c_etapas, c_tablas = load(xlsx)
    out = []
    out.append("-- 0032: Base de Datos Técnica de Suelo y Riego GARDENFOOD")
    out.append("-- Generado por scripts/generar_riego_seed.py desde el xlsx de la guía.")
    out.append("-- Ningún valor es inventado: todo sale literal de BD Riego,")
    out.append("-- BD Etapas y Tablas y factores (A-G).")
    out.append("")

    # ---------- A) SUELOS ----------
    out.append("create table if not exists public.gf_riego_suelos (")
    out.append("  clave text primary key,")
    out.append("  nombre text not null,")
    out.append("  tecnico text not null,")
    out.append("  agua_min_mm numeric not null,")
    out.append("  agua_max_mm numeric not null,")
    out.append("  factor numeric not null,")
    out.append("  manejo text not null")
    out.append(");")
    # Columnas: A Clave, B Tipo, C Agua min, D Agua max, E Factor, F Manejo.
    # Fila 5 = encabezado; datos en 6-9.
    suelos = []
    for rr in range(6, 10):
        r = row(c_tablas, rr, 1, 6)
        suelos.append(
            f"({sql_str(r[0])}, {sql_str(r[1])}, {sql_str(r[1])}, "
            f"{num(r[2])}, {num(r[3])}, {num(r[4])}, {sql_str(r[5])})"
        )
    out.append("insert into public.gf_riego_suelos (clave, nombre, tecnico, agua_min_mm, agua_max_mm, factor, manejo) values")
    out.append(",\n".join(suelos) + ";")
    out.append("")

    # ---------- B) HUMEDAD (filas 14-18 aprox: buscar encabezado) ----------
    out.append("create table if not exists public.gf_riego_humedad (")
    out.append("  nivel integer primary key,")
    out.append("  nombre text not null,")
    out.append("  pct_min numeric not null,")
    out.append("  pct_max numeric not null,")
    out.append("  factor_riego numeric not null,")
    out.append("  factor_control numeric not null,")
    out.append("  significado text not null")
    out.append(");")
    hum = []
    for rr in range(1, 40):
        r = row(c_tablas, rr, 1, 7)
        if r[0] == "N°" and "Nivel" in str(r[1]):
            for i in range(1, 6):
                d = row(c_tablas, rr + i, 1, 7)
                hum.append(
                    f"({num(d[0])}, {sql_str(d[1])}, {num(d[2])}, {num(d[3])}, "
                    f"{num(d[4])}, {num(d[5])}, {sql_str(d[6])})"
                )
            break
    assert len(hum) == 5, f"humedad: {len(hum)} filas"
    out.append("insert into public.gf_riego_humedad (nivel, nombre, pct_min, pct_max, factor_riego, factor_control, significado) values")
    out.append(",\n".join(hum) + ";")
    out.append("")

    # ---------- C) EDAD ----------
    out.append("create table if not exists public.gf_riego_edad (")
    out.append("  n integer primary key,")
    out.append("  nombre text not null,")
    out.append("  factor_litros numeric not null,")
    out.append("  factor_dias numeric not null")
    out.append(");")
    edad = []
    for rr in range(1, 60):
        r = row(c_tablas, rr, 1, 4)
        if r[0] == "N°" and "Edad" in str(r[1]):
            for i in range(1, 5):
                d = row(c_tablas, rr + i, 1, 4)
                edad.append(
                    f"({num(d[0])}, {sql_str(d[1])}, {num(d[2])}, {num(d[3])})"
                )
            break
    assert len(edad) == 4, f"edad: {len(edad)} filas"
    out.append("insert into public.gf_riego_edad (n, nombre, factor_litros, factor_dias) values")
    out.append(",\n".join(edad) + ";")
    out.append("")

    # ---------- E) ESPECIES (buscar encabezado "N° | Especie | Nombre científico") ----------
    out.append("create table if not exists public.gf_riego_especies (")
    out.append("  especie text primary key,")
    out.append("  excel_nombre text not null,")
    out.append("  nombre_cientifico text not null,")
    out.append("  grupo text not null,")
    out.append("  mantencion_l numeric not null,")
    out.append("  suelo text not null,")
    out.append("  ph text not null,")
    out.append("  copa_ref_m numeric not null")
    out.append(");")
    esp = []
    for rr in range(1, 120):
        r = row(c_tablas, rr, 1, 8)
        if r[0] == "N°" and str(r[1]).strip() == "Especie":
            i = 1
            while True:
                d = row(c_tablas, rr + i, 1, 8)
                if not str(d[1]).strip():
                    break
                excel = str(d[1]).strip()
                dbkey = MAPEO_ESPECIE.get(excel, excel)
                esp.append(
                    f"({sql_str(dbkey)}, {sql_str(excel)}, {sql_str(d[2])}, "
                    f"{sql_str(d[3])}, {num(d[4])}, {sql_str(d[5])}, "
                    f"{sql_str(d[6])}, {num(d[7])})"
                )
                i += 1
            break
    assert len(esp) == 30, f"especies: {len(esp)} filas"
    out.append("insert into public.gf_riego_especies (especie, excel_nombre, nombre_cientifico, grupo, mantencion_l, suelo, ph, copa_ref_m) values")
    out.append(",\n".join(esp) + ";")
    out.append("")

    # ---------- F) ZONAS (buscar "Clave | Zona | Dónde queda") ----------
    out.append("create table if not exists public.gf_riego_zonas (")
    out.append("  clave text primary key,")
    out.append("  nombre text not null,")
    out.append("  donde_queda text not null,")
    out.append("  eto_verano text not null,")
    out.append("  factor_clima numeric not null,")
    out.append("  desfase integer not null,")
    out.append("  significado text not null")
    out.append(");")
    zonas = []
    for rr in range(1, 160):
        r = row(c_tablas, rr, 1, 7)
        if r[0] == "Clave" and "Zona" in str(r[1]):
            i = 1
            while True:
                d = row(c_tablas, rr + i, 1, 7)
                if not str(d[0]).strip():
                    break
                zonas.append(
                    f"({sql_str(d[0])}, {sql_str(d[1])}, {sql_str(d[2])}, "
                    f"{sql_str(d[3])}, {num(d[4])}, {num(d[5])}, {sql_str(d[6])})"
                )
                i += 1
            break
    assert len(zonas) == 11, f"zonas: {len(zonas)} filas"
    out.append("insert into public.gf_riego_zonas (clave, nombre, donde_queda, eto_verano, factor_clima, desfase, significado) values")
    out.append(",\n".join(zonas) + ";")
    out.append("")

    # ---------- G) Kc etapa observada ----------
    out.append("create table if not exists public.gf_riego_kc (")
    out.append("  codigo text primary key,")
    out.append("  descripcion text not null,")
    out.append("  kc numeric")
    out.append(");")
    kc = []
    for rr in range(1, 200):
        r = row(c_tablas, rr, 1, 3)
        if r[0] == "Código" and "Lo que usted ve" in str(r[1]):
            i = 1
            while True:
                d = row(c_tablas, rr + i, 1, 3)
                if not str(d[0]).strip():
                    break
                try:
                    kcv = num(d[2])
                except ValueError:
                    kcv = None
                kc.append(
                    f"({sql_str(d[0])}, {sql_str(d[1])}, "
                    f"{kcv if kcv is not None else 'NULL'})"
                )
                i += 1
            break
    assert len(kc) == 8, f"kc: {len(kc)} filas"
    out.append("insert into public.gf_riego_kc (codigo, descripcion, kc) values")
    out.append(",\n".join(kc) + ";")
    out.append("")

    # ---------- BD RIEGO mensual ----------
    out.append("create table if not exists public.gf_riego_mensual (")
    out.append("  especie text not null,")
    out.append("  mes integer not null check (mes between 1 and 12),")
    out.append("  etapa text not null,")
    out.append("  dias_min numeric not null,")
    out.append("  dias_max numeric not null,")
    out.append("  litros_min numeric not null,")
    out.append("  litros_max numeric not null,")
    out.append("  reposo integer not null default 0,")
    out.append("  primary key (especie, mes)")
    out.append(");")
    mensual = []
    for rr in range(5, 370):
        r = row(c_riego, rr, 1, 10)
        excel, mes_n = str(r[0]).strip(), str(r[2]).strip()
        if not excel or not mes_n:
            continue
        dbkey = MAPEO_ESPECIE.get(excel, excel)
        mensual.append(
            f"({sql_str(dbkey)}, {num(mes_n)}, {sql_str(r[4])}, "
            f"{num(r[5])}, {num(r[6])}, {num(r[7])}, {num(r[8])}, {num(r[9])})"
        )
    assert len(mensual) == 360, f"mensual: {len(mensual)} filas"
    out.append("insert into public.gf_riego_mensual (especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo) values")
    for i in range(0, len(mensual), 60):
        out.append(",\n".join(mensual[i:i + 60]) + ";")
        if i + 60 < len(mensual):
            out.append("insert into public.gf_riego_mensual (especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo) values")
    out.append("")

    # ---------- BD ETAPAS observadas ----------
    out.append("create table if not exists public.gf_riego_etapas (")
    out.append("  especie text not null,")
    out.append("  codigo text not null,")
    out.append("  etapa_programa text not null,")
    out.append("  meses_originales text not null,")
    out.append("  coincide_exacta boolean not null,")
    out.append("  dias_min numeric not null,")
    out.append("  dias_max numeric not null,")
    out.append("  litros_min numeric not null,")
    out.append("  litros_max numeric not null,")
    out.append("  primary key (especie, codigo)")
    out.append(");")
    etapas = []
    for rr in range(5, 220):
        r = row(c_etapas, rr, 1, 10)
        excel, cod = str(r[0]).strip(), str(r[1]).strip()
        if not excel or not cod:
            continue
        dbkey = MAPEO_ESPECIE.get(excel, excel)
        coincide = str(r[5]).strip().lower().startswith("s")
        etapas.append(
            f"({sql_str(dbkey)}, {sql_str(cod)}, {sql_str(r[3])}, "
            f"{sql_str(r[4])}, {'TRUE' if coincide else 'FALSE'}, "
            f"{num(r[6])}, {num(r[7])}, {num(r[8])}, {num(r[9])})"
        )
    assert len(etapas) == 210, f"etapas: {len(etapas)} filas"
    out.append("insert into public.gf_riego_etapas (especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max) values")
    for i in range(0, len(etapas), 60):
        out.append(",\n".join(etapas[i:i + 60]) + ";")
        if i + 60 < len(etapas):
            out.append("insert into public.gf_riego_etapas (especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max) values")
    out.append("")

    # ---------- RLS + lectura pública (igual que fertilización) ----------
    for t in ["gf_riego_suelos", "gf_riego_humedad", "gf_riego_edad",
              "gf_riego_zonas", "gf_riego_kc", "gf_riego_especies",
              "gf_riego_mensual", "gf_riego_etapas"]:
        out.append(f"alter table public.{t} enable row level security;")
        out.append(f"drop policy if exists {t}_lectura_publica on public.{t};")
        out.append(f"create policy {t}_lectura_publica on public.{t} "
                   "for select to anon, authenticated using (true);")
        out.append("")

    with open("/home/j/gardenfoodv2/supabase/migrations/0032_riego_excel.sql", "w") as f:
        f.write("\n".join(out))
    print(f"OK: {len(mensual)} mensual, {len(etapas)} etapas, "
          f"{len(suelos)} suelos, {len(zonas)} zonas, {len(esp)} especies")


if __name__ == "__main__":
    main()
