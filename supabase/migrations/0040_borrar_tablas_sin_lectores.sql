-- 0040_borrar_tablas_sin_lectores: Fase 10.3 del plan
--
-- Borra 4 tablas sin lectores y 1 vista de compatibilidad sin lectores.
-- Se verifico antes de borrar, no despues (scripts/checar_tablas_muertas.mjs).
--
-- OJO CON EL TIPO DE CADA UNA. Esto no es homogeno, y el primer intento de esta
-- migracion fallo con `"gf_riego_kc" is not a table` porque uso `drop table`
-- para las cinco:
--
--   gf_riego_kc                       VISTA   8 filas
--   gf_fertilizacion_cosecha_tipica    tabla   0 filas
--   gf_fertilizacion_fenologia         tabla   0 filas
--   gf_fertilizacion_fertilizantes     tabla   0 filas
--   gf_fertilizacion_programa          tabla   0 filas
--
-- `gf_riego_kc` paso a ser vista en la migracion 0039, que dejo las 8
-- gf_riego_* como vistas de compatibilidad sobre las dim_*/fact_* nuevas. Las
-- otras 7 NO se tocan aqui: la app las lee (lib/riego/actions.ts consulta
-- gf_riego_suelos, gf_riego_zonas, gf_riego_edad y gf_riego_humedad).
--
-- Comprobado, en este orden y con estos resultados:
--
--   1. Lectores en el codigo ....... ninguno. Un grep sobre app/, lib/,
--      components/, hooks/, tests/ y scripts/ no encuentra ni una mencion de
--      las 5. Las 4 de fertilizacion estan vacias: nunca se escribio nada.
--   2. Vistas que las mencionan ..... ninguna
--   3. Funciones que las mencionan ... ninguna
--   4. FKs que apuntan a ellas ...... ninguna
--   5. Triggers sobre ellas ......... ninguno
--
-- Que las 8 filas de gf_riego_kc sobrevivan en otro lado, que es lo que
-- importa, esta comprobado en scripts/comparar_kc_con_dim_etapas.mjs:
-- dim_etapas tiene las 8 etapas con el MISMO Kc y la MISMA descripcion.
--
-- La vista hacia esto:
--
--   select codigo_etapa as codigo, lo_que_ve as descripcion,
--          (nullif(kc_referencial, '—'::text))::numeric as kc
--     from dim_etapas t;
--
-- El `nullif` es la razon de una confusion al verificar: para la etapa CAL,
-- gf_riego_kc.kc sale NULL y dim_etapas.kc_referencial es el texto `—`. No son
-- datos distintos, es la misma ausencia escrita de dos maneras: la vista
-- convierte el guion a NULL porque su columna es numeric, y dim_etapas lo
-- conserva porque la suya es text. Quien compare las dos con `=` a seco ve 8
-- diferencias en vez de 0.
--
-- El volcado previo quedo en data/gf_riego_kc_historico.csv, por si algun dia
-- aparece un lector.
--
-- Las 4 gf_fertilizacion_* son el seed del xlsx de fertilizacion casera que
-- nunca llego a leerse: su contenido vive hoy en fact_fert_programa,
-- fact_fert_organica, fact_ficha_fertilizacion y fact_manejo_estacion.

begin;

drop view  if exists gf_riego_kc;
drop table if exists gf_fertilizacion_cosecha_tipica;
drop table if exists gf_fertilizacion_fenologia;
drop table if exists gf_fertilizacion_fertilizantes;
drop table if exists gf_fertilizacion_programa;

commit;