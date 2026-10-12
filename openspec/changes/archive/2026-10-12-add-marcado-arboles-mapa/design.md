# Design add-marcado-arboles-mapa

Contexto: mapa Leaflet + geoman en `/perfil`; poligonos `gf_huertos` y árboles con posición normalizada (0021). El usuario ve sus árboles en el satélite y quiere contarlos sobre el mapa, no en un formulario.

## Decisiones

1. **Conteo asistido por tap en vez de detección automática.** La detección real de árboles individuales exige segmentación ML sobre imagery de alta resolución (pago/keys); Sentinel-2 (10 m/px) no resuelve árboles de un patio de 700 m². El satélite ya muestra los árboles al usuario: el tap por árbol convierte su percepción en datos, con la misma convención de posición (`pos_x/pos_y` normalizadas al bbox del polígono) que el plano ya usa. Sin migración DB.
2. **Hit-test contra la geometría viva de las capas** (`anilloDePolygon` de `capasRef`), no contra el geojson guardado: si el usuario acaba de editar vértices, el tap se asigna al polígono que realmente está en pantalla.
3. **Especie activa fija** (decisión del usuario): selector sticky fuera del flujo de cada tap → conteo rápido; el marcador aparece al instante (optimista vía estado local) sin toast por tap.
4. **Marcadores sincronizados por efecto** (diff por id entre props `arboles` y capas activas) en vez de API imperativa: la sección actualiza su lista tras cada acción y el mapa converge. `mapaListo` gatea el efecto hasta que el import dinámico de Leaflet terminó.
5. **Zoom nativo dinámico** (técnica del editor iD de OSM): en `moveend` con zoom ≥17, consulta `tilemap/{level}/{row}/{col}?width=1&f=json` para el tile central y fija `maxNativeZoom` al nivel mayor con datos (19→18→17), con caché por tile. Complemento: `?blankTile=false` hace que Esri responda 404 (no tile gris) si algo se escapa. Verificado con curl para Maipú: z19 `data:[0]`, z18/z17 `data:[1]`.
6. **Sentinel-2 (EOX s2cloudless 2025)** como tercera capa base (gratuita, global, sin key, zoom nativo 14; atribución requerida). URL verificada: `g/{z}/{y}/{x}.jpg` (WMTS REST TileMatrix/Row/Col); el orden alternativo devuelve PNG de error.
7. **Sync protege lo marcado a mano** (decisión clave post-feedback): el alcance pasa a "filas sin posición"; los posicionados cuentan contra el techo de 200 y bloquean sus celdas en `disponerEnMatriz` (separación 0,04 normalizada, fallback a celda si no queda libre). El botón pasa a "Completar matriz (N)" cuando ya hay árboles en el plano.
8. **`listarEspecies` como server action ligera**: el catálogo completo (`fichas.ts`, 10k líneas) no debe bundlearse en el cliente del mapa; la acción devuelve solo `{dbKey, nombre}`.
9. **Selector de huerto con etiqueta explícita**: base-ui `SelectValue` renderiza el valor crudo; se corrige pasando `children` como función (id → nombre) — verificado en `SelectValue.d.ts`.

## Riesgos

- [Taps simultáneos con dibujo geoman] → en modo marca se deshabilitan los botones de geoman y se cancelan dibujo/edición/borrado activos.
- [tilemap sin CORS o caído] → try/catch con caché de fallo (nivel 0); el fallback queda en 17 con overzoom.
- [Marcadores desalineados si el polígono se edita después] → la posición normalizada sigue al bbox actual del polígono (comportamiento aceptado y documentado).

## Plan

Sin migración. Deploy directo; rollback = revertir deploy.
