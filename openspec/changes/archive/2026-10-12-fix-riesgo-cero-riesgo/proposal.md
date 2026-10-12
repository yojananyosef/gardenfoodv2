# Proposal

## Why

Tres defectos verificados contra producción que ya están vivos hoy y que ninguno depende del Excel nuevo ni de la normalización agronómica. Son correcciones de datos y de permisos, no de lógica de negocio, y cada una es reversible por separado.

- **B1 — la descripción técnica del suelo no existe.** El seed de `0032` copió `nombre` en `tecnico` para las cuatro clases de suelo. `components/perfil/SueloForm.tsx:98` esconde la línea cuando `tecnico === nombre`, así que la app **oculta el síntoma** en vez de mostrarlo: el usuario nunca ve la descripción USDA que es justo lo que le sirve para elegir suelo. La migración `0033_riego_tecnico.sql` que lo corrige está commiteada desde el 24-09 y **nunca se aplicó**.
- **B2 — tres RPCs de admin son ejecutables por `anon`.** Las migraciones `0022`/`0023`/`0024` hicieron `revoke execute ... from anon`, que es un no-op: en Postgres `EXECUTE` viene del grant implícito a `PUBLIC`. Las specs de `admin/metrics` y `admin/insights` ya exigen `EXECUTE` revocado a `anon`; la base no lo cumple.
- **B3 — RLS de `gf_aplicaciones` no valida la pertenencia del árbol.** La política solo comprueba `auth.uid() = user_id`, así que un usuario puede escribir un `arbol_id` de otro usuario. Hoy hay **0 filas** explotadas (la tabla tiene 3), pero el agujero está abierto.

El plan de normalización es grande y bloqueado en parte por el Excel. Estas tres se pueden cerrar hoy, sin esperar nada, y son la base sobre la que se apoya el resto.

## What Changes

- **Se aplica `0033_riego_tecnico.sql`**, que corrige los 4 valores de `gf_riego_suelos.tecnico` y crea `vw_riego_suelos_consistencia` como guarda permanente: si alguien regenera el seed y vuelve a duplicar el nombre, la vista lo expone en vez de dejarlo silencioso.
- **Se revoca `EXECUTE` sobre `PUBLIC`** en `admin_overview_metrics()`, `admin_insights_metrics()` y `admin_media_kit()`. No se toca `is_admin()` porque las políticas RLS dependen de ella, ni `set_updated_at()` porque es trigger function.
- **Se endurece la política de `gf_aplicaciones`** para que valide, además de `user_id`, que `arbol_id` (si no es null) apunte a un árbol del propio usuario y que `territorio_huerto_id` (si no es null) apunte a un huerto propio.
- **No se toca** `components/perfil/SueloForm.tsx:98`. El parche que oculta `tecnico === nombre` es inofensivo y sirve de comprobación visual de que el fix funcionó; borrarlo es un change aparte.

**No hay cambios de comportamiento observable para el usuario salvo la corrección**: los tres fixes endurecen o restauran comportamiento que ya se esperaba. Un usuario no debería notar nada, y ese es el criterio de aceptación.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `admin/metrics`: el requirement actual ya dice que `admin_overview_metrics()` tiene `EXECUTE` revocado a `anon`. La base no lo cumple porque el revoke fue a `anon` en vez de a `PUBLIC`. Se amplía el requirement para que la revocación sea explícita sobre `PUBLIC`, que es donde está el grant implícito, y para que quede cubierto el caso de `admin_media_kit()`.
- `admin/insights`: mismo defecto en `admin_insights_metrics()`; se alinea el requirement con la forma correcta del revoke.
- `garden/huerto`: se añade el requisito de que las políticas RLS de las tablas del huerto validen la pertenencia de las referencias (árbol y territorio), no solo `user_id`. Hoy solo `gf_arboles` tiene aislamiento por usuario documentado y `gf_aplicaciones` no lo tiene.
- `garden/agronomy-data`: se añade el requisito de que la descripción técnica de cada clase de suelo sea un dato propio y distinto del nombre, con una guarda que detecte la regresión. Hoy la app la oculta en vez de corregirla.

## Impact

- **Migraciones**: `supabase/migrations/0033_riego_tecnico.sql` se aplica (no se edita; ya está commiteada y es correcta). Se crean `0034_revoke_admin_rpc_public.sql` y `0035_rls_aplicaciones_referencia.sql`.
- **Canal de aplicación**: MCP `apply_migration`. **Nunca `supabase db push`** — las versiones remotas llevan timestamp (`20260924201633`) y los filenames del repo son `NNNN_`, así que push reintentaría 27 migraciones ya aplicadas.
- **Datos de usuario**: ninguno. Los 4 `UPDATE` de `0033` tocan solo la tabla de referencia de suelos. Los dos changes siguientes son de permisos, no de filas.
- **Rollback**: cada uno es independiente. `0033` se revierte copiando `nombre` en `tecnico`. `0034` con `grant execute ... to public`. `0035` recreando la política anterior.
- **Sin cambios de API ni de cliente**. La app sigue leyendo lo mismo; un `is_admin()` falso se comporta igual después del revoke, solo que ahora falla antes.
- **Riesgo**: bajo, pero `0035` toca una política activa. La tabla tiene 3 filas, así que una política demasiado restrictiva rompería escrituras de usuarios reales. Se verifica con una escritura de prueba de un usuario legítimo antes de dar por buena la migración.