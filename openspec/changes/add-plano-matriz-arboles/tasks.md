# Tasks add-plano-matriz-arboles

## 1. Base de datos

- [x] 1.1 Migración `supabase/migrations/0021_plano_arboles.sql`: `gf_arboles.huerto_id` (FK `gf_huertos on delete set null`), `pos_x`, `pos_y` numéricos + índice `huerto_id`; aplicada vía MCP.

## 2. Motor de plano (puro)

- [x] 2.1 `lib/huerto/plano.ts`: `puntoEnPoligono` (ray-casting), `proyectarADentro` (proyección a borde + epsilon interior), `disponerEnMatriz` (matriz con aspecto real, clamp 0..1, fallback degenerado), `crearVistaPlano`/`posAVista` (proyección SVG compartida con margen), `colorDeEspecie` (hash estable), `expandirUnidades`.

## 3. Server actions

- [x] 3.1 `lib/huerto/huertos.ts`: `sincronizarPlanoHuerto(huertoId)` — valida uuid/propiedad del huerto, scope `huerto_id is null or = huerto`, expande unidades, techo 200, disponer en matriz, insert → delete, `revalidatePath`.
- [x] 3.2 `lib/huerto/actions.ts`: `actualizarArbol` con `especie` y `huertoId` (valida propiedad del huerto; null limpia posición), guard de `cantidad` para árboles en plano.

## 4. Datos y tipos

- [x] 4.1 `types/index.ts`: `Arbol` con `huertoId/posX/posY`; `HuertoResumen.feature`.
- [x] 4.2 `lib/huerto/data.ts`: `getArboles` y `getHuertos` mapean las columnas nuevas.

## 5. UI

- [x] 5.1 `components/huerto/PlanoHuerto.tsx`: selector de huerto, SVG del polígono + grilla, árbol por punto (color por especie, leyenda con conteos), toggle 2D/3D isométrico (billboard con `translateZ`), stats, botón sincronizar con confirmación, estado vacío con CTA al mapa.
- [x] 5.2 Diálogo de edición por árbol: especie, fecha, observaciones, quitar del plano, eliminar.
- [x] 5.3 `ListaArboles.tsx`: badge "En plano" en vez de stepper para filas con `huerto_id`.
- [x] 5.4 `app/(dashboard)/huerto/page.tsx`: card "Plano de tus huertos".

## 6. Specs y tests

- [x] 6.1 `tests/plano.test.ts`: ray-casting, proyección, matriz (dentro del polígono, L-shape, determinismo, degenerados), vista/mapeo, colores, expansión.
- [x] 6.2 Specs: delta `garden/huerto` + spec principal sincronizado.
- [x] 6.3 `tsc --noEmit`, `eslint`, `vitest run` en verde; advisors sin hallazgos nuevos.
