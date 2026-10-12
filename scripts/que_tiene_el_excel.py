"""Que tiene el Excel, hoja por hoja, para los 4 campos del array de especies.

El array de lib/agronomy/especies.ts trae imagen, descripcion, clima y
dificultad. En la base faltan 3. Este script revisa el Excel para saber si
estaban y la importacion los dejo fuera, o si nunca estuvieron.

No arregla el Excel: solo informa.
"""
import sys
sys.path.insert(0, "scripts")
from xlsx_read import Libro

RUTA = r"C:\Users\J\Downloads\GARDENFOOD_Base_Maestra_Frutales_v3.xlsx"
libro = Libro(RUTA)


def llenado(hoja, columna):
    """Cuantas filas tienen algo en esa columna, y cuales no."""
    filas = libro.dicts(hoja)
    con = [f for f in filas if str(f.get(columna) or "").strip()]
    vacias = [str(f.get("especie_id") or f.get("especie") or "?") for f in filas
              if not str(f.get(columna) or "").strip()]
    return filas, con, vacias


print("== 1. CLIMA: ESPECIES_FICHA_BD20.clima_ideal en el Excel ==")
filas, con, vacias = llenado("ESPECIES_FICHA_BD20", "clima_ideal")
print(f"   filas de especie : {len(filas)}")
print(f"   con clima_ideal  : {len(con)}")
print(f"   SIN clima_ideal  : {len(vacias)}  {vacias}")
print("   -> la base tiene 20. Si el Excel tiene 20 y no 30, el faltante nunca")
print("      estuvo en el Excel y no es culpa de la importacion.")

print("\n== 2. DIFICULTAD: ESPECIES_BC.dificultad ==")
filas2, con2, vacias2 = llenado("ESPECIES_BC", "dificultad")
print(f"   con dificultad : {len(con2)} de {len(filas2)}")
print(f"   vacias        : {len(vacias2)}")

print("\n== 3. DESCRIPCION: hay alguna columna de texto largo por especie? ==")
for hoja in ["ESPECIES_BC", "ESPECIES_FICHA_BD20", "DIM_ESPECIES"]:
    cab = libro.headers(hoja)
    largos = [c for c in cab if any(
        k in c.lower() for k in ["descri", "observ", "nota", "caracter", "resumen", "intro"])]
    print(f"   {hoja:24} {largos if largos else '(ninguna)'}")

print("\n== que si hay: ESPACIOS de texto por especie en ESPECIES_BC ==")
cab = libro.headers("ESPECIES_BC")
muestra = libro.dicts("ESPECIES_BC")[0]
for c in cab:
    v = str(muestra.get(c) or "").strip()
    if v:
        print(f"   {c:28} {v[:64]}")

print("\n== 4. IMAGEN: alguna hoja o columna con rutas de archivo? ==")
import re
patron_img = re.compile(r"\.(webp|png|jpg|jpeg)\b|/frutas/", re.I)
encontrado = []
for hoja in libro.nombres():
    for f in libro.dicts(hoja):
        for k, v in f.items():
            if v and patron_img.search(str(v)):
                encontrado.append((hoja, k, str(v)[:70]))
                break
if encontrado:
    for h, k, v in encontrado[:15]:
        print(f"   {h:24} {k:20} {v}")
    print(f"   total: {len(encontrado)} celdas")
else:
    print("   NINGUNA celda de las 47 hojas tiene una ruta de imagen.")

print("\n== 5. CONSULTA / API_RESPUESTAS: que son esas hojas? ==")
for hoja in ["CONSULTA", "API_RESPUESTAS"]:
    cab = libro.headers(hoja)
    print(f"   {hoja}: {len(cab)} columnas -> {cab}")