-- 0034_revoke_admin_rpc_public: cierra la superficie de las RPCs de admin
--
-- Las migraciones 0022/0023/0024 hicieron `revoke execute ... from anon`,
-- que es un no-op: en Postgres `EXECUTE` sobre funciones del schema public
-- viene del grant implicito a `PUBLIC`, y `anon` y `authenticated` heredan
-- de `PUBLIC`. Verificado en produccion antes de este fix:
--   has_function_privilege('anon',        oid, 'execute') -> true
--   has_function_privilege('authenticated', oid, 'execute') -> true
--
-- Las tres funciones son SECURITY DEFINER, asi que se ejecutan con
-- privilegios del creador (postgres). Hoy el unico escudo es el guard
-- `is_admin()` dentro del cuerpo. Revocar a PUBLIC pone la barrera en la
-- capa de permisos, antes de la ejecucion, y deja el guard como segunda red.
--
-- Se revoca a los tres roles a proposito, siguiendo el patron de 0019.
-- Revocar solo a anon dejaria la funcion ejecutable por cualquier usuario
-- logueado, que es una superficie mayor que la anonima.
--
-- NO tocar `is_admin()` ni `set_updated_at()`: la primera la usan las
-- politicas RLS y la segunda es trigger function.
--
-- El propietario (postgres) conserva EXECUTE, asi que el panel de admin
-- sigue funcionando para un administrador autenticado.
--
-- Rollback: grant execute on function ... to public;

revoke execute on function public.admin_overview_metrics()
  from public, anon, authenticated;

revoke execute on function public.admin_insights_metrics()
  from public, anon, authenticated;

revoke execute on function public.admin_media_kit()
  from public, anon, authenticated;