-- 0046_indices_para_las_fks_sin_indice: cierra los advisors de rendimiento
--
-- Supabase reportaba 60 advisors de rendimiento, casi todos
-- `unindexed_foreign_keys`. Al revisarlos uno por uno, 33 FKs no tenian indice
-- de una columna en la que referencian. Pero solo 20 las necesitan de verdad:
--
--   13 YA ESTABAN CUBIERTAS por un indice compuesto cuya primera columna es la
--   de la FK. El advisor las marca igual porque exige un indice de una sola
--   columna y no mira los compuestos:
--
--     fact_consejos.especie_id           <- fact_consejos_pkey
--     fact_ficha_riego.especie_id        <- fact_ficha_riego_pkey
--     fact_sanidad.especie_id            <- fact_sanidad_pkey
--     gf_analytics_events.user_id        <- idx_events_user_time (user_id, created_at)
--     gf_tareas.user_id                  <- gf_tareas_user_fecha_idx, gf_tareas_user_estado_idx
--     gf_user_consents.user_id           <- idx_user_consents_user_device
--     ... y las demas de especie_id, que son la primera columna del pkey
--
-- Por eso se reviso con scripts/fks_sin_indice_reales.mjs antes de crear nada:
-- de 33 salecias, 13 eran falsos positivos y crear un indice de una columna
-- encima de un compuesto habria sido redundante.
--
-- Las 20 que si faltaban se resuelven con 13 indices, no con 20: donde las dos
-- FKs de una tabla se siempre juntas en la misma consulta, van en un indice
-- compuesto en ese orden.
--
--   fact_riego_mes, fact_labores_mes, fact_tareas_mes  (especie_id, mes_n)
--     El calendario siempre pregunta "este cultivo, estos meses".
--   fact_fenologia, fact_fert_programa                 (especie_id, macrozona_id)
--     La fenologia y la fertilizacion son por especie dentro de una macrozona.
--   fact_viabilidad_zona                               (especie_id, zona_agro_id)
--     La viabilidad es por especie en una zona concreta.
--   fact_riego_etapa                                  (especie_id, codigo_etapa)
--     Las etapas de riego se piden ordenadas por codigo.
--
-- dim_comunas y gf_aplicaciones llevan indices simples porque sus FKs se
-- consultan por separado, no juntas.
--
-- NOTA HONESTA sobre el beneficio: hoy estas tablas son de 3 a 786 filas.
-- Con ese tamano Postgres va a hacer seq scan igual, porque le sale mas barato.
-- Estos indices no arreglan un problema de rendimiento de HOY: se ponen para
-- que las proximas consultas de los catalogos (que si leen por especie_id y no
-- por el pkey `clave`) no dependan de que las tablas siganWashington tan
-- chicas. `gf_arboles.edad_n` es la que si va a crecer: es la FK que creo la
-- migracion 0041.
--
-- Sin `concurrently` a proposito: el runner envuelve cada migracion en una
-- transaccion, y `create index concurrently` no puede ir dentro de una. Con
-- 786 filas el build es instantaneo y no vale la pena abrir ese frente.

begin;

create index if not exists idx_dim_comunas_macrozona_id
  on dim_comunas (macrozona_id);
create index if not exists idx_dim_comunas_zona_agro_id
  on dim_comunas (zona_agro_id);
create index if not exists idx_dim_comunas_zona_riego_id
  on dim_comunas (zona_riego_id);

create index if not exists idx_fact_fenologia_especie_macrozona
  on fact_fenologia (especie_id, macrozona_id);
create index if not exists idx_fact_fert_programa_especie_macrozona
  on fact_fert_programa (especie_id, macrozona_id);
create index if not exists idx_fact_labores_mes_especie_mes
  on fact_labores_mes (especie_id, mes_n);
create index if not exists idx_fact_riego_mes_especie_mes
  on fact_riego_mes (especie_id, mes_n);
create index if not exists idx_fact_tareas_mes_especie_mes
  on fact_tareas_mes (especie_id, mes_n);
create index if not exists idx_fact_riego_etapa_especie_codigo
  on fact_riego_etapa (especie_id, codigo_etapa);
create index if not exists idx_fact_viabilidad_zona_especie_zona
  on fact_viabilidad_zona (especie_id, zona_agro_id);

create index if not exists idx_gf_arboles_edad_n
  on gf_arboles (edad_n);
create index if not exists idx_gf_aplicaciones_arbol_id
  on gf_aplicaciones (arbol_id);
create index if not exists idx_gf_aplicaciones_territorio_huerto_id
  on gf_aplicaciones (territorio_huerto_id);

commit;