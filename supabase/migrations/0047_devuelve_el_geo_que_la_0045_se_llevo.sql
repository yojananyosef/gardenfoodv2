-- 0047_devuelve_el_geo_de_analytics_que_la_0045_se_llevo_consigo: Arregla
-- produccion
--
-- ESTA MIGRACION DESHACE PARTE DE LA 0045. La 0045 rompio dos cosas en
-- produccion y esta las deja como estaban.
--
-- Que paso
-- --------
--
-- La 0045 dropeo `comuna`, `region` y `zona_agroclimatica` de
-- gf_analytics_events. Antes de dropearlas se verifico que NADA LAS LEIA, y
-- era cierto: ningun RPC, ninguna vista. Y tambien era cierto que no eran
-- copias del perfil sino el 'donde' que reportaba el cliente.
--
-- Lo que NO se verifico fue quien las ESCRIBIA. Y las escribian:
--
--   app/api/v1/telemetry/route.ts:63-65
--     Las mete en el INSERT de cada batch de eventos. Desde la 0045, cada POST
--     a /api/v1/telemetria responde:
--
--       HTTP 400  PGRST204
--       Could not find the 'comuna' column of 'gf_analytics_events'
--
--     O sea: NO SE ESTAN GUARDANDO EVENTOS. El ultimo evento guardado se quedo
--     congelado en la hora en que se aplico la 0045.
--
--   lib/telemetry/refresh.ts:59
--     Las selecciona, y el cron `refresh-audience-profiles` (0 */6 * * *) la
--     llama cada 6 horas. Fallaba con:
--
--       ERROR: column "region" does not exist
--
--     O sea: los perfiles de audiencia no se refrescan desde la 0045.
--
-- Por que los tests no lo cacharon: la linea 70 de refresh.ts hace
-- `as EventRow[]`, un cast que le dice a TypeScript 'confia en mi'. Y el resto
-- del proyecto consulta con clientes de Supabase SIN tipar, asi que ninguna
-- llamada a .from() estaba chequeada. Los dos cast me escondieron el error
-- hasta que se arreglo `lib/supabase/admin.ts` para usar el tipo Database
-- (scripts/probar_ingesta_telemetria.mjs deja el insert de prueba reproducible).
--
-- Que se devuelve, y por que
-- --------------------------
--
-- Se devuelven las columnas, no se quita el codigo que las escribe. Razon:
--
--   - El codigo en produccion ya las escribe. Devolverlas las arregla sin
--     deploy, y con las columnas en su lugar el endpoint y el cron vuelven a
--     funcionar solos.
--   - Este proyecto tiene una capa de adtech con segmentacion por audiencia. La
--     geolocalizacion de la visita es insumo de eso, y 577 eventos historicos la
--     tienen. Borrarla de verdad seria una decision de producto, no una tarea
--     de higiene de esquema.
--
-- Los 577 valores historicos NO se restauran: quedan en
-- data/analytics_geo_historico.csv. Las columnas vuelven vacias y se llenan
-- solas con los proximos eventos.
--
-- Lo que queda pendiente de decidir
-- ---------------------------------
--
-- Si al final se Wantsn quitar, hay que hacerlo en este orden, que es el
-- inverso del que causes la rotura:
--
--   1. Quitar `comuna`, `region` y `zona_agroclimatica` del INSERT de
--      app/api/v1/telemetry/route.ts, y de paso `resolveIpGeo` y todo
--      lib/telemetry/ipgeo.ts, que existen solo para llenarlas.
--   2. Quitar `region` y `comuna` de lib/telemetry/refresh.ts, y los dos campos
--      de AudienceSignals que ya no lee nadie.
--   3. DESPLEGAR y verificar en produccion.
--   4. Recien ahi dropear las columnas.
--
--
-- Sobre los indices: no se restituye idx_events_geo_advanced, que era
-- (region, comuna, gps_lat, gps_lng). Ninguna consulta filtra por region ni por
-- comuna, asi que el indice no lo usaria nadie. idx_events_gps, que si cubre
-- consultas de GPS, se queda.

begin;

alter table gf_analytics_events add column if not exists comuna text;
alter table gf_analytics_events add column if not exists region text;
alter table gf_analytics_events add column if not exists zona_agroclimatica text;

comment on column gf_analytics_events.comuna is
  'Comuna que el cliente reportaba en el evento. La lleno la 0047: la 0045 la '
  'dropeo creyendo que nadie la escribia, y la escritura es justo lo que la '
  'hacia existir. No leer de esta tabla: derivar de perfiles, que es lo correcto.';

comment on column gf_analytics_events.region is
  'Region que el cliente reportaba en el evento. Ver la nota de comuna.';

comment on column gf_analytics_events.zona_agroclimatica is
  'Zona agroclimatica declarada por el cliente. Siempre fue NULL: la informo '
  'nunca la lleno. Se devuelve por compatibilidad con el insert del endpoint.';

commit;