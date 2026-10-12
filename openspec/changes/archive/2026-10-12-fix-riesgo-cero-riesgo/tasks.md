# Tasks

## 1. Aplicar 0033 (descripción técnica del suelo)

- [x] 1.1 Confirmar el estado previo con `select clave, nombre, tecnico from gf_riego_suelos order by clave` y `select to_regclass('public.vw_riego_suelos_consistencia')`. Verificar que las 4 filas tienen `tecnico = nombre` y que la vista devuelve `null`. Si ya estuviera aplicada, parar y reportar en lugar de seguir.
- [x] 1.2 Revisar que el contenido de `supabase/migrations/0033_riego_tecnico.sql` sigue intacto (4 `UPDATE` + la vista) antes de aplicarla. No editar el archivo.
- [x] 1.3 Aplicar vía MCP `apply_migration` con nombre `0033_riego_tecnico` y el contenido literal del archivo.
- [x] 1.4 Verificar: `select clave, tecnico from gf_riego_suelos order by clave` devuelve los 4 valores USDA esperados, y `select * from vw_riego_suelos_consistencia` devuelve **0 filas**.
- [x] 1.5 Comprobar que los valores coinciden con `TIPOS_SUELO` de `lib/riego/datos.ts` y con `DIM_SUELOS.nombres_usda` del Excel v3, en particular la fila `F`, que es la que tiene dos variantes en circulate. Verificar que la base y el fallback del componente dicen lo mismo, porque si divergen la tarjeta de `/perfil` muestra un texto en la base y otro en el fallback.
- [x] 1.6 **Cerrada por el deploy.** Forzar la invalidación de la cache: `lib/riego/actions.ts:111,157,175,224` usa `unstable_cache` con `revalidate: 604800` y tag `riego-base`, y `lib/riego/client-cache.ts:19` confirma que un deploy nuevo limpia la memoria. Cerrada: el texto corregido de la fila `F` se ve en `/perfil` en producción (verificado en 4.2), o sea que la cache quedó invalidada.

## 2. Revocar las 3 RPCs de admin a PUBLIC

- [x] 2.1 Confirmar el estado previo: `select proname, has_function_privilege('anon', oid, 'execute') from pg_proc ... where proname like 'admin_%'`. Verificar `true` en las 3.
- [x] 2.2 Crear `supabase/migrations/0034_revoke_admin_rpc_public.sql` con el `revoke execute on function ... from public` de `admin_overview_metrics()`, `admin_insights_metrics()` y `admin_media_kit()`. No tocar `is_admin()` ni `set_updated_at()`. Incluir en el encabezado la nota de rollback (`grant execute ... to public`).
- [x] 2.3 Verificar que la sintaxis de la migración es válida antes de aplicar, y confirmar que ninguna otra función o trigger del schema `public` depende de estas tres RPCs.
- [x] 2.4 Aplicar vía MCP `apply_migration` con nombre `0034_revoke_admin_rpc_public`.
- [x] 2.5 Verificar: `has_function_privilege` devuelve `false` para `anon` **y** para `authenticated` en las 3 funciones. Si alguna sigue en `true`, no seguir.
- [x] 2.6 Verificar que un admin real sigue viendo el panel: cargar `/admin` autenticado y comprobar que las tarjetas de overview y de insights cargan.

> ⚠️ **REGRESIÓN ENCONTRADA Y CORREGIDA con esta verificación.** El revoke de 0034 a `public, anon, authenticated` **rompió el panel de admin**: `lib/admin/metrics.ts:70`, `lib/admin/insights.ts:78` y `lib/admin/mediakit.ts:47` llaman las RPCs con `createClient()` de `lib/supabase/server`, que usa la sesión del usuario, es decir el rol `authenticated`. Al revocarle EXECUTE, `getOverview()` caía en su `catch` y devolvía el objeto vacío: el panel renderizaba **Total usuarios 0, Activos 30d 0, funnel todo en 0**, sin error visible porque el `console.error` es server-side.
>
> **Corrección:** migración `0036_grant_admin_rpc_authenticated`, que hace `grant execute ... to authenticated` en las 3 funciones. ACL final: `anon=false`, `authenticated=true`. El bloqueo a `anon` se mantiene (era el objetivo del fix) y el guard `is_admin()` sigue siendo la segunda red para un `authenticated` que no sea admin.
>
> **Lección para el design:** D1 asumía que el propietario (postgres) conservaba el acceso porque así funciona una llamada SQL interna. Por la Data API el rol efectivo es el del JWT, no el propietario. El risk R2 estaba identificado pero su mitigación asumía un mecanismo equivocado. Un `has_function_privilege` en `false` no significa «solo el owner puede»: también puede significar «nadie por HTTP puede».

Verificado con sesión admin real (`johangutierrez@outlook.cl`) en producción: `/admin` muestra Total usuarios **6**, Activos 30d **3**, Gratuitos **2** (33%), funnel trialing **7** / canceled **6**; `/admin/insights` carga visitas 30d **59**; `/admin/media-kit` responde con el estado de k-anonymity. Las 3 secciones usan las RPCs revocadas.

## 3. Cerrar el RLS de gf_aplicaciones

- [x] 3.1 Confirmar el estado previo: consultar `pg_policies` para `gf_aplicaciones` y comprobar que la política actual solo mira `auth.uid() = user_id`, y que `select count(*) from gf_aplicaciones a join gf_arboles t on t.id = a.arbol_id where t.user_id is distinct from a.user_id` devuelve 0.
- [x] 3.2 Crear `supabase/migrations/0035_rls_aplicaciones_referencia.sql`: `drop policy if exists gf_aplicaciones_user_all` y la política `gf_aplicaciones_own` con `EXISTS` sobre `gf_arboles` y `gf_huertos` en **ambos** `USING` y `WITH CHECK`. Mantener el `or <columna> is null` para no romper aplicaciones sin referencia. Nota de rollback en el encabezado.
- [x] 3.3 Aplicar vía MCP `apply_migration` con nombre `0035_rls_aplicaciones_referencia`.
- [x] 3.4 Verificar con escritura real: con un usuario legítimo, insertar una aplicación con `arbol_id` de un árbol propio y confirmar que se acepta. Este es el paso que detecta una política demasiado restrictiva, y `gf_aplicaciones` tiene filas de usuarios reales.

> **Nota de método (importante para repetir la prueba):** el MCP de Supabase corre como `postgres` con `bypassrls = true`, así que un `INSERT` normal **nunca** es bloqueado por RLS y cualquier prueba de escritura da un falso "ACEPTADA". Hay que forzar el rol en la misma sentencia:
> ```sql
> select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', false);
> set role authenticated;
> insert into public.gf_aplicaciones (...);
> ```
> Además, un `INSERT ... SELECT ... FROM gf_arboles` devuelve 0 filas bajo RLS (el árbol ajeno es invisible), así que el `INSERT` no ocurre y la prueba pasa sin probar nada. Hay que usar **valores literales** en el `INSERT`, no un `SELECT` sobre la tabla referenciada. Y `momento` y `producto` son NOT NULL; omitirlos produce un error de constraint que se confunde con un rechazo de RLS.
>
> Resultado con el método correcto (usuario `11a94708…`): P1 árbol propio ACEPTADA, P2 sin referencias ACEPTADA, P3 árbol ajeno RECHAZADA, P4 huerto ajeno RECHAZADA, P5 UPDATE a árbol ajeno RECHAZADO por `WITH CHECK`. `gf_aplicaciones` volvió a 3 filas, la tabla auxiliar `_audit_pruebas_rls` se dropeó.
- [x] 3.5 Verificar los rechazos: intentar insertar con `arbol_id` de un árbol ajeno y con `territorio_huerto_id` de un huerto ajeno, y confirmar que ambos son rechazados. Intentar también un `UPDATE` que reasigne `arbol_id` a un árbol ajeno y confirmar que `WITH CHECK` lo detiene.
- [x] 3.6 Limpiar los datos de prueba creados en 3.4 y 3.5, o confirmar que las pruebas fallidas no dejaron filas.

## 4. Verificación de conjunto

- [x] 4.1 Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` y confirmar que el repo sigue en verde, aunque este change no toca TypeScript.

> Nota: el primer `typecheck` falló con `Cannot find name 'PageProps'/'LayoutProps'` en `app/layout.tsx:91` y `app/(auth)/auth/confirm/error/page.tsx:10`. **No lo causó este change** (no se tocó ningún `.tsx`). La causa es que `next-env.d.ts` está en `.gitignore:44` y no existía en esta máquina, y en Next 16 es ese archivo el que genera los tipos `PageProps`/`LayoutProps` de las rutas. Se resolvió con `npx next typegen`. Final: typecheck 0 errores, eslint 0 errores, vitest 300/300, build con las 38 rutas compilando.
- [x] 4.2 Confirmar en `/perfil` que la tarjeta de suelo muestra un texto técnico **distinto** del nombre, y que ya no se oculta la línea.

> Verificado en producción con sesión real: la tarjeta muestra `Fina (arcillosa)` → «Arcilla, franco arcilloso, franco arcilloso limoso» y `Gruesa (arenosa)` → «Arena, arena francosa, arena fina». Nombres y técnicas son textos distintos y la línea ya no se oculta. El texto corregido es visible en la app desplegada, así que la cache `riego-base` quedó invalidada con el deploy; la 1.6 queda cerrada por esta vía.
- [x] 4.3 Confirmar que un usuario no admin no puede leer las RPCs de admin desde la Data API con la anon key, esperando 401/403.

> Verificado con `POST /rest/v1/rpc/<fn>` y la anon key de `.env.local`: `admin_overview_metrics`, `admin_insights_metrics` y `admin_media_kit` devuelven **HTTP 401** las tres. Antes del fix eran ejecutables (`has_function_privilege('anon', ...) = true`).
- [x] 4.4 Actualizar `PENDING.md` con el cierre de B1, B2 y B3, y dejar constancia de que la fila `F` de `gf_riego_suelos.tecnico` es `franco arcilloso limoso` (no `arenoso`), para que la próxima verificación no vuelva a tropezar con la ambigüedad.
- [x] 4.5 Anotar en `PENDING.md` que el parche de `components/perfil/SueloForm.tsx:98` sigue ahí a propósito, y que se puede borrar cuando se confirme el fix en la UI.

## Workflow follow-up

- Archivar el change cuando el panel admin y la tarjeta de suelo estén verificados en la app desplegada.
- Tras archivar, `openspec/specs/admin/metrics`, `admin/insights`, `garden/huerto` y `garden/agronomy-data` quedan con los requisitos actualizados.