"""
Extrae un snapshot de las tablas gf_riego_* a tests/fixtures/riego_base.json.

El test de consistencia corre sin red ni DB, asi que necesita la misma base que
recibe `calcularRiego` en runtime. Este script la baja de Supabase una vez y la
versiona, para que el test mida el motor y no la disponibilidad de la base.

Uso: python scripts/generar_riego_base_snapshot.py <project_ref>
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(HERE)
OUT = os.path.join(RAIZ, "tests", "fixtures", "riego_base.json")

# clave del snapshot -> tabla real en Postgres. Las tablas de referencia tienen
# policy de SELECT para anon (migracion 0032), asi que se leen por PostgREST.
#
# Desde la migracion 0039 esas "tablas" son vistas sobre dim_especies /
# fact_riego_mes / etc. El contenido es identico fila por fila (la migracion
# lo verifica antes de hacer el swap), pero el orden de salida no esta
# garantizado: un JOIN no conserva el orden fisico de la tabla base. Por eso
# se ordena aqui y no con ORDER BY en la vista, que ademas lo sobreescribe
# cualquier consulta que pida su propio orden.
TABLAS = {
    "mensual": "gf_riego_mensual",
    "especies": "gf_riego_especies",
    "suelos": "gf_riego_suelos",
    "zonas": "gf_riego_zonas",
    "edades": "gf_riego_edad",
    "niveles": "gf_riego_humedad",
    "etapas": "gf_riego_etapas",
}

# Orden estable para que el archivo sea reproducible.
ORDEN = {
    "mensual": ["especie", "mes"],
    "especies": ["especie"],
    "suelos": ["clave"],
    "zonas": ["clave"],
    "edades": ["n"],
    "niveles": ["nivel"],
    "etapas": ["especie", "codigo"],
}


def main(project_ref):
    import urllib.request

    anon = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    base = f"https://{project_ref}.supabase.co/rest/v1/"

    salida = {}
    for nombre, tabla in TABLAS.items():
        req = urllib.request.Request(
            base + tabla + "?select=*",
            headers={"apikey": anon, "Authorization": f"Bearer {anon}"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            filas = json.loads(resp.read().decode("utf-8"))
        # Orden estable: las vistas no garantizan orden de salida y sin esto
        # el fixture cambia de forma distinta cada vez que se regenera.
        claves = ORDEN[nombre]
        filas.sort(key=lambda r: tuple(r.get(c) for c in claves))
        salida[nombre] = filas
        print(f"{nombre:10s}: {len(filas)} filas  <- {tabla}")

    total = sum(len(v) for v in salida.values())
    salida["_meta"] = {
        "project_ref": project_ref,
        "total_filas": total,
        "nota": (
            "Snapshot de las vistas gf_riego_* (sobre dim_especies / "
            "fact_riego_mes, migracion 0039) para que "
            "tests/riego-consistencia.test.ts corra sin red ni DB. Regenerar con "
            "scripts/generar_riego_base_snapshot.py <project_ref>. Ordenado por "
            "script porque las vistas no garantizan orden."
        ),
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(salida, fh, ensure_ascii=False, indent=1)

    print(f"\ntotal: {total} filas")
    print(f"escrito: {OUT}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))