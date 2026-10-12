-- 0043_borrar_edad_clane_ya: cierra el ciclo de la 0041 y la 0042
--
-- La 0041 agrego `gf_arboles.edad_n` y tiro `edad_clase` en la misma
-- transaccion. Tirarla ahi fue el error: produccion corria el codigo viejo, que
-- hace `select ..., edad_clase, ...` en lib/huerto/data.ts, asi que el query
-- fallo y /huerto paso de 28 arboles a 0. La 0042 devolvio la columna.
--
-- Esta 0043 la borra de verdad, ya con el codigo nuevo desplegado:
--
--   - `grep` sobre lib/, app/, components/ y hooks/ no devuelve una sola
--     mencion de edad_clase fuera de comentarios.
--   - el despliegue gardenfoodv2-mro5jpz33 ya esta sirviendo ese codigo.
--   - /huerto verificado en produccion con 28 arboles antes de aplicar esto.
--
-- Que la columna este vacia lo hace inocuo: los 150 arboles tienen NULL en
-- edad_n y en la que se va a tirar.
--
-- Si esto se rompe a alguien, la salida es la 0042: volver a agregar la columna.

begin;

alter table gf_arboles drop column if exists edad_clase;

commit;