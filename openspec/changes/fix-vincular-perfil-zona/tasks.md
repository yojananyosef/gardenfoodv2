# Tasks

## 1. Resolución de zona sin fallback opaco

- [x] 1.1 Añadir en `lib/agronomy/index.ts` una resolución que devuelva `{ zonaId, comuna, esDefault }`, con `esDefault` en `true` cuando la comuna no está en el catálogo (no comparando contra el id 7). Verificar con un test que una comuna válida sale `esDefault: false`, que `undefined` sale `true`, y que una comuna inventada sale `true` sin lanzar.
- [x] 1.2 Dejar `getZonaIdDeComuna` y `getZonaDeComuna` como envolturas compatibles con la firma actual para no romper los ~10 call-sites existentes. Verificar con `pnpm typecheck` y `pnpm test` que los consumidores actuales siguen en verde.
- [x] 1.3 Documentar en `PENDING.md` que el fallback a zona 7 ahora es observable y que el caso bloqueado de la ficha se verificó en el grupo 5.

## 2. Hook de perfil

- [x] 2.1 Crear `hooks/usePerfilZona.ts` con `"use client"`: una sola consulta a `perfiles` (`comuna`, `tipo_suelo`), relectura en `focus` y `visibilitychange` con el guard `active` que ya usa el código actual, y estado `{ zonaId, sueloId, comuna, cargando, esDefault }`. Comentar por qué va en `hooks/` y no en `lib/huerto/data.ts` (ese es server-only).
- [x] 2.2 Añadir a `tests/vinculacion-zona.test.ts` la cobertura del mapeo de `tipo_suelo` a `sueloId` (`G`/`MG`/`M`/`F` → el valor, cualquier otra cosa → `null`) y del `esDefault` en los tres casos. Verificar que el archivo pasa con `pnpm test`.

## 3. Ficha: una sola lectura

- [x] 3.1 Reemplazar el `useEffect` de perfil de `components/especies/FichaEspecieView.tsx:562-586` por una llamada a `usePerfilZona()`, conservando el commentario que explica la relectura en `focus`/`visibilitychange`. Verificar con `pnpm typecheck`.
- [x] 3.2 Borrar el `useEffect` y los estados `zonaNombre`/`entrada`/`loading` de `TabFenologia` (`:413-431`) y pasarle `zonaId` como prop, igual que ya recibe `TabRiego` y `TabInfo`. Verificar que la tab Fenología sigue mostrando el Gantt con la zona del perfil.
- [x] 3.3 Añadir tests de regresión que verifiquen que `TabFenologia` ya no importa `createClient` ni consulta `perfiles` (grep sobre el archivo) y que recibe la zona por prop. Ejecutar `pnpm lint` y `pnpm test`.

## 4. Nutrición: región derivada, no congelada

- [x] 4.1 Cambiar `regionInicial` en `components/especies/NutricionGuia.tsx:498-505` a `string | null`: devuelve la región del perfil solo si `guiaRegional` tiene programa, y `null` si no. Borrar el salto a `candidatas.find(...)`. Verificar con un test de `regionInicial` para el caso de especie sin guía en la región del perfil.
- [x] 4.2 Eliminar el selector de región de `PanelAjuste` y con él el estado `override`: la región sale de la comuna del perfil y se cambia en `/perfil`. Derivarla en render, sin `useState` ni `useEffect` de sincronización, y con `regionVisible` que distingue «sin comuna» (cae a la región central) de «con comuna sin guía» (devuelve `null`). Cubrir los dos casos con tests.
- [x] 4.3 Cambiar el estado vacío por falta de guía: título con la especie y la zona del usuario, texto que diga que la guía no cubre esa combinación y un enlace a `/perfil` para cambiar la comuna. Verificar que ya no se alcanzan a ver `programas` de otra región en el árbol de la tab.
- [x] 4.4 Convertir el pie de `PanelAjuste` en los dos casos distinguibles: región de la comuna, y sin comuna o fuera de la guía. En los dos debe decir dónde se cambia la comuna.
- [x] 4.5 Cubrir con tests el cambio de comuna, verificando que la región visible pasa a la de la nueva comuna y que una comuna sin guía no inventa una región. Ejecutar `pnpm test` y confirmar que los tests nuevos de este grupo pasan sin tocar los de grupos previos.

## 5. Verificación de integración

- [x] 5.1 Comprobar con `pnpm typecheck`, `pnpm lint` y `pnpm test` que todo el repo pasa, y con `pnpm build` que las 38 rutas siguen compilando.
- [x] 5.2 Renderizar `/especies/[slug]` para una especie bloqueada y una no bloqueada, y comparar contra el estado previo: el HTML inicial no debe mostrar un estado de carga de zona donde antes había datos, y la ficha bloqueada debe seguir mostrando el contenido completo para SEO.
- [x] 5.3 Recorrer el flujo a mano con sesión real: cambiar la comuna en `/perfil` en otra pestaña, disparar el retorno a la ventana en la ficha (`visibilitychange` + `focus`) y confirmar que el calendario y las dosis cambian a la región de la nueva comuna.
- [x] 5.4 Comprobar el caso sin comuna: con el perfil sin comuna configurada, confirmar que la tab Nutrición dice que no hay comuna y ofrece configurarla, en vez de mostrar datos de Santiago-RM.
- [x] 5.5 Confirmar que con una comuna sin guía para la especie la ficha muestra el estado vacío, que no queda ninguna parte diciendo que los datos son de otra región, y que desde ahí se llega a cambiar la comuna.