-- 0045_geo_de_analytics_por_donde_reportado: Fase 10.1 del plan
--
-- BORRA `comuna`, `region` y `zona_agroclimatica` de `gf_analytics_events`.
--
-- El plan pedia algo mas elaborado y en los dos supuestos estaba equivocado. Se
-- comprobo antes de escribir esto (scripts/checar_geo_de_analytics.mjs):
--
--   "las leen admin_overview_metrics y admin_insights_metrics"   FALSO
--
--     Ninguna de las dos lee esas columnas. Sus unicos usos de
--     gf_analytics_events son `count(distinct user_id)` y `count(*)` sobre
--     ventanas de tiempo. El `top_comunas` de admin_overview_metrics sale de
--     `gf_cultivos join perfiles`, o sea de p.comuna, no de la tabla de
--     eventos. Ninguna vista las lee tampoco.
--
--   "son copias de perfiles y se derivan por join"               FALSO
--
--     No son copias. Guardan el 'donde' que el cliente reportaba en el momento
--     del evento, segun lib/telemetry/geo.ts (`region: geo.region ?? null`).
--     De los 1647 eventos:
--
--       577 tienen comuna y region
--         6 son de eventos ANONIMOS, que no se pueden derivar de nadie
--       304 de las 571 restantes tienen una comuna DISTINTA de la que el perfil
--             tiene hoy (ej: el mismo usuario con comuna 'Santiago' en el evento
--             y 'Maipu' en el perfil)
--         0 tienen zona_agroclimatica: la columna esta completamente vacia
--
--     O sea que agregar el join que pedia el plan no habria sido superfluous:
--     habria REESCRITO la historia, cambianto el 'donde se vio esto' por 'donde
--     vive esta persona hoy'.
--
-- Por eso la migracion es solo un drop, sin tocar ninguna funcion. El plan
-- tambien decia "cardinalidad bajisima (8 y 4 valores) en la tabla de mayor
-- volumen" como argumento a favor, cuando esa bajisima cardinalidad es
-- justamente la prueba de que no son datos por evento.
--
-- Lo que se pierde, y no es recuperable por join:
--
--   6 eventos anonimos con comuna
--   304 point-in-time que el perfil actual no reproduce
--
-- Volcados a data/analytics_geo_historico.csv. Y nada los leia, asi que no hay
-- ninguna pantalla que cambie.

begin;

-- El indice idx_events_geo_advanced empieza por (region, comuna, gps_lat,
-- gps_lng). Postgres lo tira solo al quitar las columnas, pero se declara el
-- antes para que la intencion se lea. Se rehace sobre las columnas de GPS, que
-- si sobreviven y que el indice tambien cubria.
drop index if exists idx_events_geo_advanced;

alter table gf_analytics_events drop column if exists comuna;
alter table gf_analytics_events drop column if exists region;
alter table gf_analytics_events drop column if exists zona_agroclimatica;

create index if not exists idx_events_gps
  on gf_analytics_events using btree (gps_lat, gps_lng);

commit;