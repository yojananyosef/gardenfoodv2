# Tasks add-marcado-arboles-mapa

## 1. Motor y acciones

- [x] 1.1 `lib/huerto/plano.ts`: `posDesdeLatLng`, `latLngDesdePos`, `disponerEnMatriz` con `{ocupadas, separacion}` (evita celdas de árboles marcados a mano, fallback si no queda celda libre).
- [x] 1.2 `lib/huerto/huertos.ts`: `agregarArbolEnMapa` (validación uuid/punto, hit-test server-side, límite freemium de árboles, inserción con posición) y rework de `sincronizarPlanoHuerto` (protege posicionados, techo 200 conjunto, ocupadas).
- [x] 1.3 `lib/huerto/actions.ts`: `listarEspecies` (server action ligera `{dbKey, nombre}`).

## 2. Mapa /perfil

- [x] 2.1 `TerrenoMap.tsx`: modo "Marcar árboles" (tap → hit-test contra capas vivas → crear árbol), marcadores sincronizados por efecto (color por especie, tooltip, click → edición), cursor crosshair, geoman deshabilitado en modo marca.
- [x] 2.2 Satelital: `?blankTile=false`, `maxNativeZoom` inicial 17, ajuste dinámico vía tilemap de Esri (caché por tile), capa base "Sentinel-2 (EOX 2025)" (maxNativeZoom 14).
- [x] 2.3 `TerrenoSection.tsx`: carga de árboles + límites de plan, barra de modo marca (especie activa + contador + Listo), upsell freemium (2º árbol), diálogo compartido para editar/eliminar marcadores.

## 3. Plano /huerto

- [x] 3.1 `PlanoHuerto.tsx`: usa `EditarArbolDialog` compartido, fix del selector (etiqueta con nombre en vez de UUID), botón "Completar matriz (N)" cuando hay árboles posicionados.

## 4. Specs, docs y verificación

- [x] 4.1 `tests/plano.test.ts`: normalización posDesdeLatLng, roundtrip con latLngDesdePos, celdas ocupadas.
- [x] 4.2 Delta specs `garden/terreno` y `garden/huerto` + specs principales sincronizadas.
- [x] 4.3 Nota de datasets oficiales (CIREN/IDE Minagri/INIA) como referencia futura en PENDING.md.
- [x] 4.4 URLs verificadas con curl (EOX z/y/x 200 con JPEG; tilemap Esri: Maipú z19 sin datos, z18 disponible). `tsc`, `eslint`, `vitest` en verde.
