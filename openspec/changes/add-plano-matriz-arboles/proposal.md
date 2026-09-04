# add-plano-matriz-arboles

## Why

El usuario pidió un "detector en 3D": si el polígono del mapa contiene 10 árboles, `/huerto` debe mostrarlos sincronizados sobre una imagen 2D/3D que se vea como el mapa y una matriz donde editar cada árbol individualmente. Hoy el inventario es una fila con `cantidad` agregada, sin posición espacial ni vinculación con el polígono.

## What Changes

- **`gf_arboles` espacial** (migración `0021`): columnas `huerto_id` (FK a `gf_huertos`, `on delete set null`), `pos_x`/`pos_y` (posición normalizada 0..1 sobre el bounding box del polígono) + índice.
- **Sincronización** (`sincronizarPlanoHuerto`): expande cada fila con `cantidad N` en N unidades individuales (cantidad 1) y las distribuye en una matriz regular dentro del polígono (reemplaza las filas del alcance: sin huerto o del huerto elegido; las de otros huertos quedan intactas). Techo de 200 árboles por plano.
- **Motor de layout puro** (`lib/huerto/plano.ts`): matriz con aspecto real (cos lat), ray-casting punto-en-polígono y proyección de celdas externas hacia el borde interior; `crearVistaPlano`/`posAVista` proyectan polígono y posiciones al mismo espacio SVG.
- **Plano visual en `/huerto`** (`PlanoHuerto.tsx`): SVG del polígono + grilla + un punto por árbol (color por especie, leyenda con conteos), **toggle 2D ↔ 3D** con proyección isométrica CSS (`rotateX(60°) rotateZ(45°)`, paralela, árboles billboard con `translateZ`), sin three.js ni dependencias nuevas.
- **Edición individual**: tocar un árbol abre un diálogo para cambiar especie, fecha, observaciones, quitarlo del plano o eliminarlo. Los árboles en plano pierden el stepper de cantidad (invariante 1 fila = 1 árbol); el action rechaza cambiar `cantidad` de un árbol en plano.
- **Freemium intacto**: el conteo de filas del inventario sigue determinando el límite del plan gratuito.

## Capabilities

### Modified Capabilities

- `garden/huerto`: ADDED — plano del huerto con matriz de árboles sincronizada desde el inventario, edición individual por árbol y vista 2D/3D.

## Impact

- **DB**: migración `0021_plano_arboles.sql` (columnas + índice; sin cambios de RLS).
- **Código**: `lib/huerto/plano.ts` (nuevo), `lib/huerto/huertos.ts` (+`sincronizarPlanoHuerto`), `lib/huerto/actions.ts` (`actualizarArbol` con `especie`/`huertoId` y guard de cantidad), `lib/huerto/data.ts`, `types/index.ts`, `components/huerto/PlanoHuerto.tsx` (nuevo), `components/huerto/ListaArboles.tsx`, `app/(dashboard)/huerto/page.tsx`.
- **Tests**: `tests/plano.test.ts` (ray-casting, proyección, matriz, vista, expansión).
- **Sin dependencias nuevas**: SVG + CSS 3D transforms (investigación: para decenas de nodos clickeables, SVG supera a Canvas/WebGL/three.js en simplicidad, accesibilidad y peso).
