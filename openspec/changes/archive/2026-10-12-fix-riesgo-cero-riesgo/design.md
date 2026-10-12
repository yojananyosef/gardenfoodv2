# Design

## Context

Tres correcciones de bajo riesgo sobre producción. Verificadas con MCP `execute_sql` antes de escribir este documento:

```
-- B1: confirmado
select clave, nombre, tecnico from gf_riego_suelos order by clave;
  F  | Fina (arcillosa)      | Fina (arcillosa)      ← tecnico = nombre
  G  | Gruesa (arenosa)      | Gruesa (arenosa)
  M  | Media (franca)        | Media (franca)
  MG | Moderadamente gruesa  | Moderadamente gruesa
select to_regclass('public.vw_riego_suelos_consistencia');  -- null, la vista no existe

-- B2: confirmado
select proname, has_function_privilege('anon', oid, 'execute') as anon_puede
from pg_proc join pg_namespace ... where proname like 'admin_%';
  admin_insights_metrics   | true
  admin_media_kit          | true
  admin_overview_metrics    | true
  (las tres son SECURITY DEFINER)

-- B3: confirmado
select policyname, cmd, qual, with_check from pg_policies
where tablename = 'gf_aplicaciones';
  gf_aplicaciones_user_all | ALL | (auth.uid() = user_id) | (auth.uid() = user_id)

select count(*) from gf_aplicaciones a join gf_arboles t on t.id = a.arbol_id
where t.user_id is distinct from a.user_id;  -- 0
```

`0033` es la última migración commiteada y la última aplicada: el historial remoto termina en `20260924201633 / 0032_riego_excel`.

Los valores correctos de `tecnico` están en `lib/riego/datos.ts` (`TIPOS_SUELO`) y coinciden con `DIM_SUELOS.nombres_usda` del Excel v3:

| clave | `tecnico` correcto |
|---|---|
| G | Arena, arena francosa, arena fina |
| MG | Franco arenoso, franco arenoso fino |
| M | Franco, franco limoso, franco arenoso arcilloso |
| F | Arcilla, franco arcilloso, franco arcilloso limoso |

## Goals / Non-Goals

**Goals**

- Cerrar los tres defectos con migraciones reversibles e independientes entre sí.
- Dejar cada uno verificado con una consulta que se pueda repetir, no con inspección visual.

**Non-Goals**

- No se arregla el bug de reposo (B4): es un cambio de `lib/riego/calc.ts` y va en su propio change con la red de tests previa.
- No se unifica el plan dephenol (`FichaEspecieView` reimplementa la fórmula, B5): pertenece al change de consolidation del motor.
- No se borra el parche de `components/perfil/SueloForm.tsx:98`. Sigue siendo útil como comprobación de que el fix llegó a la UI.
- No se tocan `admin/media-kit` ni `admin/users` más allá de lo que exige el revoke.

## Decisions

### D1 · Revocar a `PUBLIC`, no a `anon`

**Elegido:** `revoke execute on function ... from public`.

`EXECUTE` sobre funciones nuevas viene por el grant implícito a `PUBLIC` en Postgres. `anon` y `authenticated` heredan de `PUBLIC`, así que `revoke ... from anon` no quita nada: el permiso sigue llegando por la vía heredada. Por eso `has_function_privilege('anon', ...)` devuelve `true` después de esas migraciones.

**Alternativa considerada:** añadir `to anon` en la firma de la función. No sirve: el control de ejecución ocurre antes de que la función reciba la llamada, así que el permiso se evalúa igual contra el rol heredado.

**Por qué importa más de lo que parece:** las tres funciones son `SECURITY DEFINER`, o sea se ejecutan con privilegios del creador (postgres). Hoy el guard `is_admin()` dentro del cuerpo es lo único que impide que `anon` lea agregados de negocio. Revocar a `PUBLIC` pone la barrera **antes** de la ejecución, en la capa de permisos, y deja el guard como segunda red. Un fallo en el guard deja de ser una fuga de datos.

Por eso el spec exige `false` tanto para `anon` como para `authenticated`: revocar solo a `anon` dejaría la función ejecutable por cualquier usuario logueado, que es un superficie de ataque mayor que la anónima.

> **Corrección posterior (0036): este diseño estaba incompleto.** Revocar también a `authenticated` **rompió el panel de admin**, porque `lib/admin/{metrics,insights,mediakit}.ts` llaman las RPCs con `createClient()` de `lib/supabase/server`, que usa la sesión del usuario → rol `authenticated`. El panel pasó a mostrar todos los KPIs en 0. La solución es revocar a `anon` y `PUBLIC` pero **conceder EXECUTE a `authenticated`**, dejando el guard `is_admin()` como control de acceso real.
>
> La lección: en una llamada SQL interna el rol efectivo es el propietario, así que `has_function_privilege = false` parecía significar «solo el owner puede». Por la **Data API el rol efectivo es el del JWT, no el propietario**. Un `false` en `has_function_privilege` es ambiguo entre «solo el owner» y «nadie por HTTP», y solo la prueba del camino real lo desambigua. El spec se actualizó para exigir `false` en `anon` y el guard en `is_admin()`, sin exigir `false` en `authenticated`.

### D2 · `WITH CHECK` además de `USING`

En RLS, `USING` filtra qué filas ve la operación y `WITH CHECK` valida las filas que se van a escribir. Una política `FOR ALL` necesita ambos: sin `WITH CHECK`, un usuario puede **updatear** una fila propia y cambiarle el `arbol_id` por el de otro usuario, porque `USING` solo se evalúa sobre el estado anterior de la fila.

La política actual `gf_aplicaciones_user_all` sí tiene ambos, pero los dos son idénticos y solo miran `user_id`. La nueva mantiene esa estructura y agrega la pertenencia de las referencias.

**Alternativa considerada:** usar una política de solo `USING` y confiar en el código. Descartada: el plan de normalización yazinge que la base valide y no solo el código, y RLS es la segunda red de seguridad que ya usa el resto del proyecto.

### D3 · La existencia se valida con `EXISTS`, no con una FK

La validación usa `exists (select 1 from gf_arboles t where t.id = arbol_id and t.user_id = auth.uid())` en lugar de agregar una FK a `gf_arboles`. Una FK garantiza que el árbol exista, pero **no** que sea del usuario: el `arbol_id` podría apuntar al árbol de otro y la FK lo aceptaría igual. El requisito es de pertenencia, no de integridad referencial, así que la política es el lugar correcto.

Las FKs entre tablas de dominio llegan más adelante, con la importación del Excel (Fase 6/10 del plan).

### D4 · Aplicar `0033` como está, sin editarla

`0033_riego_tecnico.sql` está commiteada desde el 24-09 y es correcta: sus cuatro valores coinciden con `datos.ts` y con el Excel v3. No se modifica, se aplica.

**Nota sobre un falso positivo que casi nos hace cambiar algo:** al contrastar los valores, la fila `F` parecía tener dos valores distintos (`franco arenoso limoso` en la migración vs `franco arcilloso limoso` en el Excel y en `datos.ts`). La lectura inicial de la migración mostraba `arenoso`, pero la comparación byte a byte contra `HEAD` demostró que el archivo commiteado dice `arcilloso` y coincide con el Excel. El valor de la migración era el correcto. Se deja constancia porque el mismo chequeo, mal hecho, iba a introducir un texto que ninguna fuente respalda.

### D5 · Verificar con consultas de privilegio, no con un intento de exploit

El criterio de aceptación de B2 es `has_function_privilege` en `false` para `anon` y `authenticated`, y `true` para un admin real. Intentar leer datos como `anon` para "ver si filtra" es innecesario: el permiso es la propiedad que importa, y comprobarla es exacto y reversible.

## Risks / Trade-offs

**[R1] · La política de `gf_aplicaciones` puede romper escrituras legítimas** → La tabla tiene 3 filas y el predicado solo agrega condiciones sobre columnas nullable (`or ... is null` primero), así que una aplicación sin referencias sigue entrando igual. Antes de dar por buena la migración se hace una escritura de prueba con un usuario legítimo. Si falla, el rollback es recrear la política anterior, que está en `0028_modo_huerto_aplicaciones.sql`.

**[R2] · Revocar a `PUBLIC` rompe el panel si las páginas llaman las RPCs con un rol que no es admin** → Las 6 rutas de `app/api/v1/admin/` validan `isAdmin()` y `authenticated` conserva el acceso por ser el propietario de la función. Se verifica con el panel admin abierto después de aplicar.

**[R3] · `SECURITY DEFINER` + revoke puede romper funciones que llaman a estas RPCs** → Ninguna RPC de admin es usada por triggers ni por otras funciones de base; son consumidas solo desde TypeScript. Verificado antes de aplicar.

**[R4] · La guarda `vw_riego_suelos_consistencia` es una vista, no una constraint** → Si alguien regenera el seed, la vista devuelve filas pero nada falla. Es deliberado: una constraint impediría regenerar el seed, que es una operación legítima. La detección es por consulta, asumida como parte de la verificación de cualquier regeneración.

**[R5] · El historial de migraciones remoto y el local usan convenciones distintas** → El remoto usa timestamps (`20260924201633`) y el local `NNNN_`. Por eso todo va por `apply_migration` y **nunca** por `supabase db push`, que intentaría reaplicar 27 migraciones ya aplicadas. `apply_migration` registra su propia entrada sin comparar contra los archivos del repo.

## Migration Plan

Tres pasos independientes. Cada uno se verifica antes de pasar al siguiente, y cualquiera se puede revertir sin deshacer los otros.

| # | Migración | Qué hace | Rollback |
|---|---|---|---|
| 1 | `0033_riego_tecnico.sql` (ya existe) | 4 `UPDATE` + crea `vw_riego_suelos_consistencia` | `update ... set tecnico = nombre` |
| 2 | `0034_revoke_admin_rpc_public.sql` (nueva) | `revoke execute ... from public` en las 3 RPCs | `grant execute ... to public` |
| 3 | `0035_rls_aplicaciones_referencia.sql` (nueva) | Reemplaza `gf_aplicaciones_user_all` | Recrear la política de `0028` |

Todas van por MCP `apply_migration` contra `ayhpmsocohrorabvrmow`. Ninguna toca filas de usuario salvo los 4 `UPDATE` de la tabla de referencia de suelos.

**Cache:** el paso 1 cambia datos que la app lee por `unstable_cache` con tag `riego-base` y `revalidate: 604800`. La app no verá los valores nuevos hasta 7 días o hasta un `revalidateTag("riego-base", "max")`. Hay que forzar la invalidación en el mismo despliegue; si no, el fix queda aplicado en la base pero invisible en la UI.

**Orden de despliegue:** primero la migración, luego el deploy que fuerza el `revalidateTag`. Al revés, la app sirve datos viejos con el código nuevo.