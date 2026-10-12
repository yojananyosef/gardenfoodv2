"""Lista las comunas que `dim_comunas.zona_agro_id` deja vacías.

`dim_comunas.zona_agro_id` viene de la hoja DIM_COMUNAS del Excel maestro y está
vacío en 217 de las 346 comunas: Aysén, Magallanes y Tarapacá enteras, y más de
la mitad de la Región Metropolitana. Mientras esté así el mapa comuna→zona no se
puede leer de la base, porque esas 217 recibirían la zona neutra (Santiago Norte)
como si fuera la suya.

Este script no arregla nada: arma el CSV con lo que hay que llenar en la hoja,
incluyendo la región y la zona que el catálogo legacy (`lib/agronomy/comunas.ts`)
ya tenía para cada comuna. Es una ayuda para completar el Excel, no una fuente
nueva: si el legacy también se equivoca, la ayuda sirve para revisar, no para
copiar a ciegas.

Ojo con el cruce por nombre: el Excel renombró 4 comunas (Til Til → Tiltil,
Puerto Natales → Natales, y 2 más). En esas el legacy no encuentra la fila y la
comuna sale con la zona de relleno, lo que el script avisa al final.

Uso:  python scripts/comunas_sin_zona.py
Salida: data/comunas_sin_zona.csv
"""
import csv
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COMUNAS_CSV = RAIZ / "data" / "dim_comunas.csv"
SALIDA = RAIZ / "data" / "comunas_sin_zona.csv"

# El catálogo legacy. Se parsea del TS para que no haya una segunda copia de los
# 346 nombres: si el TS se actualiza, el CSV sale al día.
TS_COMUNAS = RAIZ / "lib" / "agronomy" / "comunas.ts"
LINEA_COMUNA = re.compile(r'\{\s*comuna:\s*"([^"]+)",\s*zonaId:\s*(\d+),\s*region:\s*"([^"]+)"\s*\}')


def leer_legacy() -> dict[str, tuple[int, str]]:
    """comuna -> (zonaId, region) desde lib/agronomy/comunas.ts."""
    texto = TS_COMUNAS.read_text(encoding="utf8")
    salida = {}
    for comuna, zona, region in LINEA_COMUNA.findall(texto):
        salida[comuna] = (int(zona), region)
    return salida


def sin_comillas(v: str) -> str:
    return v.strip().strip('"')


def main() -> None:
    legacy = leer_legacy()

    with COMUNAS_CSV.open(encoding="utf8") as f:
        filas = [ln for ln in f if not ln.startswith("#") and ln.strip()]

    cab = filas[0].strip().split(",")
    i_comuna = cab.index("comuna")
    i_region = cab.index("region")
    i_zona = cab.index("zona_agro_id")
    i_riego = cab.index("zona_riego_id")

    pendientes = []
    for linea in filas[1:]:
        c = [sin_comillas(x) for x in linea.strip().split(",")]
        if c[i_zona].strip():
            continue
        pendientes.append(
            {
                "comuna": c[i_comuna],
                "region": c[i_region],
                "zona_riego_id": c[i_riego],
                "zona_agro_id_legacy": legacy.get(c[i_comuna], ("", ""))[0],
                "region_legacy": legacy.get(c[i_comuna], ("", ""))[1],
            }
        )

    with SALIDA.open("w", encoding="utf8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(pendientes[0].keys()))
        w.writeheader()
        w.writerows(pendientes)

    print(f"{len(pendientes)} comunas sin zona_agro_id de 346")
    print(f"-> {SALIDA.relative_to(RAIZ)}")

    # El detalle que importa para decidir urgencia.
    por_region: dict[str, list[str]] = {}
    for p in pendientes:
        por_region.setdefault(p["region"], []).append(p["comuna"])
    for region in sorted(por_region):
        print(f"  {region}: {len(por_region[region])}")

    faltan_en_legacy = [p["comuna"] for p in pendientes if not p["zona_agro_id_legacy"]]
    if faltan_en_legacy:
        print(f"\nSin zona en el legacy tampoco: {', '.join(faltan_en_legacy)}")


if __name__ == "__main__":
    main()