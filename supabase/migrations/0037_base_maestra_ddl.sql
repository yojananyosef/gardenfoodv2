-- Migracion generada por scripts/generar_base_maestra.py --sql
-- NO editar a mano. Editar el Excel o data/*.csv y regenerar.
--
-- Sin BEGIN/COMMIT explicito a proposito: se aplica con el MCP
-- (apply_migration), que ya envuelve todo en una transaccion. Un
-- COMMIT interno cortaria esa transaccion a mitad de camino.

-- 0037: esquema de las 34 tablas del Excel maestro v3.
-- Solo estructura: sin datos. La app todavia no lee de aqui.

-- dim_especies: 30 filas desde la hoja DIM_ESPECIES del Excel maestro.
create table public.dim_especies (
    especie_id text,
    especie text,
    nombre_cientifico text,
    grupo text,
    alias_riego text,
    nombre_en_excel_riego text,
    alias_nutricion text,
    alias_bd20 text,
    tiene_ficha_bd20 boolean,
    origen_programa_riego text,
    riego_mantencion_l smallint,
    copa_ref_m numeric,
    suelo_preferido text,
    ph_ideal text,
    ph_min numeric,
    ph_max numeric,
    rendimiento_ref_kg_pl numeric,
    marco_plantacion text,
    densidad_pl_ha integer,
    patron_parcializacion text,
    confianza_nutricion text,
    fuente_nutricion text,
    nota_critica_nutricion text,
    foliar_epoca text,
    foliar_tejido text,
    constraint dim_especies_pkey primary key (especie_id)
);

-- dim_comunas: 346 filas desde la hoja DIM_COMUNAS del Excel maestro.
create table public.dim_comunas (
    comuna_id text,
    comuna text,
    cut smallint,
    region text,
    zona_riego_id text,
    origen_zona_riego text,
    macrozona_id text,
    origen_macrozona text,
    criterio_asignacion text,
    zona_agro_id integer,
    origen_zona_agro text,
    zona_agro_propuesta_id integer,
    tipo_clima text,
    heladas text,
    riesgo_sequia text,
    restricciones_huerto text,
    nota_cut text,
    constraint dim_comunas_pkey primary key (comuna_id)
);

-- dim_zonas_riego: 11 filas desde la hoja DIM_ZONAS_RIEGO del Excel maestro.
create table public.dim_zonas_riego (
    zona_riego_id text,
    zona_riego text,
    donde_queda text,
    eto_verano_mm_dia text,
    factor_clima numeric,
    desfase_meses smallint,
    que_significa text,
    eto_verano_min numeric,
    eto_verano_max numeric,
    constraint dim_zonas_riego_pkey primary key (zona_riego_id)
);

-- dim_zonas_agro: 20 filas desde la hoja DIM_ZONAS_AGRO del Excel maestro.
create table public.dim_zonas_agro (
    zona_agro_id integer,
    zona_agro text,
    region text,
    tipo_clima text,
    t_max_enero text,
    t_min_julio text,
    t_min_absoluta text,
    precipitacion_anual_mm smallint,
    horas_frio text,
    heladas_dias_ano text,
    riesgo_sequia text,
    estacion_agromet text,
    constraint dim_zonas_agro_pkey primary key (zona_agro_id)
);

-- dim_macrozonas: 6 filas desde la hoja DIM_MACROZONAS del Excel maestro.
create table public.dim_macrozonas (
    macrozona_id text,
    macrozona text,
    factor_n numeric,
    factor_p2o5 numeric,
    factor_k2o numeric,
    factor_cao numeric,
    factor_mgo numeric,
    parcialidades_min_ano smallint,
    por_que text,
    constraint dim_macrozonas_pkey primary key (macrozona_id)
);

-- dim_suelos: 4 filas desde la hoja DIM_SUELOS del Excel maestro.
create table public.dim_suelos (
    suelo_id text,
    suelo text,
    nombres_usda text,
    agua_min_mm_m smallint,
    agua_max_mm_m smallint,
    factor_suelo numeric,
    como_se_siente text,
    como_manejarlo text,
    constraint dim_suelos_pkey primary key (suelo_id)
);

-- dim_humedad: 5 filas desde la hoja DIM_HUMEDAD del Excel maestro.
create table public.dim_humedad (
    humedad_n smallint,
    nivel text,
    pct_min smallint,
    pct_max smallint,
    factor_riego numeric,
    factor_control numeric,
    que_significa text,
    se_ve_gruesa text,
    se_ve_mod_gruesa text,
    se_ve_media text,
    se_ve_fina text,
    constraint dim_humedad_pkey primary key (humedad_n)
);

-- dim_edad: 4 filas desde la hoja DIM_EDAD del Excel maestro.
create table public.dim_edad (
    edad_n smallint,
    edad text,
    anos_min smallint,
    anos_max smallint,
    factor_litros numeric,
    factor_dias numeric,
    constraint dim_edad_pkey primary key (edad_n)
);

-- dim_edad_nutricion: 3 filas desde la hoja DIM_EDAD_NUTRICION del Excel maestro.
create table public.dim_edad_nutricion (
    edad_nutricion_id text,
    tramo text,
    anos_min smallint,
    anos_max smallint,
    factor_nutricion numeric,
    constraint dim_edad_nutricion_pkey primary key (edad_nutricion_id)
);

-- dim_etapas: 8 filas desde la hoja DIM_ETAPAS del Excel maestro.
create table public.dim_etapas (
    codigo_etapa text,
    lo_que_ve text,
    kc_referencial text,
    constraint dim_etapas_pkey primary key (codigo_etapa)
);

-- dim_meses: 12 filas desde la hoja DIM_MESES del Excel maestro.
create table public.dim_meses (
    mes_n smallint check (mes_n between 1 and 12),
    mes text,
    abrev text,
    constraint dim_meses_pkey primary key (mes_n)
);

-- dim_parcializacion: 20 filas desde la hoja DIM_PARCIALIZACION del Excel maestro.
create table public.dim_parcializacion (
    clave text,
    patron text,
    nutriente text,
    brotacion_a_cuaja numeric,
    cuaja_a_cosecha numeric,
    postcosecha numeric,
    rango_inia text,
    dentro_rango text,
    que_significa text,
    constraint dim_parcializacion_pkey primary key (clave)
);

-- cat_fert_casero: 11 filas desde la hoja CAT_FERT_CASERO del Excel maestro.
create table public.cat_fert_casero (
    producto text,
    etiqueta text,
    n_pct numeric,
    p_pct smallint,
    k_pct smallint,
    calcio_pct numeric,
    magnesio_pct smallint,
    g_por_cucharada smallint,
    se_reparte text,
    como_pedirlo_y_cuidar text,
    constraint cat_fert_casero_pkey primary key (producto)
);

-- cat_fert_tecnico: 29 filas desde la hoja CAT_FERT_TECNICO del Excel maestro.
create table public.cat_fert_tecnico (
    producto_id text,
    tipo text,
    fertilizante text,
    n_pct numeric,
    p2o5_pct numeric,
    k2o_pct smallint,
    cao_pct numeric,
    mgo_pct numeric,
    s_pct numeric,
    reaccion_ph text,
    apto_organico text,
    solubilidad_g_l text,
    para_que_y_cuidados text,
    constraint cat_fert_tecnico_pkey primary key (producto_id)
);

-- fact_riego_mes: 360 filas desde la hoja FACT_RIEGO_MES del Excel maestro.
create table public.fact_riego_mes (
    clave text,
    especie_id text,
    especie_alias text,
    mes text,
    mes_n smallint check (mes_n between 1 and 12),
    etapa text,
    dias_min smallint,
    dias_max smallint,
    litros_min smallint,
    litros_max smallint,
    reposo boolean,
    que_vera text,
    consejo text,
    frecuencia_original text,
    volumen_original text,
    constraint fact_riego_mes_pkey primary key (clave)
);

-- fact_riego_etapa: 210 filas desde la hoja FACT_RIEGO_ETAPA del Excel maestro.
create table public.fact_riego_etapa (
    clave text,
    especie_id text,
    codigo_etapa text,
    etapa text,
    meses_originales text,
    coincide_exacto text,
    dias_min smallint,
    dias_max smallint,
    litros_min smallint,
    litros_max smallint,
    reposo boolean,
    que_vera text,
    consejo text,
    constraint fact_riego_etapa_pkey primary key (clave)
);

-- fact_fenologia: 180 filas desde la hoja FACT_FENOLOGIA del Excel maestro.
create table public.fact_fenologia (
    clave text,
    especie_id text,
    macrozona_id text,
    macrozona text,
    viable text,
    brotacion text,
    floracion text,
    cuaja text,
    cosecha text,
    cosecha_inicio text,
    cosecha_fin text,
    meses_despierta text,
    meses_engorda text,
    meses_recupera text,
    veces_ano_suelo smallint,
    veces_ano_goteo smallint,
    nota text,
    caida_hojas text,
    nota_fenologia_bc text,
    constraint fact_fenologia_pkey primary key (clave)
);

-- fact_fert_programa: 786 filas desde la hoja FACT_FERT_PROGRAMA del Excel maestro.
create table public.fact_fert_programa (
    clave text,
    especie_id text,
    macrozona_id text,
    sistema text,
    periodo_n smallint,
    periodo text,
    meses text,
    veces smallint,
    frecuencia text,
    ca_producto text,
    ca_g_cada_vez numeric,
    ca_veces smallint,
    ca_g_periodo numeric,
    mg_producto text,
    mg_g_cada_vez numeric,
    mg_veces smallint,
    mg_g_periodo numeric,
    k_producto text,
    k_g_cada_vez numeric,
    k_veces smallint,
    k_g_periodo numeric,
    p_producto text,
    p_g_cada_vez numeric,
    p_veces smallint,
    p_g_periodo numeric,
    n_producto text,
    n_g_cada_vez numeric,
    n_veces smallint,
    n_g_periodo numeric,
    constraint fact_fert_programa_pkey primary key (clave)
);

-- fact_nutrientes_anual: 30 filas desde la hoja FACT_NUTRIENTES_ANUAL del Excel maestro.
create table public.fact_nutrientes_anual (
    especie_id text,
    especie_alias text,
    categoria text,
    n_kg_t numeric,
    p2o5_kg_t numeric,
    k2o_kg_t numeric,
    cao_kg_t numeric,
    mgo_kg_t numeric,
    patron_parcializacion text,
    confianza text,
    rendimiento_ref_kg_pl numeric,
    marco_plantacion text,
    densidad_pl_ha integer,
    fuente text,
    n_g_pl_adulta numeric,
    p2o5_g_pl_adulta numeric,
    k2o_g_pl_adulta numeric,
    cao_g_pl_adulta numeric,
    mgo_g_pl_adulta numeric,
    constraint fact_nutrientes_anual_pkey primary key (especie_id)
);

-- fact_viabilidad_zona: 600 filas desde la hoja FACT_VIABILIDAD_ZONA del Excel maestro.
create table public.fact_viabilidad_zona (
    clave text,
    especie_id text,
    zona_agro_id integer,
    zona_agro text,
    viabilidad text,
    constraint fact_viabilidad_zona_pkey primary key (clave)
);

-- fact_labores_mes: 360 filas desde la hoja FACT_LABORES_MES del Excel maestro.
create table public.fact_labores_mes (
    clave text,
    especie_id text,
    mes text,
    mes_n smallint check (mes_n between 1 and 12),
    labores text,
    constraint fact_labores_mes_pkey primary key (clave)
);

-- fact_manejo_estacion: 120 filas desde la hoja FACT_MANEJO_ESTACION del Excel maestro.
create table public.fact_manejo_estacion (
    especie_id text,
    estacion text,
    labores text,
    constraint fact_manejo_estacion_pkey primary key (especie_id, estacion)
);

-- fact_plagas: 110 filas desde la hoja FACT_PLAGAS del Excel maestro.
create table public.fact_plagas (
    especie_id text,
    plaga_enfermedad text,
    tipo text,
    sintomas text,
    epoca_riesgo text,
    control_organico text,
    control_quimico text,
    causa_y_prevencion text,
    constraint fact_plagas_pkey primary key (especie_id, plaga_enfermedad)
);

-- fact_poda: 104 filas desde la hoja FACT_PODA del Excel maestro.
create table public.fact_poda (
    especie_id text,
    n smallint,
    tipo_poda text,
    cuando text,
    que_cortar text,
    herramienta text,
    por_que text,
    error_frecuente text,
    fuente text,
    constraint fact_poda_pkey primary key (especie_id, n)
);

-- fact_sanidad: 160 filas desde la hoja FACT_SANIDAD del Excel maestro.
create table public.fact_sanidad (
    especie_id text,
    n smallint,
    problema text,
    sintomas text,
    epoca text,
    control_organico text,
    control_quimico text,
    prevencion text,
    fuente text,
    constraint fact_sanidad_pkey primary key (especie_id, n)
);

-- fact_consejos: 211 filas desde la hoja FACT_CONSEJOS del Excel maestro.
create table public.fact_consejos (
    especie_id text,
    n smallint,
    consejo text,
    fuente text,
    constraint fact_consejos_pkey primary key (especie_id, n)
);

-- fact_fert_organica: 181 filas desde la hoja FACT_FERT_ORGANICA del Excel maestro.
create table public.fact_fert_organica (
    especie_id text,
    n smallint,
    mes text,
    que_pasa text,
    fertilizante text,
    dosis_por_arbol text,
    donde_aplicar text,
    por_que text,
    tipo text,
    fuente text,
    constraint fact_fert_organica_pkey primary key (especie_id, n, mes)
);

-- fact_ficha_riego: 149 filas desde la hoja FACT_FICHA_RIEGO del Excel maestro.
create table public.fact_ficha_riego (
    especie_id text,
    n smallint,
    etapa text,
    meses text,
    frecuencia text,
    volumen text,
    senal_visual text,
    por_que_fisiologico text,
    constraint fact_ficha_riego_pkey primary key (especie_id, n)
);

-- fact_ficha_fertilizacion: 149 filas desde la hoja FACT_FICHA_FERTILIZACION del Excel maestro.
create table public.fact_ficha_fertilizacion (
    especie_id text,
    n smallint,
    mes text,
    etapa text,
    producto text,
    dosis text,
    donde text,
    por_que_fisiologico text,
    constraint fact_ficha_fertilizacion_pkey primary key (especie_id, n)
);

-- fact_sugerencias: 335 filas desde la hoja FACT_SUGERENCIAS del Excel maestro.
create table public.fact_sugerencias (
    especie_id text,
    tipo text,
    nombre text,
    etapa_o_nivel text,
    categoria_o_plan text,
    por_que text,
    constraint fact_sugerencias_pkey primary key (especie_id, tipo, nombre)
);

-- fact_clima_zona: 20 filas desde la hoja FACT_CLIMA_ZONA del Excel maestro.
create table public.fact_clima_zona (
    zona_agro_id integer,
    t_max_enero_c smallint,
    t_min_julio_c smallint,
    t_min_absoluta_c smallint,
    t_min_absoluta_nota text,
    precipitacion_anual_mm smallint,
    horas_frio_min smallint,
    horas_frio_max smallint,
    heladas_dias_min smallint,
    heladas_dias_max smallint,
    riesgo_sequia text,
    t_media_anual_c text,
    t_media_mensual_c text,
    probabilidad_helada_pct text,
    horas_sol_anual text,
    nubosidad_pct text,
    lluvia_invierno_mm text,
    lluvia_verano_mm text,
    fuente text,
    nota_vacios text,
    constraint fact_clima_zona_pkey primary key (zona_agro_id)
);

-- fact_tareas_mes: 240 filas desde la hoja FACT_TAREAS_MES del Excel maestro.
create table public.fact_tareas_mes (
    clave text,
    especie_id text,
    mes text,
    mes_n smallint check (mes_n between 1 and 12),
    etapa text,
    riego text,
    nutricion text,
    sanidad text,
    alerta_tarea text,
    constraint fact_tareas_mes_pkey primary key (clave)
);

-- especies_ficha_bd20: 30 filas desde la hoja ESPECIES_FICHA_BD20 del Excel maestro.
create table public.especies_ficha_bd20 (
    especie_id text,
    clima_ideal text,
    distancia text,
    primera_cosecha text,
    vida_productiva text,
    variedades text,
    horas_frio text,
    polinizacion text,
    tamano_adulto text,
    cosecha_cuando text,
    cosecha_como_saber text,
    cosecha_tecnica text,
    postcosecha text,
    rendimiento_esperado text,
    constraint especies_ficha_bd20_pkey primary key (especie_id)
);

-- especies_bc: 30 filas desde la hoja ESPECIES_BC del Excel maestro.
create table public.especies_bc (
    especie_id text,
    categoria text,
    dificultad text,
    zonas_recomendadas text,
    horas_frio text,
    temp_minima text,
    temp_maxima text,
    t_limite_ficha text,
    requerimiento_hidrico text,
    tipo_suelo text,
    ph text,
    exposicion_solar text,
    epoca_plantacion text,
    epoca_cosecha text,
    distancia_plantacion text,
    plagas_principales text,
    enfermedades_principales text,
    nivel_mantenimiento text,
    tiempo_hasta_produccion text,
    rendimiento_esperado text,
    compatible_patio text,
    compatible_maceta text,
    observaciones text,
    referencias text,
    ficha_fuente text,
    ficha_cosecha_cuando text,
    ficha_cosecha_senal text,
    ficha_cosecha_tecnica text,
    ficha_postcosecha text,
    ficha_rendimiento text,
    constraint especies_bc_pkey primary key (especie_id)
);

-- Claves foraneas.
alter table public.dim_comunas add constraint dim_comunas_zona_riego_id_fkey foreign key (zona_riego_id) references public.dim_zonas_riego (zona_riego_id) on update cascade on delete restrict;
alter table public.dim_comunas add constraint dim_comunas_macrozona_id_fkey foreign key (macrozona_id) references public.dim_macrozonas (macrozona_id) on update cascade on delete restrict;
alter table public.dim_comunas add constraint dim_comunas_zona_agro_id_fkey foreign key (zona_agro_id) references public.dim_zonas_agro (zona_agro_id) on update cascade on delete restrict;
alter table public.fact_riego_mes add constraint fact_riego_mes_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_riego_mes add constraint fact_riego_mes_mes_n_fkey foreign key (mes_n) references public.dim_meses (mes_n) on update cascade on delete restrict;
alter table public.fact_riego_etapa add constraint fact_riego_etapa_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_riego_etapa add constraint fact_riego_etapa_codigo_etapa_fkey foreign key (codigo_etapa) references public.dim_etapas (codigo_etapa) on update cascade on delete restrict;
alter table public.fact_fenologia add constraint fact_fenologia_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_fenologia add constraint fact_fenologia_macrozona_id_fkey foreign key (macrozona_id) references public.dim_macrozonas (macrozona_id) on update cascade on delete restrict;
alter table public.fact_fert_programa add constraint fact_fert_programa_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_fert_programa add constraint fact_fert_programa_macrozona_id_fkey foreign key (macrozona_id) references public.dim_macrozonas (macrozona_id) on update cascade on delete restrict;
alter table public.fact_nutrientes_anual add constraint fact_nutrientes_anual_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_viabilidad_zona add constraint fact_viabilidad_zona_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_viabilidad_zona add constraint fact_viabilidad_zona_zona_agro_id_fkey foreign key (zona_agro_id) references public.dim_zonas_agro (zona_agro_id) on update cascade on delete restrict;
alter table public.fact_labores_mes add constraint fact_labores_mes_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_labores_mes add constraint fact_labores_mes_mes_n_fkey foreign key (mes_n) references public.dim_meses (mes_n) on update cascade on delete restrict;
alter table public.fact_manejo_estacion add constraint fact_manejo_estacion_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_plagas add constraint fact_plagas_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_poda add constraint fact_poda_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_sanidad add constraint fact_sanidad_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_consejos add constraint fact_consejos_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_fert_organica add constraint fact_fert_organica_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_ficha_riego add constraint fact_ficha_riego_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_ficha_fertilizacion add constraint fact_ficha_fertilizacion_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_sugerencias add constraint fact_sugerencias_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_clima_zona add constraint fact_clima_zona_zona_agro_id_fkey foreign key (zona_agro_id) references public.dim_zonas_agro (zona_agro_id) on update cascade on delete restrict;
alter table public.fact_tareas_mes add constraint fact_tareas_mes_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.fact_tareas_mes add constraint fact_tareas_mes_mes_n_fkey foreign key (mes_n) references public.dim_meses (mes_n) on update cascade on delete restrict;
alter table public.especies_ficha_bd20 add constraint especies_ficha_bd20_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;
alter table public.especies_bc add constraint especies_bc_especie_id_fkey foreign key (especie_id) references public.dim_especies (especie_id) on update cascade on delete restrict;

-- Solo lectura, como las gf_riego_* que los reemplazan.
alter table public.dim_especies enable row level security;
create policy dim_especies_lectura_publica on public.dim_especies for select to anon, authenticated using (true);

alter table public.dim_comunas enable row level security;
create policy dim_comunas_lectura_publica on public.dim_comunas for select to anon, authenticated using (true);

alter table public.dim_zonas_riego enable row level security;
create policy dim_zonas_riego_lectura_publica on public.dim_zonas_riego for select to anon, authenticated using (true);

alter table public.dim_zonas_agro enable row level security;
create policy dim_zonas_agro_lectura_publica on public.dim_zonas_agro for select to anon, authenticated using (true);

alter table public.dim_macrozonas enable row level security;
create policy dim_macrozonas_lectura_publica on public.dim_macrozonas for select to anon, authenticated using (true);

alter table public.dim_suelos enable row level security;
create policy dim_suelos_lectura_publica on public.dim_suelos for select to anon, authenticated using (true);

alter table public.dim_humedad enable row level security;
create policy dim_humedad_lectura_publica on public.dim_humedad for select to anon, authenticated using (true);

alter table public.dim_edad enable row level security;
create policy dim_edad_lectura_publica on public.dim_edad for select to anon, authenticated using (true);

alter table public.dim_edad_nutricion enable row level security;
create policy dim_edad_nutricion_lectura_publica on public.dim_edad_nutricion for select to anon, authenticated using (true);

alter table public.dim_etapas enable row level security;
create policy dim_etapas_lectura_publica on public.dim_etapas for select to anon, authenticated using (true);

alter table public.dim_meses enable row level security;
create policy dim_meses_lectura_publica on public.dim_meses for select to anon, authenticated using (true);

alter table public.dim_parcializacion enable row level security;
create policy dim_parcializacion_lectura_publica on public.dim_parcializacion for select to anon, authenticated using (true);

alter table public.cat_fert_casero enable row level security;
create policy cat_fert_casero_lectura_publica on public.cat_fert_casero for select to anon, authenticated using (true);

alter table public.cat_fert_tecnico enable row level security;
create policy cat_fert_tecnico_lectura_publica on public.cat_fert_tecnico for select to anon, authenticated using (true);

alter table public.fact_riego_mes enable row level security;
create policy fact_riego_mes_lectura_publica on public.fact_riego_mes for select to anon, authenticated using (true);

alter table public.fact_riego_etapa enable row level security;
create policy fact_riego_etapa_lectura_publica on public.fact_riego_etapa for select to anon, authenticated using (true);

alter table public.fact_fenologia enable row level security;
create policy fact_fenologia_lectura_publica on public.fact_fenologia for select to anon, authenticated using (true);

alter table public.fact_fert_programa enable row level security;
create policy fact_fert_programa_lectura_publica on public.fact_fert_programa for select to anon, authenticated using (true);

alter table public.fact_nutrientes_anual enable row level security;
create policy fact_nutrientes_anual_lectura_publica on public.fact_nutrientes_anual for select to anon, authenticated using (true);

alter table public.fact_viabilidad_zona enable row level security;
create policy fact_viabilidad_zona_lectura_publica on public.fact_viabilidad_zona for select to anon, authenticated using (true);

alter table public.fact_labores_mes enable row level security;
create policy fact_labores_mes_lectura_publica on public.fact_labores_mes for select to anon, authenticated using (true);

alter table public.fact_manejo_estacion enable row level security;
create policy fact_manejo_estacion_lectura_publica on public.fact_manejo_estacion for select to anon, authenticated using (true);

alter table public.fact_plagas enable row level security;
create policy fact_plagas_lectura_publica on public.fact_plagas for select to anon, authenticated using (true);

alter table public.fact_poda enable row level security;
create policy fact_poda_lectura_publica on public.fact_poda for select to anon, authenticated using (true);

alter table public.fact_sanidad enable row level security;
create policy fact_sanidad_lectura_publica on public.fact_sanidad for select to anon, authenticated using (true);

alter table public.fact_consejos enable row level security;
create policy fact_consejos_lectura_publica on public.fact_consejos for select to anon, authenticated using (true);

alter table public.fact_fert_organica enable row level security;
create policy fact_fert_organica_lectura_publica on public.fact_fert_organica for select to anon, authenticated using (true);

alter table public.fact_ficha_riego enable row level security;
create policy fact_ficha_riego_lectura_publica on public.fact_ficha_riego for select to anon, authenticated using (true);

alter table public.fact_ficha_fertilizacion enable row level security;
create policy fact_ficha_fertilizacion_lectura_publica on public.fact_ficha_fertilizacion for select to anon, authenticated using (true);

alter table public.fact_sugerencias enable row level security;
create policy fact_sugerencias_lectura_publica on public.fact_sugerencias for select to anon, authenticated using (true);

alter table public.fact_clima_zona enable row level security;
create policy fact_clima_zona_lectura_publica on public.fact_clima_zona for select to anon, authenticated using (true);

alter table public.fact_tareas_mes enable row level security;
create policy fact_tareas_mes_lectura_publica on public.fact_tareas_mes for select to anon, authenticated using (true);

alter table public.especies_ficha_bd20 enable row level security;
create policy especies_ficha_bd20_lectura_publica on public.especies_ficha_bd20 for select to anon, authenticated using (true);

alter table public.especies_bc enable row level security;
create policy especies_bc_lectura_publica on public.especies_bc for select to anon, authenticated using (true);

