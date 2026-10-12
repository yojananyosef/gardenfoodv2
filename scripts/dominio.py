"""Mapa de dominio: hoja del Excel -> tabla de Postgres.

El Excel no declara claves, asi que las PK se escriben aqui a mano. Una PK
inventada o olvidada se nota al aplicar la migracion, pero declaranolas aqui
el error aparece antes, en el generador.

`vistas` mapea cada tabla `gf_riego_*` que ya existe en produccion con los
mismos datos a la tabla del dominio que la reemplaza. No es un `select *`: los
nombres de columna difieren y `lib/riego/actions.ts` hace `.select("*")`
seguido de acceso por propiedad, asi que un nombre equivocado rompe en
tiempo de ejecucion y no en TypeScript.

Los rangos se conservan como rango. La app calcula el promedio en
`calc.ts`, no en el SQL.
"""

# hoja_excel -> (tabla, [columnas_pk])
TABLAS = {
    # --- dimensiones ---
    "DIM_ESPECIES":            ("dim_especies",            ["especie_id"]),
    "DIM_COMUNAS":             ("dim_comunas",             ["comuna_id"]),
    "DIM_ZONAS_RIEGO":         ("dim_zonas_riego",         ["zona_riego_id"]),
    "DIM_ZONAS_AGRO":          ("dim_zonas_agro",          ["zona_agro_id"]),
    "DIM_MACROZONAS":          ("dim_macrozonas",          ["macrozona_id"]),
    "DIM_SUELOS":              ("dim_suelos",              ["suelo_id"]),
    "DIM_HUMEDAD":             ("dim_humedad",             ["humedad_n"]),
    "DIM_EDAD":                ("dim_edad",                ["edad_n"]),
    "DIM_EDAD_NUTRICION":      ("dim_edad_nutricion",      ["edad_nutricion_id"]),
    "DIM_ETAPAS":              ("dim_etapas",              ["codigo_etapa"]),
    "DIM_MESES":               ("dim_meses",               ["mes_n"]),
    "DIM_PARCIALIZACION":      ("dim_parcializacion",      ["clave"]),
    # --- catalogos ---
    "CAT_FERT_CASERO":         ("cat_fert_casero",         ["producto"]),
    "CAT_FERT_TECNICO":        ("cat_fert_tecnico",        ["producto_id"]),
    # --- hechos ---
    "FACT_RIEGO_MES":          ("fact_riego_mes",          ["clave"]),
    "FACT_RIEGO_ETAPA":        ("fact_riego_etapa",        ["clave"]),
    "FACT_FENOLOGIA":          ("fact_fenologia",          ["clave"]),
    "FACT_FERT_PROGRAMA":      ("fact_fert_programa",      ["clave"]),
    "FACT_NUTRIENTES_ANUAL":   ("fact_nutrientes_anual",   ["especie_id"]),
    "FACT_VIABILIDAD_ZONA":    ("fact_viabilidad_zona",    ["clave"]),
    "FACT_LABORES_MES":        ("fact_labores_mes",        ["clave"]),
    "FACT_MANEJO_ESTACION":    ("fact_manejo_estacion",    ["especie_id", "estacion"]),
    "FACT_PLAGAS":             ("fact_plagas",             ["especie_id", "plaga_enfermedad"]),
    "FACT_PODA":               ("fact_poda",               ["especie_id", "n"]),
    "FACT_SANIDAD":            ("fact_sanidad",            ["especie_id", "n"]),
    "FACT_CONSEJOS":           ("fact_consejos",           ["especie_id", "n"]),
    "FACT_FERT_ORGANICA":      ("fact_fert_organica",      ["especie_id", "n", "mes"]),
    "FACT_FICHA_RIEGO":        ("fact_ficha_riego",        ["especie_id", "n"]),
    "FACT_FICHA_FERTILIZACION": ("fact_ficha_fertilizacion", ["especie_id", "n"]),
    "FACT_SUGERENCIAS":        ("fact_sugerencias",        ["especie_id", "tipo", "nombre"]),
    "FACT_CLIMA_ZONA":         ("fact_clima_zona",         ["zona_agro_id"]),
    "FACT_TAREAS_MES":         ("fact_tareas_mes",         ["clave"]),
    "ESPECIES_FICHA_BD20":     ("especies_ficha_bd20",     ["especie_id"]),
    "ESPECIES_BC":             ("especies_bc",             ["especie_id"]),
}

# Orden de creacion: primero las dimensiones, luego los catálogos, luego los
# hechos. Las FK apuntan a tablas que ya existen cuando se corre el
# `alter table ... add constraint`, asi que el orden importa.
def orden_creacion():
    dims, cats, facts = [], [], []
    for hoja, (tabla, _pk) in TABLAS.items():
        if tabla.startswith("dim_"):
            dims.append((hoja, tabla))
        elif tabla.startswith("cat_"):
            cats.append((hoja, tabla))
        else:
            facts.append((hoja, tabla))
    return dims + cats + facts


# Las tablas que ya existen en produccion y a las que este change reemplaza
# por vistas. Ordenados como los lee la app en lib/riego/actions.ts.
TABLAS_VIEJAS = {
    "gf_riego_suelos": ("dim_suelos", [
        ("clave",       "suelo_id"),
        ("nombre",      "suelo"),
        ("tecnico",     "nombres_usda"),
        ("agua_min_mm", "agua_min_mm_m"),
        ("agua_max_mm", "agua_max_mm_m"),
        ("factor",      "factor_suelo"),
        ("manejo",      "como_manejarlo"),
    ]),
    "gf_riego_zonas": ("dim_zonas_riego", [
        ("clave",        "zona_riego_id"),
        ("nombre",       "zona_riego"),
        ("donde_queda",  "donde_queda"),
        # eto_verano es el rango en texto ("6 a 6,5", "—"), no el minimo
        # numerico. Mapearlo a eto_verano_min cambiaria el valor que ve la app.
        ("eto_verano",   "eto_verano_mm_dia"),
        ("factor_clima", "factor_clima"),
        ("desfase",      "desfase_meses"),
        ("significado",  "que_significa"),
    ]),
    "gf_riego_edad": ("dim_edad", [
        ("n",            "edad_n"),
        ("nombre",       "edad"),
        ("factor_litros", "factor_litros"),
        ("factor_dias",  "factor_dias"),
    ]),
    "gf_riego_humedad": ("dim_humedad", [
        ("nivel",         "humedad_n"),
        ("nombre",        "nivel"),
        ("pct_min",       "pct_min"),
        ("pct_max",       "pct_max"),
        ("factor_riego",  "factor_riego"),
        ("factor_control", "factor_control"),
        ("significado",   "que_significa"),
    ]),
    "gf_riego_kc": ("dim_etapas", [
        ("codigo",      "codigo_etapa"),
        ("descripcion", "lo_que_ve"),
        ("kc",          "kc_referencial"),
    ]),
    # Estas dos necesitan unir con dim_especies: el calendario guarda el slug
    # (`especie_id`) y la app busca el alias (`alias_riego`).
    "gf_riego_mensual": ("fact_riego_mes", [
        ("especie",   "alias_riego"),
        ("mes",       "mes_n"),
        ("etapa",     "etapa"),
        ("dias_min",  "dias_min"),
        ("dias_max",  "dias_max"),
        ("litros_min", "litros_min"),
        ("litros_max", "litros_max"),
        ("reposo",    "reposo"),
    ]),
    "gf_riego_etapas": ("fact_riego_etapa", [
        ("especie",          "alias_riego"),
        ("codigo",           "codigo_etapa"),
        ("etapa_programa",   "etapa"),
        ("meses_originales", "meses_originales"),
        ("coincide_exacta",  "coincide_exacto"),
        ("dias_min",         "dias_min"),
        ("dias_max",         "dias_max"),
        ("litros_min",       "litros_min"),
        ("litros_max",       "litros_max"),
    ]),
    "gf_riego_especies": ("dim_especies", [
        ("especie",            "especie"),
        ("excel_nombre",       "nombre_en_excel_riego"),
        ("nombre_cientifico",  "nombre_cientifico"),
        ("grupo",              "grupo"),
        ("mantencion_l",       "riego_mantencion_l"),
        ("suelo",              "suelo_preferido"),
        ("ph",                 "ph_ideal"),
        ("copa_ref_m",         "copa_ref_m"),
    ]),
}

# Tablas de dimension -> (pk, columna de la hoja fact que la referencia)
# Se usa para decidir que `*_id` es FK real. Lo que no este aca y se llame
# `*_id` no se vuelve FK: `dim_especies.suelo_preferido` es texto descriptivo,
# no un puntero a dim_suelos.
DIMENSIONES_PK = {
    "dim_especies": "especie_id",
    "dim_comunas": "comuna_id",
    "dim_zonas_riego": "zona_riego_id",
    "dim_zonas_agro": "zona_agro_id",
    "dim_macrozonas": "macrozona_id",
    "dim_suelos": "suelo_id",
    "dim_humedad": "humedad_n",
    "dim_edad": "edad_n",
    "dim_etapas": "codigo_etapa",
    "dim_meses": "mes_n",
}

# Columnas que son FK aunque no terminen en `_id`.
FK_EXPLICITAS = {
    "fact_riego_etapa": [("codigo_etapa", "dim_etapas")],
}

# La vista tiene que devolver lo que la tabla vieja devolvia, no lo que la
# nueva tiene. Estas son las columnas donde los dos no coinciden:
#
# - `gf_riego_mensual.reposo` es integer (0/1). `fact_riego_mes.reposo` es
#   boolean, que es lo correcto en la tabla nueva (PLAN-EJECUCION 6.5), pero
#   `calc.ts` compara `reposo === 1`. Sin el cast, la vista devolveria true y
#   el arreglo del reposo seeria roto en silencio.
#
# - `gf_riego_kc.kc` es numeric y tiene NULL para la etapa CAL. El Excel usa
#   "—" como centinela de "sin dato", que en una columna numerica solo pudo
#   terminar en NULL. `nullif` devuelve esa misma NULL sin tirar el centinela:
#   no aporta informacion que la NULL no tenga.
#
# La entrada es (columna_vieja, columna_nueva, expresion_sql_opcional). Con
# expresion, la vista emite esa expresion en vez de la columna.
EMULDA = "\u2014"

CASTS_VISTA = {
    ("gf_riego_mensual", "reposo"): "t.reposo::int",
    ("gf_riego_kc", "kc"): f"nullif(t.kc_referencial, '{EMULDA}')::numeric",
}