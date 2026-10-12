-- 0044_enums_de_telemetria_y_patrocinios: Fase 10.2 del plan
--
-- Convierte en enum cuatro columnas que hoy son `text` sin ninguna restriccion.
-- Un enum no es solo un tipo mas lindo: es la unica forma de que la base le
-- diga al codigo "este valor no existe", en vez de que el error aparezca dos
-- meses despues como un total que no cuadra.
--
-- Los tres valores que quedan fuera del enum a proposito:
--
--   gf_subscription_plans.tier   se rehace con Flow, y los tiers estan mal
--                                 (no coinciden con perfiles.plan)
--   perfiles.plan                idem
--   los demas text de pagos      se van con la reescritura de Flow
--
-- ANTES DE APLICAR: scripts/checar_dominios_enum.mjs conto los valores reales.
-- Salieron 6 filas de gf_analytics_events.event_name fuera del dominio del plan,
-- todas del 16 y 17 de agosto de 2026, los dos primeros dias de telemetria, con
-- los nombres de la taxonomia v0, que fue estandarizada al dia siguiente.
--
-- No se amplia el enum para que el cast pase: eso lo volveria decoracion, que
-- es justo lo que se quiere evitar. Las 6 filas se traducen a su equivalente
-- actual, que es lo que la taxonomia v1 queria decir:
--
--   ad_impression  (2, AD_INTERACTION)  -> AD_IMPRESSION
--   especie_view   (3, PRODUCT_USAGE)    -> VIEW_FICHA
--   crop_search    (1, COMMERCE_INTENT,  payload {"query": "tomate cherry"})
--                                     -> SEARCH_INP
--
-- Los dos primeros son obvios por la categoria. El tercero es una inferencia:
-- era una busqueda de cultivo con su texto en el payload, y SEARCH_INP es el
-- unico evento de busqueda del dominio. Si alguien prefiere que esas filas
-- cuenten como otro evento, el UPDATE esta aislado y se puede cambiar.
--
-- Despues del update, los 6 valores que quedan estan todos dentro del dominio,
-- asi que el cast no falla. Los valores del dominio que no aparecen todavia
-- (CMP_CONSENT, AD_CLICK, SEARCH_INP...) se dejan: el enum describe el
-- dominio, no solo lo que se ha visto.

begin;

-- 1) Los tipos.
create type public.telem_event_category as enum (
  'PRODUCT_USAGE', 'AD_INTERACTION', 'CMP_CONSENT', 'COMMERCE_INTENT'
);
create type public.telem_event_name as enum (
  'VIEW_FICHA', 'PAGE_VIEW', 'CALCULATOR_SUBMIT', 'AD_IMPRESSION', 'AD_CLICK',
  'SEARCH_INP', 'CMP_CONSENT_GRANTED', 'CMP_CONSENT_UPDATED', 'INPUT_QUOTE'
);
create type public.sponsorship_screen as enum (
  'explorar', 'huerto', 'ficha', 'calendario'
);
create type public.sponsorship_payment_status as enum (
  'unpaid', 'pending', 'paid', 'failed'
);

-- 2) La traduccion de los nombres v0.
update gf_analytics_events set event_name = 'AD_IMPRESSION' where event_name = 'ad_impression';
update gf_analytics_events set event_name = 'VIEW_FICHA'      where event_name = 'especie_view';
update gf_analytics_events set event_name = 'SEARCH_INP'      where event_name = 'crop_search';

-- 3) La politica RLS. Postgres no deja cambiar el tipo de una columna usada en
--    una politica (`cannot alter type of a column used in a policy definition`),
--    y aunque dejara, la politica compara contra 'paid'::text, que ya no
--    empataria con un enum. Se quita, se castea, y se repone con el cast
--    correcto. El texto de la politica sale de
--    scripts/listar_politicas_rls.mjs, no de memoria.
--
--    Las otras 3 politicas de estas dos tablas no mencionan ninguna de las
--    columnas que se castean, asi que no se tocan.
--    El nombre NO lleva el prefijo de la tabla. El primer intento de esta
--    migracion lo escribio como 'gf_sponsorships.Public read paid active
--    sponsorships' y el `drop policy if exists` no hizo nada, porque ese nombre
--    no existe: el real es 'Public read paid active sponsorships'. Como el drop
--    es `if exists`, fallo en silencio y el alter siguio viendo la dependencia.
drop policy if exists "Public read paid active sponsorships" on gf_sponsorships;

-- 4) Los casts. Se usa `::` explicito porque text -> enum no es una conversion
--    implicita.
--
--    `gf_sponsorships.payment_status` tiene DEFAULT 'unpaid'::text, y Postgres
--    no lo castea solo: el primer intento de esta migracion fallo con
--    `default for column "payment_status" cannot be cast automatically`. Por eso
--    el default se saca antes del alter y se vuelve a poner despues, ya como
--    literal del enum. Al reves el default quedaria apuntando a un texto que la
--    columna ya no tiene.
alter table gf_sponsorships alter column payment_status drop default;

alter table gf_analytics_events
  alter column event_category type public.telem_event_category
    using (event_category::public.telem_event_category);
alter table gf_analytics_events
  alter column event_name type public.telem_event_name
    using (event_name::public.telem_event_name);
alter table gf_sponsorships
  alter column screen type public.sponsorship_screen
    using (screen::public.sponsorship_screen);
alter table gf_sponsorships
  alter column payment_status type public.sponsorship_payment_status
    using (payment_status::public.sponsorship_payment_status);

alter table gf_sponsorships
  alter column payment_status set default 'unpaid'::public.sponsorship_payment_status;

-- 5) La politica otra vez, ahora contra el enum.
create policy "Public read paid active sponsorships"
  on gf_sponsorships
  for select
  to public
  using ((payment_status = 'paid'::public.sponsorship_payment_status) and (active = true));

commit;