#!/usr/bin/env python3
"""Genera la migración 0029 y el seed JSON del programa de fertilización casera.

Fuente: /home/Johan/Descargas/GARDENFOOD_Guia_Fertilizacion_Casera.xlsx (del socio),
trazado a INIA — Hirzel y Hepp, Boletín INIA N° 426, cuadros 3.5-3.8, y
publicaciones INIA (2013, 2014). El SQL resultante es deterministico y se
commitea: el mismo comando debe volver a generar lo mismo.

Uso:
  python3 scripts/fertilizacion_seed.py [ruta_xlsx]

Escribe:
  supabase/migrations/0029_fertilizacion.sql  (DDL + RLS)
  supabase/fertilizacion_seed.json            (datos para scripts/fertilizacion_push.mjs)
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

XLSX = sys.argv[1] if len(sys.argv) > 1 else "/home/Johan/Descargas/GARDENFOOD_Guia_Fertilizacion_Casera.xlsx"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
MIGRACION = "supabase/migrations/0029_fertilizacion.sql"
SEED_OUT = "supabase/fertilizacion_seed.json"


def num(v):
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def s(v):
    if v is None:
        return None
    t = str(v).strip()
    return None if t == "" else t


def sheet_cells(sheet_xml: str) -> list[dict]:
    """Lee una hoja y devuelve, por fila, un dict letra → valor de texto."""
    root = ET.fromstring(z.read(sheet_xml))
    rows = []
    for r in root.iter(NS + "row"):
        d = {}
        for c in r.findall(NS + "c"):
            v = c.find(NS + "v")
            isv = c.find(NS + "is")
            txt = isv[0].text if isv is not None and len(isv) else (v.text if v is not None else None)
            if c.attrib.get("t") == "s" and txt is not None:
                txt = ss[int(txt)]
            if txt is None or str(txt).strip() == "":
                continue
            let = re.match(r"([A-Z]+)", c.attrib.get("r", "")).group(1)
            d[let] = str(txt)
        rows.append(d)
    return rows


z = zipfile.ZipFile(XLSX)
ss = ["".join(x.text or "" for x in si.iter(NS + "t")) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(NS + "si")]

NUTRIENTES = [("Calcio", "H", "I", "J", "K"), ("Magnesio", "L", "M", "N", "O"),
              ("Potasio", "P", "Q", "R", "S"), ("Fósforo", "T", "U", "V", "W"),
              ("Nitrógeno", "X", "Y", "Z", "AA")]

def quitar_guion(v):
    t = s(v)
    return None if t in ("—", "-", "—.") else t

# ---------- Hoja 3: CUÁNDO FERTILIZAR (fenología por especie × región) ----------
feno = []
for row in sheet_cells("xl/worksheets/sheet3.xml"):
    especie = s(row.get("A"))
    region = s(row.get("B"))
    if especie is None or region is None or especie == "Especie":
        continue
    feno.append({
        "especie": especie,
        "region_guia": region,
        "se_cultiva": s(row.get("C")) == "Sí" if row.get("C") is not None else None,
        "brota": s(row.get("D")),
        "florece": s(row.get("E")),
        "cosecha": s(row.get("F")),
        "m_despierta": s(row.get("G")),
        "m_engorda": s(row.get("H")),
        "m_recupera": s(row.get("I")),
        "veces_suelo": num(row.get("J")),
        "veces_goteo": num(row.get("K")),
        "nota": s(row.get("L")),
    })

# ---------- Hojas 4 (suelo) y 5 (goteo): programas ----------
programas = []
for sheet_num, metodo in ((4, "suelo"), (5, "goteo")):
    for row in sheet_cells(f"xl/worksheets/sheet{sheet_num}.xml"):
        especie = s(row.get("B"))
        region = s(row.get("C"))
        if especie is None or region is None:
            continue
        detalle = []
        for nutriente, pL, gL, vL, tL in NUTRIENTES:
            producto = quitar_guion(row.get(pL))
            gramos = num(row.get(gL))
            veces_det = num(row.get(vL))
            gramos_periodo = num(row.get(tL))
            if producto is None and (gramos is None or gramos == 0):
                continue
            detalle.append({
                "nutriente": nutriente,
                "producto": producto,
                "gramos_cada_vez": gramos,
                "veces": int(veces_det) if veces_det else 0,
                "gramos_periodo": gramos_periodo,
            })
        clave = s(row.get("A")) or ""
        orden = int(clave.split("|")[-1]) if clave.split("|")[-1].isdigit() else None
        if orden is None:
            continue
        cada = s(row.get("G")) or ""
        m = re.search(r"(\d+)", cada)
        programas.append({
            "especie": especie,
            "region_guia": region,
            "metodo": metodo,
            "orden": orden,
            "momento": s(row.get("D")),
            "meses": s(row.get("E")),
            "veces": int(num(row.get("F")) or 0),
            "cada_dias": int(m.group(1)) if m else (30 if metodo == "suelo" else 15),
            "detalle": detalle,
        })

# ---------- Hoja 6: catálogo de fertilizantes (con peso por cucharada) ----------
ferts = []
for row in sheet_cells("xl/worksheets/sheet6.xml"):
    producto = s(row.get("A"))
    if producto is None or producto == "Producto":
        continue
    g_gramos = row.get("H")
    m = re.search(r"([\d.]+)", g_gramos or "") if g_gramos else None
    ferts.append({
        "producto": producto,
        "etiqueta": s(row.get("B")),
        "n_pct": num(row.get("C")),
        "p_pct": num(row.get("D")),
        "k_pct": num(row.get("E")),
        "ca_pct": num(row.get("F")),
        "mg_pct": num(row.get("G")),
        "gramos_cucharada": float(m.group(1)) if m else None,
        "se_reparte": s(row.get("I")),
        "consejo": s(row.get("J")),
    })

# ---------- Hoja 2 helpers (T/V): cosecha típica por especie (adulto) ----------
cosecha = {}
for row in sheet_cells("xl/worksheets/sheet2.xml"):
    esp = s(row.get("T"))
    if esp and row.get("V") is not None and num(row.get("V")) is not None:
        cosecha[esp] = num(row.get("V"))

assert len(cosecha) == 30, f"cosecha tipica: {len(cosecha)} (esperadas 30)"
assert 150 <= len(feno) <= 200, f"fenologia {len(feno)}"
assert 780 <= len(programas) <= 790, f"programas {len(programas)}"
assert 10 <= len(ferts) <= 20, f"fertilizantes {len(ferts)}"
assert len({(p["especie"], p["region_guia"], p["metodo"], p["orden"]) for p in programas}) == len(programas), "claves duplicadas"

seed = {
    "fertilizantes": ferts,
    "fenologia": feno,
    "cosecha_tipica": [{"especie": k, "cosecha_kg_adulto": v} for k, v in sorted(cosecha.items())],
    "programas": programas,
}

DDL = """-- 0029_fertilizacion.sql — generado por scripts/fertilizacion_seed.py
-- NO EDITAR A MANO: regenerar con  python3 scripts/fertilizacion_seed.py
-- Fuente: GARDENFOOD_Guia_Fertilizacion_Casera.xlsx (INIA, Hirzel y Hepp,
-- Boletín INIA N° 426, cuadros 3.5-3.8; INIA 2013 olivo; INIA 2014 lib N° 31).
-- Datos: supabase/fertilizacion_seed.json, aplicados con scripts/fertilizacion_push.mjs.

create table if not exists public.gf_fertilizacion_fertilizantes (
  producto text primary key,
  etiqueta text,
  n_pct numeric,
  p_pct numeric,
  k_pct numeric,
  ca_pct numeric,
  mg_pct numeric,
  gramos_cucharada numeric,
  se_reparte text,
  consejo text
);

create table if not exists public.gf_fertilizacion_fenologia (
  especie text not null,
  region_guia text not null,
  se_cultiva boolean not null default true,
  brota text,
  florece text,
  cosecha text,
  m_despierta text,
  m_engorda text,
  m_recupera text,
  veces_suelo integer,
  veces_goteo integer,
  nota text,
  primary key (especie, region_guia)
);

create table if not exists public.gf_fertilizacion_cosecha_tipica (
  especie text primary key,
  cosecha_kg_adulto numeric not null
);

create table if not exists public.gf_fertilizacion_programa (
  especie text not null,
  region_guia text not null,
  metodo text not null check (metodo in ('suelo', 'goteo')),
  orden integer not null check (orden between 0 and 2),
  momento text not null,
  meses text not null,
  veces integer not null check (veces >= 1),
  cada_dias integer not null check (cada_dias between 1 and 60),
  detalle jsonb not null,
  primary key (especie, region_guia, metodo, orden)
);
create index if not exists gf_fertilizacion_programa_idx
  on public.gf_fertilizacion_programa (especie, region_guia, metodo);

-- Contenido compartido: lectura pública, sin escritura de usuarios.
alter table public.gf_fertilizacion_fertilizantes enable row level security;
alter table public.gf_fertilizacion_fenologia enable row level security;
alter table public.gf_fertilizacion_cosecha_tipica enable row level security;
alter table public.gf_fertilizacion_programa enable row level security;

drop policy if exists gf_fertilizacion_lectura_publica on public.gf_fertilizacion_fertilizantes;
create policy gf_fertilizacion_lectura_publica on public.gf_fertilizacion_fertilizantes for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_fenologia_lectura_publica on public.gf_fertilizacion_fenologia;
create policy gf_fertilizacion_fenologia_lectura_publica on public.gf_fertilizacion_fenologia for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_cosecha_lectura_publica on public.gf_fertilizacion_cosecha_tipica;
create policy gf_fertilizacion_cosecha_lectura_publica on public.gf_fertilizacion_cosecha_tipica for select to anon, authenticated using (true);
drop policy if exists gf_fertilizacion_programa_lectura_publica on public.gf_fertilizacion_programa;
create policy gf_fertilizacion_programa_lectura_publica on public.gf_fertilizacion_programa for select to anon, authenticated using (true);

comment on table public.gf_fertilizacion_programa is
  'Programa de fertilización casera por especie/región/método de riego. Fuente: xlsx socio, base INIA Boletín 426 (Hirzel y Hepp). Dosis para planta adulta; ajuste por edad en lib/agronomy/medidasCaseras.ts';
"""

with open(MIGRACION, "w") as f:
    f.write(DDL)
with open(SEED_OUT, "w") as f:
    json.dump(seed, f, ensure_ascii=False)

print(f"OK: {len(feno)} fenologia, {len(programas)} programas, {len(ferts)} fertilizantes, {len(cosecha)} cosechas tipicas -> {MIGRACION} + {SEED_OUT}")
