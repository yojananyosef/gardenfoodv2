"""Que es API_RESPUESTAS y si llego a la base.

Aparecio en el indice de hojas y no estaba en el plan de importacion: 6.481
filas y 56 columnas que parecen ser la respuesta de la API ya calculada para
cada combinacion de especie, zona y mes.

Si existe en el Excel y no en la base, hay trabajo que no se hizo. Si llego, hay
que entender si duplica las fact_* o si es una vista.

No arregla nada: solo informa.
"""
import sys
sys.path.insert(0, "scripts")
from xlsx_read import Libro

RUTA = r"C:\Users\J\Downloads\GARDENFOOD_Base_Maestra_Frutales_v3.xlsx"
libro = Libro(RUTA)

filas = libro.dicts("API_RESPUESTAS")
print(f"== API_RESPUESTAS: {len(filas)} filas ==\n")

print("== una fila completa (duraznero, enero) ==")
for f in filas:
    if f.get("especie_id") == "duraznero" and str(f.get("mes_n")) == "1":
        for k, v in f.items():
            s = str(v or "").strip()
            if s:
                print(f"   {k:26} {s[:58]}")
        break

print("\n== cuantas combinaciones hay ==")
especies = len({f.get("especie_id") for f in filas})
zonas = len({f.get("zona_agro_id") for f in filas})
meses = len({f.get("mes_n") for f in filas})
print(f"   especies {especies} x zonas {zonas} x meses {meses} = {especies*zonas*meses}")
print(f"   filas reales: {len(filas)}")

print("\n== cuantas filas traen contenido de verdad (no vacias) ==")
llenas = [f for f in filas if str(f.get("consejo_riego") or "").strip()]
print(f"   con consejo_riego: {len(llenas)} de {len(filas)}")
hitos = [f for f in filas if any(str(f.get(c) or "").strip()
                                 for c in ["brotacion", "floracion", "cosecha"])]
print(f"   con algun hito fenologico: {len(hitos)} de {len(filas)}")

print("\n== donde viven 'brotacion'/'floracion'/'cosecha' en la base? ==")
print("   (se consulta abajo)")

print("\n== REGLAS_APP: que dice? ==")
for f in libro.dicts("REGLAS_APP")[:16]:
    vals = [str(v).strip() for v in f.values() if str(v or "").strip()]
    if vals:
        print("   " + " | ".join(vals)[:130])