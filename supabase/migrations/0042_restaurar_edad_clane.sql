-- 0042_restaurar_edad_clane: rollback parcial de la 0041, paso 3
--
-- LA 0041 TIENE UN DEFECTO DE ORDEN Y ESTE ARCHIVO LO DESARREGLA.
--
-- La 0041 hizo tres cosas en una transaccion: agregar `edad_n`, rellenarla y
-- tirar `edad_clase`. Las dos primeras son aditivas. La tercera es
-- destructiva, y el error fue tirarla cuando produccion todavia corre el codigo
-- viejo, que hace:
--
--   lib/huerto/data.ts:99  select "... created_at, edad_clase, copa_m, ..."
--
-- Con la columna ausente, PostgREST devuelve error, `getArboles` vuelve vacio y
-- /huerto muestra 0 arboles. Pasaron de 28 a 0.
--
-- El orden correcto era: desplegar el codigo que lee `edad_n`, verificar, y solo
-- entonces tirar `edad_clase`. Ojo con esto, porque es el mismo error que la
-- tarea 10.1advertia explicitly para los RPC de admin: un cambio de esquema que
-- rompe codigo en produccion no se parte en dos migraciones, se hace junto.
--
-- Este archivo devuelve la columna para que produccion vuelva a funcionar.
-- No la vuelve a llenar: quedo vacia antes de la 0041 y asi sigue.
--
-- Cuando el codigo nuevo este desplegado y verificado, esta columna se puede
-- borrar de nuevo. Queda anotado en el tasks del change.

begin;

alter table gf_arboles add column if not exists edad_clase text;

commit;