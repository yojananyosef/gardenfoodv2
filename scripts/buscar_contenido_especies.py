"""Lista las hojas del Excel y busca donde viven descripcion, clima e imagen.

La pregunta es concreta: el array de lib/agronomy/especies.ts tiene 4 campos
(imagen, descripcion, clima, dificultad) y en la base faltan 3. Este script
revisa las 47 hojas del libro y dice si alguno las tiene.

No arregla nada del Excel: solo informa.
"""
import sys
sys.path.insert(0, "scripts")
from xlsx_read import Libro

RUTA = r"C:\Users\J\Downloads\GARDENFOOD_Base_Maestra_Frutales_v3.xlsx"

libro = Libro(RUTA)
nombres = libro.nombres()
print(f"== {len(nombres)} hojas ==\n")

BUSCADAS = {
    "descripcion": ["descripcion", "descripción", "detalle", "presentacion", "presentación", "resumen"],
    "imagen": ["imagen", "foto", "image", "url", "ruta", "archivo", "asset"],
    "clima": ["clima", "clima_ideal", "clima ideal", "microclima", "region_clima"],
}

print("== hojas cuyo encabezado tiene alguna de las columnas buscadas ==\n")
for hoja in nombres:
    cab = [c.lower() for c in libro.headers(hoja)]
    if not cab:
        continue
    golpes = {}
    for campo,Alias in BUSCADAS.items():
        hallados = [a for a in Alias if any(a in c for c in cab)]
        if hallados:
            golpes[campo] = hallados
    if golpes:
        print(f"  {hoja}")
        for campo, hallados in golpes.items():
            cols = [c for c in libro.headers(hoja) if any(h in c.lower() for h in hallados)]
            print(f"      {campo:12} -> {cols}")
        print()

print("\n== indice de hojas ==")
for i, h in enumerate(nombres):
    filas = len(libro.celdas(h))
    cab = libro.headers(h)
    muestra = ", ".join(cab[:6])
    print(f"  {i:2}. {h:34} {filas:5} filas   [{muestra[:70]}]")