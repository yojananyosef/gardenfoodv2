#!/usr/bin/env python3
"""Genera data/riego_api_respuestas.csv desde el Excel maestro.

Fuente: GARDENFOOD_Base_Maestra_Frutales_v3.xlsx, hoja API_RESPUESTAS.

API_RESPUESTAS es la SALIDA de la calculadora del Excel, no su entrada: son
6480 resultados ya calculados (30 especies x 11 zonas de riego x 6 macrozonas x
12 meses, con cobertura parcial). Por eso va a tests/, no a Postgres.

Este generador NO copia los valores a ciegas: antes de escribir el CSV
recalcula cada fila desde FACT_RIEGO_MES + dim_especies + DIM_ZONAS_RIEGO con
las reglas de REGLAS_APP, y falla si algo no cuadra. El Excel guarda el ultimo
valor calculado, asi que si alguien edita las tablas fuente y guarda sin
recalcular, el fixture quedaria stale y el test compararia el motor contra un
numero viejo. Verificar aqui convierte ese silencio en un fallo ruidoso.

Uso: python scripts/generar_base_maestra.py /ruta/al.xlsx
"""
import csv
import os
import sys
from decimal import Decimal, ROUND_HALF_UP

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xlsx_read import Libro

HERE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(HERE)
OUT_DIR = os.path.join(RAIZ, "data")
OUT_CSV = os.path.join(OUT_DIR, "riego_api_respuestas.csv")

# Excel y JavaScript redondean half-up. El round() de Python redondea a pares
# y produciria cientos de falsos positivos. Ver comentario de PLAN-EJECUCION 5.4.
def rh(x):
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def num(v, default=None):
    if v is None or str(v).strip() == "":
        return default
    try:
        return float(v)
    except ValueError:
        return default


FACTORES_SUELO = {"G": 0.7, "MG": 0.85, "M": 1.0, "F": 1.15}

# El Excel maestro v3 usa el alias legible (`Arándano`, `Avellano`, `Palta`...)
# y la app/BD usan el dbKey (`Arandano`, `Avellano Europeo`, `Palto`...). El motor
# `calc.ts` busca el calendario por dbKey, asi que el fixture debe traerlo.
# Mismo criterio que MAPEO_ESPECIE en generar_riego_seed.py.
def _sin_tildes(s):
    for a, b in (("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("Á","A"),("É","E"),("Í","I"),("Ó","O"),("Ú","U"),("ñ","n"),("Ñ","N")):
        s = s.replace(a, b)
    return s

EXCEL_A_DBKEY = {
    "Arandano": "Arandano",
    "Avellano": "Avellano Europeo",
    "Nispero": "Níspero Japonés",
    "Lucuma": "Lúcuma",
    "Palta": "Palto",
    "Papayo chileno": "Papayo Chileno",
}

def db_key(alias_excel):
    """Alias del Excel -> dbKey de la app (gf_riego_* / calc.ts)."""
    sin = _sin_tildes(alias_excel)
    return EXCEL_A_DBKEY.get(alias_excel) or EXCEL_A_DBKEY.get(sin) or alias_excel

CABECERA = [
    "# Fixture derivado de la hoja API_RESPUESTAS del Excel maestro v3.",
    "# Es la SALIDA de la calculadora del Excel, no una tabla de dominio: no se importa a Postgres.",
    "# Regenerar: python scripts/generar_base_maestra.py <ruta.xlsx>",
    "# El generador recalcula cada fila desde FACT_RIEGO_MES + dim_especies + DIM_ZONAS_RIEGO",
    "# y falla si no coincide. Verifica con: pnpm test -- riego-consistencia",
    "clave,especie_id,especie_alias,zona_riego_id,macrozona_id,mes_n,mes_programa_n,"
    "reposo,litros_media,dias_media,litros_gruesa,dias_gruesa,litros_mod_gruesa,"
    "dias_mod_gruesa,litros_fina,dias_fina,litros_base,dias_base,factor_clima",
]


def main(ruta_xlsx):
    lb = Libro(ruta_xlsx)

    api = lb.dicts("API_RESPUESTAS")
    especies = {r["especie_id"]: r for r in lb.dicts("DIM_ESPECIES")}
    zonas = {r["zona_riego_id"]: r for r in lb.dicts("DIM_ZONAS_RIEGO")}

    # CLAVE COMPUESTA. Indexar solo por especie_id sobrescribe 11 de 12 meses
    # y produce ~4300 falsos positivos: cada especie queda con un solo mes.
    riego_mes = {}
    for r in lb.dicts("FACT_RIEGO_MES"):
        riego_mes[(r["especie_id"], int(r["mes_n"]))] = r

    filas = []
    diferencias = []
    sin_resolver = 0
    en_reposo = 0
    reposo_ok = 0

    for r in api:
        eid = r["especie_id"]
        zid = r["zona_riego_id"]
        mes_n = int(r["mes_n"])

        desfase = int(num(zonas.get(zid, {}).get("desfase_meses"), 0))
        # REGLAS_APP Paso 3: el programa de riego va corrido por el desfase de la zona.
        mes_p = (mes_n - 1 - desfase) % 12 + 1

        fila_riego = riego_mes.get((eid, mes_p))
        if fila_riego is None:
            sin_resolver += 1
            continue

        reposo = str(r.get("reposo") or "0").strip() == "1"
        if reposo:
            en_reposo += 1
            # REGLAS_APP Paso 4: en reposo el volumen es el de mantenimiento,
            # no el rango del calendario (que viene en 0).
            base = num(especies.get(eid, {}).get("riego_mantencion_l"), 0.0)
        else:
            base = (num(fila_riego.get("litros_min"), 0.0)
                    + num(fila_riego.get("litros_max"), 0.0)) / 2.0

        f_suelo = FACTORES_SUELO["M"]
        f_clima = num(zonas.get(zid, {}).get("factor_clima"), 1.0)
        dmin = num(fila_riego.get("dias_min"), 0.0)
        dmax = num(fila_riego.get("dias_max"), 0.0)

        esperado_litros = rh(base * f_suelo)
        esperado_dias = max(1, rh(((dmin + dmax) / 2.0) * f_suelo / f_clima))

        obs_litros = num(r.get("litros_media"))
        obs_dias = num(r.get("dias_media"))
        if obs_litros == esperado_litros:
            if reposo:
                reposo_ok += 1
        else:
            diferencias.append((r["clave"], "litros", obs_litros, esperado_litros))
        if obs_dias != esperado_dias:
            diferencias.append((r["clave"], "dias", obs_dias, esperado_dias))

        filas.append([
            r["clave"], eid, db_key(r.get("especie", "")), zid, r["macrozona_id"],
            mes_n, mes_p, 1 if reposo else 0,
            obs_litros, obs_dias,
            num(r.get("litros_gruesa")), num(r.get("dias_gruesa")),
            num(r.get("litros_mod_gruesa")), num(r.get("dias_mod_gruesa")),
            num(r.get("litros_fina")), num(r.get("dias_fina")),
            round(base, 2), round((dmin + dmax) / 2.0, 2), f_clima,
        ])

    print(f"filas leidas          : {len(api)}")
    print(f"filas emitidas        : {len(filas)}")
    print(f"sin fila de riego     : {sin_resolver}")
    print(f"filas con reposo = 1  : {en_reposo}")
    print(f"  de ellas, litros OK : {reposo_ok}/{en_reposo}")
    print(f"diferencias vs recalculo: {len(diferencias)}")

    if sin_resolver:
        print("\nERROR: hay combinaciones sin fila en FACT_RIEGO_MES. No se escribe el CSV.")
        return 1
    if diferencias:
        print("\nERROR: el Excel esta stale respecto a las tablas fuente:")
        for d in diferencias[:15]:
            print(f"   {d[0]} {d[1]}: cache={d[2]} recalculado={d[3]}")
        print("   ... no se escribe el CSV. Reabrir el Excel y recalcular (F9) antes de regenerar.")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        for linea in CABECERA:
            fh.write(linea + "\n")
        csv.writer(fh).writerows(filas)

    print(f"\nescrito: {OUT_CSV}")
    print(f"{len(filas)} combinaciones verificadas contra el recalculo independiente.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))