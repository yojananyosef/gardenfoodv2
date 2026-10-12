-- 0036_grant_admin_rpc_authenticated: corrige la regresion de 0034
--
-- 0034 revoco EXECUTE a `public, anon, authenticated` en las 3 RPCs de admin.
-- Eso rompio el panel: `lib/admin/metrics.ts`, `lib/admin/insights.ts` y
-- `lib/admin/mediakit.ts` llaman las funciones con `createClient()` de
-- `lib/supabase/server`, que usa la sesion del usuario, es decir el rol
-- `authenticated`. Sin EXECUTE para ese rol, `getOverview()` caia en su catch
-- y devolvia el objeto vacio: el panel renderizaba Total usuarios 0, Activos
-- 30d 0 y funnel todo en cero, sin error visible para el usuario (el
-- console.error es server-side).
--
-- ACL final de las 3 funciones:
--   anon = false          <- el objetivo de 0034, se mantiene
--   authenticated = true  <- necesario para que el panel funcione
--   postgres = true       <- propietario
--
-- El guard `is_admin()` dentro del cuerpo sigue siendo la segunda red: un
-- `authenticated` que no sea admin recibe "No autorizado: solo administradores".
--
-- Nota de por que 0034 fallo y no se detecto por SQL: en una llamada SQL
-- interna el rol efectivo es el propietario, asi que `has_function_privilege`
-- en false parecia "solo el owner puede". Por la Data API el rol efectivo es el
-- del JWT, no el propietario. Un false en `has_function_privilege` puede
-- significar "solo el owner" o "nadie por HTTP": hay que probar el camino real.
--
-- Rollback: revoke execute on function ... from authenticated;

grant execute on function public.admin_overview_metrics() to authenticated;
grant execute on function public.admin_insights_metrics() to authenticated;
grant execute on function public.admin_media_kit() to authenticated;