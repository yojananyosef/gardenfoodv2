# add-marcado-arboles-mapa

## Why

El usuario ve sus árboles claramente en el satélite del mapa pero el sistema "no los registra": el flujo obligaba a un formulario de inventario + sincronización, y el zoom satelital fallaba con "Map data not yet available" (Esri World Imagery no tiene zoom nativo uniforme; zonas rurales terminan en 17-18 mientras el mapa pedía 19). Además el selector de huerto del plano mostraba el UUID crudo. Se investigó: detección automática de árboles individuales requiere ML sobre imagery de pago (Sentinel-2 = 10 m/px no resuelve árboles de patio); la alternativa práctica es el conteo asistido con taps sobre el satélite (decisión del usuario).

## What Changes

- **Modo "Marcar árboles" en el mapa de `/perfil`**: marcadores de árboles siempre visibles; con el modo activo, cada tap dentro de un polígono registra un árbol en esa posición exacta (hit-test por `puntoEnPoligono`, posición normalizada derivada de lat/lng). Sin migración DB (columnas `huerto_id/pos_x/pos_y` de 0021).
- **Especie activa fija**: selector sticky; tap-tap-tap para contar rápido. Tap sobre marcador → diálogo de edición compartido. Tap fuera de polígono → toast.
- **Freemium**: 1er árbol gratis; 2º → upsell Huertero (server-side + cliente).
- **Satelital eficiente**: URL de Esri con `?blankTile=false` (404 en vez de tile gris) + detección dinámica de `maxNativeZoom` vía API `tilemap` de Esri (verificado en producción: Maipú z19 sin datos, z18 disponible) con caché por tile. Capa base extra "Sentinel-2 (EOX s2cloudless 2025)" gratuita, global, zoom nativo 14.
- **Sync protege lo marcado a mano**: `sincronizarPlanoHuerto` solo expande/ubica filas SIN posición (bulk + sin asignar); los posicionados quedan intactos y la matriz evita sus celdas (`disponerEnMatriz` con `ocupadas`). Botón "Completar matriz (N)".
- **Fix selector UUID**: `SelectValue` con función de etiqueta (id → nombre).

## Capabilities

### Modified Capabilities

- `garden/terreno`: ADDED — marcado de árboles sobre el mapa (modo, hit-test, especie activa, edición por marcador) y ADDED — visión satelital eficiente (zoom nativo dinámico, capa Sentinel-2).
- `garden/huerto`: MODIFIED — sincronización protege árboles posicionados y completa solo la matriz de filas sin posición.

## Impact

- **Sin cambios de DB** (reusa columnas de 0021).
- **Código**: `lib/huerto/plano.ts` (+`posDesdeLatLng`, `latLngDesdePos`, `disponerEnMatriz` con `ocupadas`), `lib/huerto/huertos.ts` (+`agregarArbolEnMapa`, sync rework), `lib/huerto/actions.ts` (+`listarEspecies` server action ligera), `components/perfil/TerrenoMap.tsx` (modo marca, marcadores, satelital), `components/perfil/TerrenoSection.tsx`, `components/huerto/EditarArbolDialog.tsx` (extraído compartido), `components/huerto/PlanoHuerto.tsx`.
- **Tests**: `tests/plano.test.ts` (+normalización, roundtrip, celdas ocupadas).
- **URLs verificadas con curl**: EOX `g/{z}/{y}/{x}.jpg` (orden WMTS REST TileMatrix/Row/Col); tilemap Esri `/tilemap/{level}/{row}/{col}?f=json`.
- **Datasets oficiales (referencia futura, no integrados)**: CIREN Catastro Frutícola (MapServer `esri.ciren.cl` + CSV ODEPA 1999-2025, comercial >0,5 ha), IDE Minagri WMS, INIA Agromet. `johan/world.geo.json` descartado (límites admin-0/1).
