# Tasks

## 1. Nombres del selector en los datos

- [x] 1.1 En `lib/agronomy/fertilizacion.ts`, cambiar `METODOS_GUIA` a `{ id: "suelo", nombre: "Fertilizantes granulados" }` y `{ id: "goteo", nombre: "Fertilizantes solubles" }`, conservando los ids y los `desc` con un comentario que explique que el `desc` se mantiene a propósito como documentación del mapeo del XLSX aunque no se renderee.
- [x] 1.2 Extender `tests/fertilizacion.test.ts` con dos tests: `METODOS_GUIA` expone los nombres nuevos y conserva los ids `suelo`/`goteo`. Verificar que `pnpm test` pasa y que `guiaRegional` sigue resolviendo los mismos programas para ambos ids.

## 2. Quitar la jerga del tipo de datos visual

- [x] 2.1 En `momentosVisibles` (`lib/agronomy/fertilizacion.ts:269-287`), borrar los campos `titulo` y `proposito` del objeto devuelto y quitarlos de la interfaz `MomentoGuia`. Verificar con `pnpm typecheck` que los call-sites se reportan como errores y que son solo los esperados (`NutricionGuia.tsx` y el `aria-label`).
- [x] 2.2 Borrar `PROPOSITOS_MOMENTO` y `REPOSO_MOMENTO`, y reemplazar el uso de `REPOSO_MOMENTO` en el bloque sin productos por una frase de una línea basada en meses («En estos meses no se abona»). Verificar con `grep -rn 'PROPOSITOS_MOMENTO\|REPOSO_MOMENTO\|momento.titulo\|momento.proposito' components/ lib/ tests/` que no queda ninguna referencia.
- [x] 2.3 Añadir a `tests/fertilizacion.test.ts` un test que verifique que `guiaRegional(...).momentos[].titulo` y `.proposito` ya no existen y que `mesesTexto` sí sigue presente. Ejecutar `pnpm test`.

## 3. Render de la tab visual

- [x] 3.1 En `components/especies/NutricionGuia.tsx`, cambiar el label del grupo en `PanelAjuste` (`:421`) de «Cómo le das el agua» a «Qué fertilizante usas».
- [x] 3.2 Borrar el `<span>` que renderiza `m.desc` en el botón de cada método (`:445`), dejando solo el icono y el nombre.
- [x] 3.3 En `BloqueMomento` (`:305-341`), titular la cabecera a color con `mesesTexto` y borrar el `<p>` de `mesesTexto` que quedaba debajo del título, para que no se duplique.
- [x] 3.4 Reescribir `nombreDe(mes)` (`:110-118`) para que el `aria-label` de cada mes se componga de meses en vez de títulos: «Julio: Jul y Ago» cuando hay momento y «Julio: no se abona» cuando no. Verificar que no queda ningún `.join()` sobre lista vacía y que la función sigue siendo pura y testeable.
- [x] 3.5 Añadir tests que verifiquen las cuatro frases de `nombreDe`: un mes con un momento, un mes con dos momentos (el de traspaso), un mes sin abono, y el nombre largo del mes. Ejecutar `pnpm test` y `pnpm lint`.
- [x] 3.6 Quitar la leyenda de colores del calendario y el badge «Los meses en que le toca»: los doce círculos ya dicen mes a mes si hay aplicación y cuántas, así que el rótulo repetía lo que estaba justo debajo.

## 4. Ficha espejo del módulo de huerto

- [x] 4.1 En `app/(dashboard)/especie/especies/[especie]/page.tsx`, cambiar el `CardTitle` del bloque (`:128`) para que use `p.meses` en vez de `p.momento`, y el texto de estado vacío «Sin aplicaciones en este momento del año» (`:138`) para que hable de meses.
- [x] 4.2 Borrar las tres filas de fenología de la guía (`:193-195`: «Cuando despierta», «Cuando engorda la fruta», «Cuando se recupera») o reducirlas a una sola fila de meses, según lo que quede coherente con el resto de la card. Verificar que «Brota», «Florece» y «Cosecha» se quedan, que son fenología real y no jerga de estado.
- [x] 4.3 Cambiar el `producto` por defecto de `BotonLoEche` (`:160`) para que se componga con `p.meses` en vez de `p.momento`, dejando el `momento={p.momento}` intacto como id persistido. Verificar con `pnpm typecheck` y con un test que `registrarAplicacion` siga recibiendo el `momento` del seed.

## 5. Verificación de integración

- [x] 5.1 Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`, confirmando que todo el repo pasa y que las 38 rutas siguen compilando.
- [x] 5.2 Recorrer las dos rutas en busca de jerga: la tab Nutrición de la ficha visual y el render de `app/(dashboard)/especie/especies/[especie]/page.tsx`. Confirmar con `grep -rn 'Cuando despierta\|Cuando engorda\|Cuando se recupera' components/ app/` que no queda ninguno en código renderizado (las filas históricas de la tabla de aplicaciones quedan fuera).
- [x] 5.3 Probar el calendario con lector de pantalla en la ficha: recorrer los 12 meses y confirmar que cada uno se anuncia con su nombre y los meses en que corresponde abonar, sin texto mudo ni enumeración vacía.
- [x] 5.4 Comprobar que las aplicaciones ya registradas antes del cambio siguen mostrando su texto con sentido en el calendario, y que «Lo eché» sigue agendando el cuidado siguiente con el `momento` del seed.
- [x] 5.5 Verificar que la ficha bloqueada (`/especies/[slug]`) sigue mostrando el contenido completo para SEO después del cambio de textos.