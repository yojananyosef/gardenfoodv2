/**
 * GENERADO por scripts/generar_database_types.mjs. No editar a mano.
 *
 * Refleja el esquema de Postgres en el momento de correrlo. Para cambiarlo,
 * se cambia la migracion y se regenera.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      cat_fert_casero: {
        Row: {
        "producto": string
        "etiqueta": string | null
        "n_pct": number | null
        "p_pct": number | null
        "k_pct": number | null
        "calcio_pct": number | null
        "magnesio_pct": number | null
        "g_por_cucharada": number | null
        "se_reparte": string | null
        "como_pedirlo_y_cuidar": string | null
        }
        Insert: {
        "producto": string
        "etiqueta"?: string | null
        "n_pct"?: number | null
        "p_pct"?: number | null
        "k_pct"?: number | null
        "calcio_pct"?: number | null
        "magnesio_pct"?: number | null
        "g_por_cucharada"?: number | null
        "se_reparte"?: string | null
        "como_pedirlo_y_cuidar"?: string | null
        }
        Update: {
        "producto"?: string | null
        "etiqueta"?: string | null
        "n_pct"?: number | null
        "p_pct"?: number | null
        "k_pct"?: number | null
        "calcio_pct"?: number | null
        "magnesio_pct"?: number | null
        "g_por_cucharada"?: number | null
        "se_reparte"?: string | null
        "como_pedirlo_y_cuidar"?: string | null
        }
        Relationships: []
      }
      cat_fert_tecnico: {
        Row: {
        "producto_id": string
        "tipo": string | null
        "fertilizante": string | null
        "n_pct": number | null
        "p2o5_pct": number | null
        "k2o_pct": number | null
        "cao_pct": number | null
        "mgo_pct": number | null
        "s_pct": number | null
        "reaccion_ph": string | null
        "apto_organico": string | null
        "solubilidad_g_l": string | null
        "para_que_y_cuidados": string | null
        }
        Insert: {
        "producto_id": string
        "tipo"?: string | null
        "fertilizante"?: string | null
        "n_pct"?: number | null
        "p2o5_pct"?: number | null
        "k2o_pct"?: number | null
        "cao_pct"?: number | null
        "mgo_pct"?: number | null
        "s_pct"?: number | null
        "reaccion_ph"?: string | null
        "apto_organico"?: string | null
        "solubilidad_g_l"?: string | null
        "para_que_y_cuidados"?: string | null
        }
        Update: {
        "producto_id"?: string | null
        "tipo"?: string | null
        "fertilizante"?: string | null
        "n_pct"?: number | null
        "p2o5_pct"?: number | null
        "k2o_pct"?: number | null
        "cao_pct"?: number | null
        "mgo_pct"?: number | null
        "s_pct"?: number | null
        "reaccion_ph"?: string | null
        "apto_organico"?: string | null
        "solubilidad_g_l"?: string | null
        "para_que_y_cuidados"?: string | null
        }
        Relationships: []
      }
      dim_comunas: {
        Row: {
        "comuna_id": string
        "comuna": string | null
        "cut": number | null
        "region": string | null
        "zona_riego_id": string | null
        "origen_zona_riego": string | null
        "macrozona_id": string | null
        "origen_macrozona": string | null
        "criterio_asignacion": string | null
        "zona_agro_id": number | null
        "origen_zona_agro": string | null
        "zona_agro_propuesta_id": number | null
        "tipo_clima": string | null
        "heladas": string | null
        "riesgo_sequia": string | null
        "restricciones_huerto": string | null
        "nota_cut": string | null
        }
        Insert: {
        "comuna_id": string
        "comuna"?: string | null
        "cut"?: number | null
        "region"?: string | null
        "zona_riego_id"?: string | null
        "origen_zona_riego"?: string | null
        "macrozona_id"?: string | null
        "origen_macrozona"?: string | null
        "criterio_asignacion"?: string | null
        "zona_agro_id"?: number | null
        "origen_zona_agro"?: string | null
        "zona_agro_propuesta_id"?: number | null
        "tipo_clima"?: string | null
        "heladas"?: string | null
        "riesgo_sequia"?: string | null
        "restricciones_huerto"?: string | null
        "nota_cut"?: string | null
        }
        Update: {
        "comuna_id"?: string | null
        "comuna"?: string | null
        "cut"?: number | null
        "region"?: string | null
        "zona_riego_id"?: string | null
        "origen_zona_riego"?: string | null
        "macrozona_id"?: string | null
        "origen_macrozona"?: string | null
        "criterio_asignacion"?: string | null
        "zona_agro_id"?: number | null
        "origen_zona_agro"?: string | null
        "zona_agro_propuesta_id"?: number | null
        "tipo_clima"?: string | null
        "heladas"?: string | null
        "riesgo_sequia"?: string | null
        "restricciones_huerto"?: string | null
        "nota_cut"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_dim_comunas_macrozona_id_dim_macrozonas_macrozona_id"
          columns: ["macrozona_id"]
          isOneToOne: false
          referencedRelation: "dim_macrozonas"
          referencedColumns: ["macrozona_id"]
        },
        {
          foreignKeyName: "fk_dim_comunas_zona_agro_id_dim_zonas_agro_zona_agro_id"
          columns: ["zona_agro_id"]
          isOneToOne: false
          referencedRelation: "dim_zonas_agro"
          referencedColumns: ["zona_agro_id"]
        },
        {
          foreignKeyName: "fk_dim_comunas_zona_riego_id_dim_zonas_riego_zona_riego_id"
          columns: ["zona_riego_id"]
          isOneToOne: false
          referencedRelation: "dim_zonas_riego"
          referencedColumns: ["zona_riego_id"]
        }
        ]
      }
      dim_edad: {
        Row: {
        "edad_n": number
        "edad": string | null
        "anos_min": number | null
        "anos_max": number | null
        "factor_litros": number | null
        "factor_dias": number | null
        }
        Insert: {
        "edad_n": number
        "edad"?: string | null
        "anos_min"?: number | null
        "anos_max"?: number | null
        "factor_litros"?: number | null
        "factor_dias"?: number | null
        }
        Update: {
        "edad_n"?: number | null
        "edad"?: string | null
        "anos_min"?: number | null
        "anos_max"?: number | null
        "factor_litros"?: number | null
        "factor_dias"?: number | null
        }
        Relationships: []
      }
      dim_edad_nutricion: {
        Row: {
        "edad_nutricion_id": string
        "tramo": string | null
        "anos_min": number | null
        "anos_max": number | null
        "factor_nutricion": number | null
        }
        Insert: {
        "edad_nutricion_id": string
        "tramo"?: string | null
        "anos_min"?: number | null
        "anos_max"?: number | null
        "factor_nutricion"?: number | null
        }
        Update: {
        "edad_nutricion_id"?: string | null
        "tramo"?: string | null
        "anos_min"?: number | null
        "anos_max"?: number | null
        "factor_nutricion"?: number | null
        }
        Relationships: []
      }
      dim_especies: {
        Row: {
        "especie_id": string
        "especie": string | null
        "nombre_cientifico": string | null
        "grupo": string | null
        "alias_riego": string | null
        "nombre_en_excel_riego": string | null
        "alias_nutricion": string | null
        "alias_bd20": string | null
        "tiene_ficha_bd20": boolean | null
        "origen_programa_riego": string | null
        "riego_mantencion_l": number | null
        "copa_ref_m": number | null
        "suelo_preferido": string | null
        "ph_ideal": string | null
        "ph_min": number | null
        "ph_max": number | null
        "rendimiento_ref_kg_pl": number | null
        "marco_plantacion": string | null
        "densidad_pl_ha": number | null
        "patron_parcializacion": string | null
        "confianza_nutricion": string | null
        "fuente_nutricion": string | null
        "nota_critica_nutricion": string | null
        "foliar_epoca": string | null
        "foliar_tejido": string | null
        }
        Insert: {
        "especie_id": string
        "especie"?: string | null
        "nombre_cientifico"?: string | null
        "grupo"?: string | null
        "alias_riego"?: string | null
        "nombre_en_excel_riego"?: string | null
        "alias_nutricion"?: string | null
        "alias_bd20"?: string | null
        "tiene_ficha_bd20"?: boolean | null
        "origen_programa_riego"?: string | null
        "riego_mantencion_l"?: number | null
        "copa_ref_m"?: number | null
        "suelo_preferido"?: string | null
        "ph_ideal"?: string | null
        "ph_min"?: number | null
        "ph_max"?: number | null
        "rendimiento_ref_kg_pl"?: number | null
        "marco_plantacion"?: string | null
        "densidad_pl_ha"?: number | null
        "patron_parcializacion"?: string | null
        "confianza_nutricion"?: string | null
        "fuente_nutricion"?: string | null
        "nota_critica_nutricion"?: string | null
        "foliar_epoca"?: string | null
        "foliar_tejido"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "especie"?: string | null
        "nombre_cientifico"?: string | null
        "grupo"?: string | null
        "alias_riego"?: string | null
        "nombre_en_excel_riego"?: string | null
        "alias_nutricion"?: string | null
        "alias_bd20"?: string | null
        "tiene_ficha_bd20"?: boolean | null
        "origen_programa_riego"?: string | null
        "riego_mantencion_l"?: number | null
        "copa_ref_m"?: number | null
        "suelo_preferido"?: string | null
        "ph_ideal"?: string | null
        "ph_min"?: number | null
        "ph_max"?: number | null
        "rendimiento_ref_kg_pl"?: number | null
        "marco_plantacion"?: string | null
        "densidad_pl_ha"?: number | null
        "patron_parcializacion"?: string | null
        "confianza_nutricion"?: string | null
        "fuente_nutricion"?: string | null
        "nota_critica_nutricion"?: string | null
        "foliar_epoca"?: string | null
        "foliar_tejido"?: string | null
        }
        Relationships: []
      }
      dim_etapas: {
        Row: {
        "codigo_etapa": string
        "lo_que_ve": string | null
        "kc_referencial": string | null
        }
        Insert: {
        "codigo_etapa": string
        "lo_que_ve"?: string | null
        "kc_referencial"?: string | null
        }
        Update: {
        "codigo_etapa"?: string | null
        "lo_que_ve"?: string | null
        "kc_referencial"?: string | null
        }
        Relationships: []
      }
      dim_humedad: {
        Row: {
        "humedad_n": number
        "nivel": string | null
        "pct_min": number | null
        "pct_max": number | null
        "factor_riego": number | null
        "factor_control": number | null
        "que_significa": string | null
        "se_ve_gruesa": string | null
        "se_ve_mod_gruesa": string | null
        "se_ve_media": string | null
        "se_ve_fina": string | null
        }
        Insert: {
        "humedad_n": number
        "nivel"?: string | null
        "pct_min"?: number | null
        "pct_max"?: number | null
        "factor_riego"?: number | null
        "factor_control"?: number | null
        "que_significa"?: string | null
        "se_ve_gruesa"?: string | null
        "se_ve_mod_gruesa"?: string | null
        "se_ve_media"?: string | null
        "se_ve_fina"?: string | null
        }
        Update: {
        "humedad_n"?: number | null
        "nivel"?: string | null
        "pct_min"?: number | null
        "pct_max"?: number | null
        "factor_riego"?: number | null
        "factor_control"?: number | null
        "que_significa"?: string | null
        "se_ve_gruesa"?: string | null
        "se_ve_mod_gruesa"?: string | null
        "se_ve_media"?: string | null
        "se_ve_fina"?: string | null
        }
        Relationships: []
      }
      dim_macrozonas: {
        Row: {
        "macrozona_id": string
        "macrozona": string | null
        "factor_n": number | null
        "factor_p2o5": number | null
        "factor_k2o": number | null
        "factor_cao": number | null
        "factor_mgo": number | null
        "parcialidades_min_ano": number | null
        "por_que": string | null
        }
        Insert: {
        "macrozona_id": string
        "macrozona"?: string | null
        "factor_n"?: number | null
        "factor_p2o5"?: number | null
        "factor_k2o"?: number | null
        "factor_cao"?: number | null
        "factor_mgo"?: number | null
        "parcialidades_min_ano"?: number | null
        "por_que"?: string | null
        }
        Update: {
        "macrozona_id"?: string | null
        "macrozona"?: string | null
        "factor_n"?: number | null
        "factor_p2o5"?: number | null
        "factor_k2o"?: number | null
        "factor_cao"?: number | null
        "factor_mgo"?: number | null
        "parcialidades_min_ano"?: number | null
        "por_que"?: string | null
        }
        Relationships: []
      }
      dim_meses: {
        Row: {
        "mes_n": number
        "mes": string | null
        "abrev": string | null
        }
        Insert: {
        "mes_n": number
        "mes"?: string | null
        "abrev"?: string | null
        }
        Update: {
        "mes_n"?: number | null
        "mes"?: string | null
        "abrev"?: string | null
        }
        Relationships: []
      }
      dim_parcializacion: {
        Row: {
        "clave": string
        "patron": string | null
        "nutriente": string | null
        "brotacion_a_cuaja": number | null
        "cuaja_a_cosecha": number | null
        "postcosecha": number | null
        "rango_inia": string | null
        "dentro_rango": string | null
        "que_significa": string | null
        }
        Insert: {
        "clave": string
        "patron"?: string | null
        "nutriente"?: string | null
        "brotacion_a_cuaja"?: number | null
        "cuaja_a_cosecha"?: number | null
        "postcosecha"?: number | null
        "rango_inia"?: string | null
        "dentro_rango"?: string | null
        "que_significa"?: string | null
        }
        Update: {
        "clave"?: string | null
        "patron"?: string | null
        "nutriente"?: string | null
        "brotacion_a_cuaja"?: number | null
        "cuaja_a_cosecha"?: number | null
        "postcosecha"?: number | null
        "rango_inia"?: string | null
        "dentro_rango"?: string | null
        "que_significa"?: string | null
        }
        Relationships: []
      }
      dim_suelos: {
        Row: {
        "suelo_id": string
        "suelo": string | null
        "nombres_usda": string | null
        "agua_min_mm_m": number | null
        "agua_max_mm_m": number | null
        "factor_suelo": number | null
        "como_se_siente": string | null
        "como_manejarlo": string | null
        }
        Insert: {
        "suelo_id": string
        "suelo"?: string | null
        "nombres_usda"?: string | null
        "agua_min_mm_m"?: number | null
        "agua_max_mm_m"?: number | null
        "factor_suelo"?: number | null
        "como_se_siente"?: string | null
        "como_manejarlo"?: string | null
        }
        Update: {
        "suelo_id"?: string | null
        "suelo"?: string | null
        "nombres_usda"?: string | null
        "agua_min_mm_m"?: number | null
        "agua_max_mm_m"?: number | null
        "factor_suelo"?: number | null
        "como_se_siente"?: string | null
        "como_manejarlo"?: string | null
        }
        Relationships: []
      }
      dim_zonas_agro: {
        Row: {
        "zona_agro_id": number
        "zona_agro": string | null
        "region": string | null
        "tipo_clima": string | null
        "t_max_enero": string | null
        "t_min_julio": string | null
        "t_min_absoluta": string | null
        "precipitacion_anual_mm": number | null
        "horas_frio": string | null
        "heladas_dias_ano": string | null
        "riesgo_sequia": string | null
        "estacion_agromet": string | null
        }
        Insert: {
        "zona_agro_id": number
        "zona_agro"?: string | null
        "region"?: string | null
        "tipo_clima"?: string | null
        "t_max_enero"?: string | null
        "t_min_julio"?: string | null
        "t_min_absoluta"?: string | null
        "precipitacion_anual_mm"?: number | null
        "horas_frio"?: string | null
        "heladas_dias_ano"?: string | null
        "riesgo_sequia"?: string | null
        "estacion_agromet"?: string | null
        }
        Update: {
        "zona_agro_id"?: number | null
        "zona_agro"?: string | null
        "region"?: string | null
        "tipo_clima"?: string | null
        "t_max_enero"?: string | null
        "t_min_julio"?: string | null
        "t_min_absoluta"?: string | null
        "precipitacion_anual_mm"?: number | null
        "horas_frio"?: string | null
        "heladas_dias_ano"?: string | null
        "riesgo_sequia"?: string | null
        "estacion_agromet"?: string | null
        }
        Relationships: []
      }
      dim_zonas_riego: {
        Row: {
        "zona_riego_id": string
        "zona_riego": string | null
        "donde_queda": string | null
        "eto_verano_mm_dia": string | null
        "factor_clima": number | null
        "desfase_meses": number | null
        "que_significa": string | null
        "eto_verano_min": number | null
        "eto_verano_max": number | null
        }
        Insert: {
        "zona_riego_id": string
        "zona_riego"?: string | null
        "donde_queda"?: string | null
        "eto_verano_mm_dia"?: string | null
        "factor_clima"?: number | null
        "desfase_meses"?: number | null
        "que_significa"?: string | null
        "eto_verano_min"?: number | null
        "eto_verano_max"?: number | null
        }
        Update: {
        "zona_riego_id"?: string | null
        "zona_riego"?: string | null
        "donde_queda"?: string | null
        "eto_verano_mm_dia"?: string | null
        "factor_clima"?: number | null
        "desfase_meses"?: number | null
        "que_significa"?: string | null
        "eto_verano_min"?: number | null
        "eto_verano_max"?: number | null
        }
        Relationships: []
      }
      especies_bc: {
        Row: {
        "especie_id": string
        "categoria": string | null
        "dificultad": string | null
        "zonas_recomendadas": string | null
        "horas_frio": string | null
        "temp_minima": string | null
        "temp_maxima": string | null
        "t_limite_ficha": string | null
        "requerimiento_hidrico": string | null
        "tipo_suelo": string | null
        "ph": string | null
        "exposicion_solar": string | null
        "epoca_plantacion": string | null
        "epoca_cosecha": string | null
        "distancia_plantacion": string | null
        "plagas_principales": string | null
        "enfermedades_principales": string | null
        "nivel_mantenimiento": string | null
        "tiempo_hasta_produccion": string | null
        "rendimiento_esperado": string | null
        "compatible_patio": string | null
        "compatible_maceta": string | null
        "observaciones": string | null
        "referencias": string | null
        "ficha_fuente": string | null
        "ficha_cosecha_cuando": string | null
        "ficha_cosecha_senal": string | null
        "ficha_cosecha_tecnica": string | null
        "ficha_postcosecha": string | null
        "ficha_rendimiento": string | null
        }
        Insert: {
        "especie_id": string
        "categoria"?: string | null
        "dificultad"?: string | null
        "zonas_recomendadas"?: string | null
        "horas_frio"?: string | null
        "temp_minima"?: string | null
        "temp_maxima"?: string | null
        "t_limite_ficha"?: string | null
        "requerimiento_hidrico"?: string | null
        "tipo_suelo"?: string | null
        "ph"?: string | null
        "exposicion_solar"?: string | null
        "epoca_plantacion"?: string | null
        "epoca_cosecha"?: string | null
        "distancia_plantacion"?: string | null
        "plagas_principales"?: string | null
        "enfermedades_principales"?: string | null
        "nivel_mantenimiento"?: string | null
        "tiempo_hasta_produccion"?: string | null
        "rendimiento_esperado"?: string | null
        "compatible_patio"?: string | null
        "compatible_maceta"?: string | null
        "observaciones"?: string | null
        "referencias"?: string | null
        "ficha_fuente"?: string | null
        "ficha_cosecha_cuando"?: string | null
        "ficha_cosecha_senal"?: string | null
        "ficha_cosecha_tecnica"?: string | null
        "ficha_postcosecha"?: string | null
        "ficha_rendimiento"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "categoria"?: string | null
        "dificultad"?: string | null
        "zonas_recomendadas"?: string | null
        "horas_frio"?: string | null
        "temp_minima"?: string | null
        "temp_maxima"?: string | null
        "t_limite_ficha"?: string | null
        "requerimiento_hidrico"?: string | null
        "tipo_suelo"?: string | null
        "ph"?: string | null
        "exposicion_solar"?: string | null
        "epoca_plantacion"?: string | null
        "epoca_cosecha"?: string | null
        "distancia_plantacion"?: string | null
        "plagas_principales"?: string | null
        "enfermedades_principales"?: string | null
        "nivel_mantenimiento"?: string | null
        "tiempo_hasta_produccion"?: string | null
        "rendimiento_esperado"?: string | null
        "compatible_patio"?: string | null
        "compatible_maceta"?: string | null
        "observaciones"?: string | null
        "referencias"?: string | null
        "ficha_fuente"?: string | null
        "ficha_cosecha_cuando"?: string | null
        "ficha_cosecha_senal"?: string | null
        "ficha_cosecha_tecnica"?: string | null
        "ficha_postcosecha"?: string | null
        "ficha_rendimiento"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_especies_bc_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      especies_ficha_bd20: {
        Row: {
        "especie_id": string
        "clima_ideal": string | null
        "distancia": string | null
        "primera_cosecha": string | null
        "vida_productiva": string | null
        "variedades": string | null
        "horas_frio": string | null
        "polinizacion": string | null
        "tamano_adulto": string | null
        "cosecha_cuando": string | null
        "cosecha_como_saber": string | null
        "cosecha_tecnica": string | null
        "postcosecha": string | null
        "rendimiento_esperado": string | null
        }
        Insert: {
        "especie_id": string
        "clima_ideal"?: string | null
        "distancia"?: string | null
        "primera_cosecha"?: string | null
        "vida_productiva"?: string | null
        "variedades"?: string | null
        "horas_frio"?: string | null
        "polinizacion"?: string | null
        "tamano_adulto"?: string | null
        "cosecha_cuando"?: string | null
        "cosecha_como_saber"?: string | null
        "cosecha_tecnica"?: string | null
        "postcosecha"?: string | null
        "rendimiento_esperado"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "clima_ideal"?: string | null
        "distancia"?: string | null
        "primera_cosecha"?: string | null
        "vida_productiva"?: string | null
        "variedades"?: string | null
        "horas_frio"?: string | null
        "polinizacion"?: string | null
        "tamano_adulto"?: string | null
        "cosecha_cuando"?: string | null
        "cosecha_como_saber"?: string | null
        "cosecha_tecnica"?: string | null
        "postcosecha"?: string | null
        "rendimiento_esperado"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_especies_ficha_bd20_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_clima_zona: {
        Row: {
        "zona_agro_id": number
        "t_max_enero_c": number | null
        "t_min_julio_c": number | null
        "t_min_absoluta_c": number | null
        "t_min_absoluta_nota": string | null
        "precipitacion_anual_mm": number | null
        "horas_frio_min": number | null
        "horas_frio_max": number | null
        "heladas_dias_min": number | null
        "heladas_dias_max": number | null
        "riesgo_sequia": string | null
        "t_media_anual_c": string | null
        "t_media_mensual_c": string | null
        "probabilidad_helada_pct": string | null
        "horas_sol_anual": string | null
        "nubosidad_pct": string | null
        "lluvia_invierno_mm": string | null
        "lluvia_verano_mm": string | null
        "fuente": string | null
        "nota_vacios": string | null
        }
        Insert: {
        "zona_agro_id": number
        "t_max_enero_c"?: number | null
        "t_min_julio_c"?: number | null
        "t_min_absoluta_c"?: number | null
        "t_min_absoluta_nota"?: string | null
        "precipitacion_anual_mm"?: number | null
        "horas_frio_min"?: number | null
        "horas_frio_max"?: number | null
        "heladas_dias_min"?: number | null
        "heladas_dias_max"?: number | null
        "riesgo_sequia"?: string | null
        "t_media_anual_c"?: string | null
        "t_media_mensual_c"?: string | null
        "probabilidad_helada_pct"?: string | null
        "horas_sol_anual"?: string | null
        "nubosidad_pct"?: string | null
        "lluvia_invierno_mm"?: string | null
        "lluvia_verano_mm"?: string | null
        "fuente"?: string | null
        "nota_vacios"?: string | null
        }
        Update: {
        "zona_agro_id"?: number | null
        "t_max_enero_c"?: number | null
        "t_min_julio_c"?: number | null
        "t_min_absoluta_c"?: number | null
        "t_min_absoluta_nota"?: string | null
        "precipitacion_anual_mm"?: number | null
        "horas_frio_min"?: number | null
        "horas_frio_max"?: number | null
        "heladas_dias_min"?: number | null
        "heladas_dias_max"?: number | null
        "riesgo_sequia"?: string | null
        "t_media_anual_c"?: string | null
        "t_media_mensual_c"?: string | null
        "probabilidad_helada_pct"?: string | null
        "horas_sol_anual"?: string | null
        "nubosidad_pct"?: string | null
        "lluvia_invierno_mm"?: string | null
        "lluvia_verano_mm"?: string | null
        "fuente"?: string | null
        "nota_vacios"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_clima_zona_zona_agro_id_dim_zonas_agro_zona_agro_id"
          columns: ["zona_agro_id"]
          isOneToOne: false
          referencedRelation: "dim_zonas_agro"
          referencedColumns: ["zona_agro_id"]
        }
        ]
      }
      fact_consejos: {
        Row: {
        "especie_id": string
        "n": number
        "consejo": string | null
        "fuente": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "consejo"?: string | null
        "fuente"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "consejo"?: string | null
        "fuente"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_consejos_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_fenologia: {
        Row: {
        "clave": string
        "especie_id": string | null
        "macrozona_id": string | null
        "macrozona": string | null
        "viable": string | null
        "brotacion": string | null
        "floracion": string | null
        "cuaja": string | null
        "cosecha": string | null
        "cosecha_inicio": string | null
        "cosecha_fin": string | null
        "meses_despierta": string | null
        "meses_engorda": string | null
        "meses_recupera": string | null
        "veces_ano_suelo": number | null
        "veces_ano_goteo": number | null
        "nota": string | null
        "caida_hojas": string | null
        "nota_fenologia_bc": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "macrozona_id"?: string | null
        "macrozona"?: string | null
        "viable"?: string | null
        "brotacion"?: string | null
        "floracion"?: string | null
        "cuaja"?: string | null
        "cosecha"?: string | null
        "cosecha_inicio"?: string | null
        "cosecha_fin"?: string | null
        "meses_despierta"?: string | null
        "meses_engorda"?: string | null
        "meses_recupera"?: string | null
        "veces_ano_suelo"?: number | null
        "veces_ano_goteo"?: number | null
        "nota"?: string | null
        "caida_hojas"?: string | null
        "nota_fenologia_bc"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "macrozona_id"?: string | null
        "macrozona"?: string | null
        "viable"?: string | null
        "brotacion"?: string | null
        "floracion"?: string | null
        "cuaja"?: string | null
        "cosecha"?: string | null
        "cosecha_inicio"?: string | null
        "cosecha_fin"?: string | null
        "meses_despierta"?: string | null
        "meses_engorda"?: string | null
        "meses_recupera"?: string | null
        "veces_ano_suelo"?: number | null
        "veces_ano_goteo"?: number | null
        "nota"?: string | null
        "caida_hojas"?: string | null
        "nota_fenologia_bc"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_fenologia_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_fenologia_macrozona_id_dim_macrozonas_macrozona_id"
          columns: ["macrozona_id"]
          isOneToOne: false
          referencedRelation: "dim_macrozonas"
          referencedColumns: ["macrozona_id"]
        }
        ]
      }
      fact_fert_organica: {
        Row: {
        "especie_id": string
        "n": number
        "mes": string
        "que_pasa": string | null
        "fertilizante": string | null
        "dosis_por_arbol": string | null
        "donde_aplicar": string | null
        "por_que": string | null
        "tipo": string | null
        "fuente": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "mes": string
        "que_pasa"?: string | null
        "fertilizante"?: string | null
        "dosis_por_arbol"?: string | null
        "donde_aplicar"?: string | null
        "por_que"?: string | null
        "tipo"?: string | null
        "fuente"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "mes"?: string | null
        "que_pasa"?: string | null
        "fertilizante"?: string | null
        "dosis_por_arbol"?: string | null
        "donde_aplicar"?: string | null
        "por_que"?: string | null
        "tipo"?: string | null
        "fuente"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_fert_organica_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_fert_programa: {
        Row: {
        "clave": string
        "especie_id": string | null
        "macrozona_id": string | null
        "sistema": string | null
        "periodo_n": number | null
        "periodo": string | null
        "meses": string | null
        "veces": number | null
        "frecuencia": string | null
        "ca_producto": string | null
        "ca_g_cada_vez": number | null
        "ca_veces": number | null
        "ca_g_periodo": number | null
        "mg_producto": string | null
        "mg_g_cada_vez": number | null
        "mg_veces": number | null
        "mg_g_periodo": number | null
        "k_producto": string | null
        "k_g_cada_vez": number | null
        "k_veces": number | null
        "k_g_periodo": number | null
        "p_producto": string | null
        "p_g_cada_vez": number | null
        "p_veces": number | null
        "p_g_periodo": number | null
        "n_producto": string | null
        "n_g_cada_vez": number | null
        "n_veces": number | null
        "n_g_periodo": number | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "macrozona_id"?: string | null
        "sistema"?: string | null
        "periodo_n"?: number | null
        "periodo"?: string | null
        "meses"?: string | null
        "veces"?: number | null
        "frecuencia"?: string | null
        "ca_producto"?: string | null
        "ca_g_cada_vez"?: number | null
        "ca_veces"?: number | null
        "ca_g_periodo"?: number | null
        "mg_producto"?: string | null
        "mg_g_cada_vez"?: number | null
        "mg_veces"?: number | null
        "mg_g_periodo"?: number | null
        "k_producto"?: string | null
        "k_g_cada_vez"?: number | null
        "k_veces"?: number | null
        "k_g_periodo"?: number | null
        "p_producto"?: string | null
        "p_g_cada_vez"?: number | null
        "p_veces"?: number | null
        "p_g_periodo"?: number | null
        "n_producto"?: string | null
        "n_g_cada_vez"?: number | null
        "n_veces"?: number | null
        "n_g_periodo"?: number | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "macrozona_id"?: string | null
        "sistema"?: string | null
        "periodo_n"?: number | null
        "periodo"?: string | null
        "meses"?: string | null
        "veces"?: number | null
        "frecuencia"?: string | null
        "ca_producto"?: string | null
        "ca_g_cada_vez"?: number | null
        "ca_veces"?: number | null
        "ca_g_periodo"?: number | null
        "mg_producto"?: string | null
        "mg_g_cada_vez"?: number | null
        "mg_veces"?: number | null
        "mg_g_periodo"?: number | null
        "k_producto"?: string | null
        "k_g_cada_vez"?: number | null
        "k_veces"?: number | null
        "k_g_periodo"?: number | null
        "p_producto"?: string | null
        "p_g_cada_vez"?: number | null
        "p_veces"?: number | null
        "p_g_periodo"?: number | null
        "n_producto"?: string | null
        "n_g_cada_vez"?: number | null
        "n_veces"?: number | null
        "n_g_periodo"?: number | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_fert_programa_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_fert_programa_macrozona_id_dim_macrozonas_macrozona_id"
          columns: ["macrozona_id"]
          isOneToOne: false
          referencedRelation: "dim_macrozonas"
          referencedColumns: ["macrozona_id"]
        }
        ]
      }
      fact_ficha_fertilizacion: {
        Row: {
        "especie_id": string
        "n": number
        "mes": string | null
        "etapa": string | null
        "producto": string | null
        "dosis": string | null
        "donde": string | null
        "por_que_fisiologico": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "mes"?: string | null
        "etapa"?: string | null
        "producto"?: string | null
        "dosis"?: string | null
        "donde"?: string | null
        "por_que_fisiologico"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "mes"?: string | null
        "etapa"?: string | null
        "producto"?: string | null
        "dosis"?: string | null
        "donde"?: string | null
        "por_que_fisiologico"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_ficha_fertilizacion_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_ficha_riego: {
        Row: {
        "especie_id": string
        "n": number
        "etapa": string | null
        "meses": string | null
        "frecuencia": string | null
        "volumen": string | null
        "senal_visual": string | null
        "por_que_fisiologico": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "etapa"?: string | null
        "meses"?: string | null
        "frecuencia"?: string | null
        "volumen"?: string | null
        "senal_visual"?: string | null
        "por_que_fisiologico"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "etapa"?: string | null
        "meses"?: string | null
        "frecuencia"?: string | null
        "volumen"?: string | null
        "senal_visual"?: string | null
        "por_que_fisiologico"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_ficha_riego_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_labores_mes: {
        Row: {
        "clave": string
        "especie_id": string | null
        "mes": string | null
        "mes_n": number | null
        "labores": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "labores"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "labores"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_labores_mes_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_labores_mes_mes_n_dim_meses_mes_n"
          columns: ["mes_n"]
          isOneToOne: false
          referencedRelation: "dim_meses"
          referencedColumns: ["mes_n"]
        }
        ]
      }
      fact_manejo_estacion: {
        Row: {
        "especie_id": string
        "estacion": string
        "labores": string | null
        }
        Insert: {
        "especie_id": string
        "estacion": string
        "labores"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "estacion"?: string | null
        "labores"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_manejo_estacion_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_nutrientes_anual: {
        Row: {
        "especie_id": string
        "especie_alias": string | null
        "categoria": string | null
        "n_kg_t": number | null
        "p2o5_kg_t": number | null
        "k2o_kg_t": number | null
        "cao_kg_t": number | null
        "mgo_kg_t": number | null
        "patron_parcializacion": string | null
        "confianza": string | null
        "rendimiento_ref_kg_pl": number | null
        "marco_plantacion": string | null
        "densidad_pl_ha": number | null
        "fuente": string | null
        "n_g_pl_adulta": number | null
        "p2o5_g_pl_adulta": number | null
        "k2o_g_pl_adulta": number | null
        "cao_g_pl_adulta": number | null
        "mgo_g_pl_adulta": number | null
        }
        Insert: {
        "especie_id": string
        "especie_alias"?: string | null
        "categoria"?: string | null
        "n_kg_t"?: number | null
        "p2o5_kg_t"?: number | null
        "k2o_kg_t"?: number | null
        "cao_kg_t"?: number | null
        "mgo_kg_t"?: number | null
        "patron_parcializacion"?: string | null
        "confianza"?: string | null
        "rendimiento_ref_kg_pl"?: number | null
        "marco_plantacion"?: string | null
        "densidad_pl_ha"?: number | null
        "fuente"?: string | null
        "n_g_pl_adulta"?: number | null
        "p2o5_g_pl_adulta"?: number | null
        "k2o_g_pl_adulta"?: number | null
        "cao_g_pl_adulta"?: number | null
        "mgo_g_pl_adulta"?: number | null
        }
        Update: {
        "especie_id"?: string | null
        "especie_alias"?: string | null
        "categoria"?: string | null
        "n_kg_t"?: number | null
        "p2o5_kg_t"?: number | null
        "k2o_kg_t"?: number | null
        "cao_kg_t"?: number | null
        "mgo_kg_t"?: number | null
        "patron_parcializacion"?: string | null
        "confianza"?: string | null
        "rendimiento_ref_kg_pl"?: number | null
        "marco_plantacion"?: string | null
        "densidad_pl_ha"?: number | null
        "fuente"?: string | null
        "n_g_pl_adulta"?: number | null
        "p2o5_g_pl_adulta"?: number | null
        "k2o_g_pl_adulta"?: number | null
        "cao_g_pl_adulta"?: number | null
        "mgo_g_pl_adulta"?: number | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_nutrientes_anual_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_plagas: {
        Row: {
        "especie_id": string
        "plaga_enfermedad": string
        "tipo": string | null
        "sintomas": string | null
        "epoca_riesgo": string | null
        "control_organico": string | null
        "control_quimico": string | null
        "causa_y_prevencion": string | null
        }
        Insert: {
        "especie_id": string
        "plaga_enfermedad": string
        "tipo"?: string | null
        "sintomas"?: string | null
        "epoca_riesgo"?: string | null
        "control_organico"?: string | null
        "control_quimico"?: string | null
        "causa_y_prevencion"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "plaga_enfermedad"?: string | null
        "tipo"?: string | null
        "sintomas"?: string | null
        "epoca_riesgo"?: string | null
        "control_organico"?: string | null
        "control_quimico"?: string | null
        "causa_y_prevencion"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_plagas_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_poda: {
        Row: {
        "especie_id": string
        "n": number
        "tipo_poda": string | null
        "cuando": string | null
        "que_cortar": string | null
        "herramienta": string | null
        "por_que": string | null
        "error_frecuente": string | null
        "fuente": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "tipo_poda"?: string | null
        "cuando"?: string | null
        "que_cortar"?: string | null
        "herramienta"?: string | null
        "por_que"?: string | null
        "error_frecuente"?: string | null
        "fuente"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "tipo_poda"?: string | null
        "cuando"?: string | null
        "que_cortar"?: string | null
        "herramienta"?: string | null
        "por_que"?: string | null
        "error_frecuente"?: string | null
        "fuente"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_poda_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_riego_etapa: {
        Row: {
        "clave": string
        "especie_id": string | null
        "codigo_etapa": string | null
        "etapa": string | null
        "meses_originales": string | null
        "coincide_exacto": string | null
        "dias_min": number | null
        "dias_max": number | null
        "litros_min": number | null
        "litros_max": number | null
        "reposo": boolean | null
        "que_vera": string | null
        "consejo": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "codigo_etapa"?: string | null
        "etapa"?: string | null
        "meses_originales"?: string | null
        "coincide_exacto"?: string | null
        "dias_min"?: number | null
        "dias_max"?: number | null
        "litros_min"?: number | null
        "litros_max"?: number | null
        "reposo"?: boolean | null
        "que_vera"?: string | null
        "consejo"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "codigo_etapa"?: string | null
        "etapa"?: string | null
        "meses_originales"?: string | null
        "coincide_exacto"?: string | null
        "dias_min"?: number | null
        "dias_max"?: number | null
        "litros_min"?: number | null
        "litros_max"?: number | null
        "reposo"?: boolean | null
        "que_vera"?: string | null
        "consejo"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_riego_etapa_codigo_etapa_dim_etapas_codigo_etapa"
          columns: ["codigo_etapa"]
          isOneToOne: false
          referencedRelation: "dim_etapas"
          referencedColumns: ["codigo_etapa"]
        },
        {
          foreignKeyName: "fk_fact_riego_etapa_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_riego_mes: {
        Row: {
        "clave": string
        "especie_id": string | null
        "especie_alias": string | null
        "mes": string | null
        "mes_n": number | null
        "etapa": string | null
        "dias_min": number | null
        "dias_max": number | null
        "litros_min": number | null
        "litros_max": number | null
        "reposo": boolean | null
        "que_vera": string | null
        "consejo": string | null
        "frecuencia_original": string | null
        "volumen_original": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "especie_alias"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "etapa"?: string | null
        "dias_min"?: number | null
        "dias_max"?: number | null
        "litros_min"?: number | null
        "litros_max"?: number | null
        "reposo"?: boolean | null
        "que_vera"?: string | null
        "consejo"?: string | null
        "frecuencia_original"?: string | null
        "volumen_original"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "especie_alias"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "etapa"?: string | null
        "dias_min"?: number | null
        "dias_max"?: number | null
        "litros_min"?: number | null
        "litros_max"?: number | null
        "reposo"?: boolean | null
        "que_vera"?: string | null
        "consejo"?: string | null
        "frecuencia_original"?: string | null
        "volumen_original"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_riego_mes_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_riego_mes_mes_n_dim_meses_mes_n"
          columns: ["mes_n"]
          isOneToOne: false
          referencedRelation: "dim_meses"
          referencedColumns: ["mes_n"]
        }
        ]
      }
      fact_sanidad: {
        Row: {
        "especie_id": string
        "n": number
        "problema": string | null
        "sintomas": string | null
        "epoca": string | null
        "control_organico": string | null
        "control_quimico": string | null
        "prevencion": string | null
        "fuente": string | null
        }
        Insert: {
        "especie_id": string
        "n": number
        "problema"?: string | null
        "sintomas"?: string | null
        "epoca"?: string | null
        "control_organico"?: string | null
        "control_quimico"?: string | null
        "prevencion"?: string | null
        "fuente"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "n"?: number | null
        "problema"?: string | null
        "sintomas"?: string | null
        "epoca"?: string | null
        "control_organico"?: string | null
        "control_quimico"?: string | null
        "prevencion"?: string | null
        "fuente"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_sanidad_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_sugerencias: {
        Row: {
        "especie_id": string
        "tipo": string
        "nombre": string
        "etapa_o_nivel": string | null
        "categoria_o_plan": string | null
        "por_que": string | null
        }
        Insert: {
        "especie_id": string
        "tipo": string
        "nombre": string
        "etapa_o_nivel"?: string | null
        "categoria_o_plan"?: string | null
        "por_que"?: string | null
        }
        Update: {
        "especie_id"?: string | null
        "tipo"?: string | null
        "nombre"?: string | null
        "etapa_o_nivel"?: string | null
        "categoria_o_plan"?: string | null
        "por_que"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_sugerencias_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        }
        ]
      }
      fact_tareas_mes: {
        Row: {
        "clave": string
        "especie_id": string | null
        "mes": string | null
        "mes_n": number | null
        "etapa": string | null
        "riego": string | null
        "nutricion": string | null
        "sanidad": string | null
        "alerta_tarea": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "etapa"?: string | null
        "riego"?: string | null
        "nutricion"?: string | null
        "sanidad"?: string | null
        "alerta_tarea"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "mes"?: string | null
        "mes_n"?: number | null
        "etapa"?: string | null
        "riego"?: string | null
        "nutricion"?: string | null
        "sanidad"?: string | null
        "alerta_tarea"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_tareas_mes_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_tareas_mes_mes_n_dim_meses_mes_n"
          columns: ["mes_n"]
          isOneToOne: false
          referencedRelation: "dim_meses"
          referencedColumns: ["mes_n"]
        }
        ]
      }
      fact_viabilidad_zona: {
        Row: {
        "clave": string
        "especie_id": string | null
        "zona_agro_id": number | null
        "zona_agro": string | null
        "viabilidad": string | null
        "razon": string | null
        }
        Insert: {
        "clave": string
        "especie_id"?: string | null
        "zona_agro_id"?: number | null
        "zona_agro"?: string | null
        "viabilidad"?: string | null
        "razon"?: string | null
        }
        Update: {
        "clave"?: string | null
        "especie_id"?: string | null
        "zona_agro_id"?: number | null
        "zona_agro"?: string | null
        "viabilidad"?: string | null
        "razon"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_fact_viabilidad_zona_especie_id_dim_especies_especie_id"
          columns: ["especie_id"]
          isOneToOne: false
          referencedRelation: "dim_especies"
          referencedColumns: ["especie_id"]
        },
        {
          foreignKeyName: "fk_fact_viabilidad_zona_zona_agro_id_dim_zonas_agro_zona_agro_id"
          columns: ["zona_agro_id"]
          isOneToOne: false
          referencedRelation: "dim_zonas_agro"
          referencedColumns: ["zona_agro_id"]
        }
        ]
      }
      gf_analytics_events: {
        Row: {
        "id": string
        "user_id": string | null
        "session_id": string
        "device_id": string
        "event_category": string
        "event_name": string
        "gps_lat": number | null
        "gps_lng": number | null
        "gps_accuracy_meters": number | null
        "especie_id": string | null
        "dwell_time_ms": number | null
        "scroll_depth_percent": number | null
        "ad_unit_id": string | null
        "ad_partner_id": string | null
        "payload": Json | null
        "device_metadata": Json | null
        "client_timestamp": string
        "created_at": string | null
        "comuna": string | null
        "region": string | null
        "zona_agroclimatica": string | null
        }
        Insert: {
        "id"?: string | null
        "user_id"?: string | null
        "session_id": string
        "device_id": string
        "event_category": string
        "event_name": string
        "gps_lat"?: number | null
        "gps_lng"?: number | null
        "gps_accuracy_meters"?: number | null
        "especie_id"?: string | null
        "dwell_time_ms"?: number | null
        "scroll_depth_percent"?: number | null
        "ad_unit_id"?: string | null
        "ad_partner_id"?: string | null
        "payload"?: Json | null
        "device_metadata"?: Json | null
        "client_timestamp": string
        "created_at"?: string | null
        "comuna"?: string | null
        "region"?: string | null
        "zona_agroclimatica"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "session_id"?: string | null
        "device_id"?: string | null
        "event_category"?: string | null
        "event_name"?: string | null
        "gps_lat"?: number | null
        "gps_lng"?: number | null
        "gps_accuracy_meters"?: number | null
        "especie_id"?: string | null
        "dwell_time_ms"?: number | null
        "scroll_depth_percent"?: number | null
        "ad_unit_id"?: string | null
        "ad_partner_id"?: string | null
        "payload"?: Json | null
        "device_metadata"?: Json | null
        "client_timestamp"?: string | null
        "created_at"?: string | null
        "comuna"?: string | null
        "region"?: string | null
        "zona_agroclimatica"?: string | null
        }
        Relationships: []
      }
      gf_aplicaciones: {
        Row: {
        "id": string
        "user_id": string
        "arbol_id": string | null
        "especie": string
        "territorio_huerto_id": string | null
        "momento": string
        "producto": string
        "gramos": number | null
        "creado_en": string
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "arbol_id"?: string | null
        "especie": string
        "territorio_huerto_id"?: string | null
        "momento": string
        "producto": string
        "gramos"?: number | null
        "creado_en"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "arbol_id"?: string | null
        "especie"?: string | null
        "territorio_huerto_id"?: string | null
        "momento"?: string | null
        "producto"?: string | null
        "gramos"?: number | null
        "creado_en"?: string
        }
        Relationships: [
        {
          foreignKeyName: "fk_gf_aplicaciones_arbol_id_gf_arboles_id"
          columns: ["arbol_id"]
          isOneToOne: false
          referencedRelation: "gf_arboles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "fk_gf_aplicaciones_territorio_huerto_id_gf_huertos_id"
          columns: ["territorio_huerto_id"]
          isOneToOne: false
          referencedRelation: "gf_huertos"
          referencedColumns: ["id"]
        }
        ]
      }
      gf_arboles: {
        Row: {
        "id": string
        "user_id": string
        "especie": string
        "cantidad": number
        "fecha_plantacion": string | null
        "observaciones": string | null
        "created_at": string
        "updated_at": string
        "huerto_id": string | null
        "pos_x": number | null
        "pos_y": number | null
        "copa_m": number | null
        "metodo_riego": string | null
        "caudal_l_h": number | null
        "edad_n": number | null
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "especie": string
        "cantidad"?: number | null
        "fecha_plantacion"?: string | null
        "observaciones"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "huerto_id"?: string | null
        "pos_x"?: number | null
        "pos_y"?: number | null
        "copa_m"?: number | null
        "metodo_riego"?: string | null
        "caudal_l_h"?: number | null
        "edad_n"?: number | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "especie"?: string | null
        "cantidad"?: number
        "fecha_plantacion"?: string | null
        "observaciones"?: string | null
        "created_at"?: string
        "updated_at"?: string
        "huerto_id"?: string | null
        "pos_x"?: number | null
        "pos_y"?: number | null
        "copa_m"?: number | null
        "metodo_riego"?: string | null
        "caudal_l_h"?: number | null
        "edad_n"?: number | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_gf_arboles_edad_n_dim_edad_edad_n"
          columns: ["edad_n"]
          isOneToOne: false
          referencedRelation: "dim_edad"
          referencedColumns: ["edad_n"]
        },
        {
          foreignKeyName: "fk_gf_arboles_huerto_id_gf_huertos_id"
          columns: ["huerto_id"]
          isOneToOne: false
          referencedRelation: "gf_huertos"
          referencedColumns: ["id"]
        }
        ]
      }
      gf_cron_config: {
        Row: {
        "id": boolean
        "refresh_endpoint": string
        "refresh_token": string
        "updated_at": string | null
        "app_base_url": string
        "cron_secret": string
        }
        Insert: {
        "id"?: boolean | null
        "refresh_endpoint": string
        "refresh_token": string
        "updated_at"?: string | null
        "app_base_url"?: string | null
        "cron_secret"?: string | null
        }
        Update: {
        "id"?: boolean
        "refresh_endpoint"?: string | null
        "refresh_token"?: string | null
        "updated_at"?: string | null
        "app_base_url"?: string
        "cron_secret"?: string
        }
        Relationships: []
      }
      gf_cultivos: {
        Row: {
        "id": string
        "user_id": string
        "especie": string
        "cantidad": number
        "created_at": string
        "updated_at": string
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "especie": string
        "cantidad"?: number | null
        "created_at"?: string | null
        "updated_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "especie"?: string | null
        "cantidad"?: number
        "created_at"?: string
        "updated_at"?: string
        }
        Relationships: []
      }
      gf_huertos: {
        Row: {
        "id": string
        "user_id": string
        "nombre": string
        "terreno_geojson": Json | null
        "superficie_m2": number
        "created_at": string
        "updated_at": string
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "nombre"?: string | null
        "terreno_geojson"?: Json | null
        "superficie_m2"?: number | null
        "created_at"?: string | null
        "updated_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "nombre"?: string
        "terreno_geojson"?: Json | null
        "superficie_m2"?: number
        "created_at"?: string
        "updated_at"?: string
        }
        Relationships: []
      }
      gf_registro: {
        Row: {
        "id": string
        "user_id": string
        "fecha": string
        "especie": string
        "nota": string | null
        "produccion_kg": number | null
        "created_at": string
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "fecha"?: string | null
        "especie": string
        "nota"?: string | null
        "produccion_kg"?: number | null
        "created_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "fecha"?: string
        "especie"?: string | null
        "nota"?: string | null
        "produccion_kg"?: number | null
        "created_at"?: string
        }
        Relationships: []
      }
      gf_sponsorships: {
        Row: {
        "id": string
        "ad_unit_id": string
        "ad_partner_id": string
        "screen": string
        "title": string
        "description": string | null
        "cta_url": string | null
        "cta_label": string | null
        "image_url": string | null
        "active": boolean | null
        "sort_order": number | null
        "created_at": string | null
        "updated_at": string | null
        "amount": number
        "payment_status": string
        "provider_token": string | null
        "provider_payment_id": string | null
        "paid_at": string | null
        "targeting": Json | null
        }
        Insert: {
        "id"?: string | null
        "ad_unit_id": string
        "ad_partner_id": string
        "screen": string
        "title": string
        "description"?: string | null
        "cta_url"?: string | null
        "cta_label"?: string | null
        "image_url"?: string | null
        "active"?: boolean | null
        "sort_order"?: number | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "amount"?: number | null
        "payment_status"?: string | null
        "provider_token"?: string | null
        "provider_payment_id"?: string | null
        "paid_at"?: string | null
        "targeting"?: Json | null
        }
        Update: {
        "id"?: string
        "ad_unit_id"?: string | null
        "ad_partner_id"?: string | null
        "screen"?: string | null
        "title"?: string | null
        "description"?: string | null
        "cta_url"?: string | null
        "cta_label"?: string | null
        "image_url"?: string | null
        "active"?: boolean | null
        "sort_order"?: number | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "amount"?: number
        "payment_status"?: string
        "provider_token"?: string | null
        "provider_payment_id"?: string | null
        "paid_at"?: string | null
        "targeting"?: Json | null
        }
        Relationships: []
      }
      gf_subscription_plans: {
        Row: {
        "id": string
        "provider": string
        "tier": string
        "interval": string
        "provider_plan_id": string
        "active": boolean
        "created_at": string | null
        }
        Insert: {
        "id"?: string | null
        "provider"?: string | null
        "tier": string
        "interval": string
        "provider_plan_id": string
        "active"?: boolean | null
        "created_at"?: string | null
        }
        Update: {
        "id"?: string
        "provider"?: string
        "tier"?: string | null
        "interval"?: string | null
        "provider_plan_id"?: string | null
        "active"?: boolean
        "created_at"?: string | null
        }
        Relationships: []
      }
      gf_subscriptions: {
        Row: {
        "id": string
        "user_id": string
        "provider_customer_id": string | null
        "provider_subscription_id": string | null
        "plan": string
        "interval": string
        "status": string
        "current_period_start": string | null
        "current_period_end": string | null
        "trial_end": string | null
        "cancel_at": string | null
        "paid_via": string | null
        "created_at": string | null
        "updated_at": string | null
        "terminos_aceptados_at": string | null
        "terminos_aceptados_version": string | null
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "provider_customer_id"?: string | null
        "provider_subscription_id"?: string | null
        "plan": string
        "interval"?: string | null
        "status"?: string | null
        "current_period_start"?: string | null
        "current_period_end"?: string | null
        "trial_end"?: string | null
        "cancel_at"?: string | null
        "paid_via"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "terminos_aceptados_at"?: string | null
        "terminos_aceptados_version"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "provider_customer_id"?: string | null
        "provider_subscription_id"?: string | null
        "plan"?: string | null
        "interval"?: string
        "status"?: string
        "current_period_start"?: string | null
        "current_period_end"?: string | null
        "trial_end"?: string | null
        "cancel_at"?: string | null
        "paid_via"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "terminos_aceptados_at"?: string | null
        "terminos_aceptados_version"?: string | null
        }
        Relationships: []
      }
      gf_tareas: {
        Row: {
        "id": string
        "user_id": string
        "fecha": string
        "especie": string | null
        "tipo": string
        "texto": string
        "origen_id": string | null
        "estado": string
        "created_at": string
        "updated_at": string
        }
        Insert: {
        "id"?: string | null
        "user_id": string
        "fecha": string
        "especie"?: string | null
        "tipo": string
        "texto": string
        "origen_id"?: string | null
        "estado"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "fecha"?: string | null
        "especie"?: string | null
        "tipo"?: string | null
        "texto"?: string | null
        "origen_id"?: string | null
        "estado"?: string
        "created_at"?: string
        "updated_at"?: string
        }
        Relationships: []
      }
      gf_user_audiences: {
        Row: {
        "id": string
        "user_id": string | null
        "commercial_segments": string[] | null
        "purchasing_power_tier": string | null
        "last_active_phenology_stage": string | null
        "primary_interest_crop": string | null
        "total_ad_impressions": number | null
        "total_ad_clicks": number | null
        "updated_at": string | null
        }
        Insert: {
        "id"?: string | null
        "user_id"?: string | null
        "commercial_segments"?: string[] | null
        "purchasing_power_tier"?: string | null
        "last_active_phenology_stage"?: string | null
        "primary_interest_crop"?: string | null
        "total_ad_impressions"?: number | null
        "total_ad_clicks"?: number | null
        "updated_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "commercial_segments"?: string[] | null
        "purchasing_power_tier"?: string | null
        "last_active_phenology_stage"?: string | null
        "primary_interest_crop"?: string | null
        "total_ad_impressions"?: number | null
        "total_ad_clicks"?: number | null
        "updated_at"?: string | null
        }
        Relationships: [
        {
          foreignKeyName: "fk_gf_user_audiences_user_id_perfiles_id"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "perfiles"
          referencedColumns: ["id"]
        }
        ]
      }
      gf_user_consents: {
        Row: {
        "id": string
        "user_id": string | null
        "device_id": string
        "consent_string": string | null
        "consent_personalized_ads": boolean | null
        "consent_precise_geo": boolean | null
        "consent_third_party_sharing": boolean | null
        "consent_device_linking": boolean | null
        "legitimate_interest_opposed": boolean | null
        "consent_timestamp": string
        "expires_at": string
        "ip_address": string | null
        "user_agent": string | null
        "created_at": string | null
        "updated_at": string | null
        }
        Insert: {
        "id"?: string | null
        "user_id"?: string | null
        "device_id": string
        "consent_string"?: string | null
        "consent_personalized_ads"?: boolean | null
        "consent_precise_geo"?: boolean | null
        "consent_third_party_sharing"?: boolean | null
        "consent_device_linking"?: boolean | null
        "legitimate_interest_opposed"?: boolean | null
        "consent_timestamp"?: string | null
        "expires_at"?: string | null
        "ip_address"?: string | null
        "user_agent"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        }
        Update: {
        "id"?: string
        "user_id"?: string | null
        "device_id"?: string | null
        "consent_string"?: string | null
        "consent_personalized_ads"?: boolean | null
        "consent_precise_geo"?: boolean | null
        "consent_third_party_sharing"?: boolean | null
        "consent_device_linking"?: boolean | null
        "legitimate_interest_opposed"?: boolean | null
        "consent_timestamp"?: string
        "expires_at"?: string
        "ip_address"?: string | null
        "user_agent"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        }
        Relationships: []
      }
      perfiles: {
        Row: {
        "id": string
        "email": string
        "nombre": string | null
        "region": string
        "comuna": string
        "zona_agroclimatica": string
        "superficie_m2": number | null
        "tipo_huerto": string | null
        "plan": string | null
        "payment_provider": string | null
        "subscription_id": string | null
        "subscription_status": string | null
        "created_at": string | null
        "updated_at": string | null
        "terreno_geojson": Json | null
        "huerto_modo": string | null
        "asistente_completado_at": string | null
        "tipo_suelo": string | null
        "suelo_origen": string | null
        "suelo_at": string | null
        }
        Insert: {
        "id": string
        "email": string
        "nombre"?: string | null
        "region": string
        "comuna": string
        "zona_agroclimatica": string
        "superficie_m2"?: number | null
        "tipo_huerto"?: string | null
        "plan"?: string | null
        "payment_provider"?: string | null
        "subscription_id"?: string | null
        "subscription_status"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "terreno_geojson"?: Json | null
        "huerto_modo"?: string | null
        "asistente_completado_at"?: string | null
        "tipo_suelo"?: string | null
        "suelo_origen"?: string | null
        "suelo_at"?: string | null
        }
        Update: {
        "id"?: string | null
        "email"?: string | null
        "nombre"?: string | null
        "region"?: string | null
        "comuna"?: string | null
        "zona_agroclimatica"?: string | null
        "superficie_m2"?: number | null
        "tipo_huerto"?: string | null
        "plan"?: string | null
        "payment_provider"?: string | null
        "subscription_id"?: string | null
        "subscription_status"?: string | null
        "created_at"?: string | null
        "updated_at"?: string | null
        "terreno_geojson"?: Json | null
        "huerto_modo"?: string | null
        "asistente_completado_at"?: string | null
        "tipo_suelo"?: string | null
        "suelo_origen"?: string | null
        "suelo_at"?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      gf_riego_edad: {
        Row: {
        "n": number | null
        "nombre": string | null
        "factor_litros": number | null
        "factor_dias": number | null
        }
        Relationships: []
      }
      gf_riego_especies: {
        Row: {
        "especie": string | null
        "excel_nombre": string | null
        "nombre_cientifico": string | null
        "grupo": string | null
        "mantencion_l": number | null
        "suelo": string | null
        "ph": string | null
        "copa_ref_m": number | null
        }
        Relationships: []
      }
      gf_riego_etapas: {
        Row: {
        "especie": string | null
        "codigo": string | null
        "etapa_programa": string | null
        "meses_originales": string | null
        "coincide_exacta": boolean | null
        "dias_min": number | null
        "dias_max": number | null
        "litros_min": number | null
        "litros_max": number | null
        }
        Relationships: []
      }
      gf_riego_humedad: {
        Row: {
        "nivel": number | null
        "nombre": string | null
        "pct_min": number | null
        "pct_max": number | null
        "factor_riego": number | null
        "factor_control": number | null
        "significado": string | null
        }
        Relationships: []
      }
      gf_riego_mensual: {
        Row: {
        "especie": string | null
        "mes": number | null
        "etapa": string | null
        "dias_min": number | null
        "dias_max": number | null
        "litros_min": number | null
        "litros_max": number | null
        "reposo": number | null
        }
        Relationships: []
      }
      gf_riego_suelos: {
        Row: {
        "clave": string | null
        "nombre": string | null
        "tecnico": string | null
        "agua_min_mm": number | null
        "agua_max_mm": number | null
        "factor": number | null
        "manejo": string | null
        }
        Relationships: []
      }
      gf_riego_zonas: {
        Row: {
        "clave": string | null
        "nombre": string | null
        "donde_queda": string | null
        "eto_verano": string | null
        "factor_clima": number | null
        "desfase": number | null
        "significado": string | null
        }
        Relationships: []
      }
      vw_riego_suelos_consistencia: {
        Row: {
        "clave": string | null
        "nombre": string | null
        "tecnico": string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_insights_metrics: {
        Args: Record<string, never>
        Returns: Json
      }
      admin_media_kit: {
        Args: Record<string, never>
        Returns: Json
      }
      admin_overview_metrics: {
        Args: Record<string, never>
        Returns: Json
      }
      bloquea_cambio_plan_perfiles: {
        Args: Record<string, never>
        Returns: unknown
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      purga_eventos_telemetria: {
        Args: { "p_meses": number; "p_lote": number }
        Returns: number
      }
      set_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {
      sponsorship_payment_status: "unpaid" | "pending" | "paid" | "failed"
      sponsorship_screen: "explorar" | "huerto" | "ficha" | "calendario"
      telem_event_category: "PRODUCT_USAGE" | "AD_INTERACTION" | "CMP_CONSENT" | "COMMERCE_INTENT"
      telem_event_name: "VIEW_FICHA" | "PAGE_VIEW" | "CALCULATOR_SUBMIT" | "AD_IMPRESSION" | "AD_CLICK" | "SEARCH_INP" | "CMP_CONSENT_GRANTED" | "CMP_CONSENT_UPDATED" | "INPUT_QUOTE"
    }
    CompositeTypes: {
      never: never
    }
  }
}
