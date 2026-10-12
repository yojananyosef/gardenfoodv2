-- 0035_rls_aplicaciones_referencia: cierra el agujero cross-tenant de gf_aplicaciones
--
-- La politica vigente (0028_modo_huerto_aplicaciones.sql) solo valida
--   using     (auth.uid() = user_id)
--   with_check(auth.uid() = user_id)
-- Eso valida la titularidad de la fila, pero no la pertenencia de las
-- referencias: un usuario puede escribir un arbol_id o un territorio_huerto_id
-- que apunta a datos de otro usuario. Verificado antes del fix:
--   0 filas explotadas (la tabla tiene 3), pero el agujero estaba abierto.
--
-- Se valida con EXISTS y no con una FK a proposito: una FK garantiza que el
-- arbol exista, pero NO que sea del usuario. El requisito es de pertenencia,
-- no de integridad referencial, asi que la politica RLS es el lugar correcto.
-- Las FKs entre tablas de dominio llegan mas adelante, con la importacion del
-- Excel.
--
-- EXISTS va en USING y en WITH CHECK. Sin WITH CHECK, un UPDATE sobre una fila
-- propia podria reasignar arbol_id al arbol de otro, porque USING solo se
-- evalua sobre el estado anterior de la fila.
--
-- El `or <columna> is null` va primero a proposito: ambas columnas son
-- nullable y una aplicacion sin referencia debe seguir entrando igual.
--
-- Rollback: recrear la politica de 0028.
--   create policy gf_aplicaciones_user_all on gf_aplicaciones for all
--     using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists gf_aplicaciones_user_all on public.gf_aplicaciones;

create policy gf_aplicaciones_own on public.gf_aplicaciones
  for all
  using (
    auth.uid() = user_id
    and (arbol_id is null or exists (
      select 1 from public.gf_arboles t
      where t.id = arbol_id and t.user_id = auth.uid()
    ))
    and (territorio_huerto_id is null or exists (
      select 1 from public.gf_huertos h
      where h.id = territorio_huerto_id and h.user_id = auth.uid()
    ))
  )
  with check (
    auth.uid() = user_id
    and (arbol_id is null or exists (
      select 1 from public.gf_arboles t
      where t.id = arbol_id and t.user_id = auth.uid()
    ))
    and (territorio_huerto_id is null or exists (
      select 1 from public.gf_huertos h
      where h.id = territorio_huerto_id and h.user_id = auth.uid()
    ))
  );