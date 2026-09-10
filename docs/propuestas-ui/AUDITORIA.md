# Auditoría de flujo actual — GardenFood v2 (producción)

Fecha: 2026-09-09 · Entorno: https://gardenfoodv2.vercel.app (Chromium, viewport desktop + iPhone 390×844)
Usuario: admin de prueba (solo lectura, no se modificaron datos)

## Capturas (`audit/`)

| Archivo | Qué muestra |
|---|---|
| `huerto-full.png` | `/huerto` completo: bento, recomendadas, tabs, Agregar cultivo, Tus cultivos, Inventario (24 filas), Plano 2D, Tu terreno |
| `huerto-plano-3d.png` | Plano en modo 3D (three.js: polígono + 1 árbol) sobre el muro de filas duplicadas |
| `huerto-mobile.png` | `/huerto` en iPhone: bento apilado + bottom nav correctos |
| `perfil-map.png` | Mapa satelital Esri con los 5 huertos y árboles marcados (superposiciones visibles) |
| `perfil-full.png` | `/perfil` completo: comuna, Tu terreno, mapa Leaflet+Geoman, privacidad, derechos |

## Flujo actual

1. Login → redirige a `/huerto` (OK).
2. `/huerto`: bento stats → recomendadas → tabs (Mi huerto / Tareas / Clima) → **Agregar cultivo** (form) → **Tus cultivos** (lista) → **Inventario de árboles** (otro form + lista por ejemplar) → **Plano de tus huertos** (2D/3D) → **Tu terreno** (lista de huertos + «Editar en el mapa»).
3. «Editar en el mapa» → salta a `/perfil` → scroll hasta «Tu terreno» → ahí vive el mapa satelital (Leaflet + Geoman: dibujo de polígonos, capas, «Marcar árboles»).

## Hallazgos por requerimiento

### 1. Mapa satelital fuera de «Mi Huerto» — RESUELTO (2026-09-10): lienzo con tabs satélite/matriz/3D embebido en huerto modular; perfil conserva su página completa
El dibujo de polígonos vive solo en `/perfil` (`TerrenoSection` + `TerrenoMap`). Desde `/huerto` hay una card «Tu terreno» cuyo único CTA es saltar a Perfil. El usuario pierde el contexto (bento, tabs) al cruzar.

### 2. Duplicación «Tus cultivos» vs «Inventario de árboles» — RESUELTO (2026-09-10): inventario agrupado por especie (una fila por especie, expandible) — fin del muro de 24 filas, peor de lo esperado
Con datos reales: 1 cultivo (Ciruela ×1) + **24 filas de árboles** donde «Durazno» aparece repetido ~16 veces, todas «Sin fecha de plantación» con badge «En plano». Dos formularios separados piden «Especie» (+ fecha/observaciones en árboles) para la misma información. La «sincronización» convierte inventario agregado en ejemplares individuales (reemplaza filas en `gf_arboles`). El muro de 24 filas idénticas es el mayor ruido de la pantalla.

### 3. Contador de especies — RESUELTO (2026-09-10): especies únicas de cultivos∪árboles + detalle «K en plano de M», sin duplicado, badges en curso/completo en UI
El bento ya muestra «1 especies» (filas de `gf_cultivos`, únicas por especie) + «+ 24 árboles inventario». El ajuste pendiente: el «+24» cuenta filas de `gf_arboles`; si se quiere especies únicas del inventario habría que deduplicar (Durazno/Uva/Arándano/Durazno… = ~4 especies). Propuesta de copy: «4 especies · 24 árboles».

### 4. Renombrar «2D / 3D» — CONFIRMADO
Toggle literal «2D | 3D» en el plano. Renombrar a «Posicionar / Editar árboles» (2D) y «Visualización 3D» (3D, con botón «Vista inicial» ya existente).

### 5. Selector de huertos — EXISTE PERO ES LOCAL
Hay un `Select` «Huerto del plano» (solo cuando hay >1 huertos y solo filtra el plano). No filtra: bento, inventario, tareas ni recomendadas. Con 5 huertos, todo lo demás se mezcla (árboles sin `huerto_id` aparecen como globales).

### 6. «¿Qué hago esta semana?» (landing) — sin sesión hace gating; CON sesión desbloquea todo pero no hay ningún enlace a ficha/plantación: elegir comuna solo muestra tareas del mes, no conecta con el huerto.

### 7. Reubicación manual (drag & drop) — NECESIDAD CONFIRMADA VISUALMENTE
En el mapa satelital hay árboles amontonados y superpuestos (clusters arriba a la izquierda) y algunos **fuera de su polígono**. El hint del plano 2D ya dice «Arrastra para mover» pero hoy los árboles solo se reparten por la matriz («Completar matriz»), no se pueden arrastrar uno a uno.

## Bugs encontrados de paso (fuera de alcance de wireframes, para registrar)

1. **CSP bloquea `server.arcgisonline.com`** — RESUELTO (incl. rama dev que pisaba el fix) en producción: `connect-src` no incluye el dominio → el ajuste dinámico de maxNativeZoom del TerrenoMap falla con 2 errores por visita. Fix: agregar host a `connect-src` en `proxy.ts`/CSP.
2. **`/api/v1/cmp/consent` devuelve 400** tras «Rechazar todo» en desktop. Un rechazo debería ser 200. Probable raíz del freeze del modal en iOS/Safari (si la promesa queda pendiente/rota, el modal nunca resuelve). Investigar con WebKit.
3. **Inconsistencia de datos del usuario**: perfil dice Maipú/Buin (RM) pero los 5 huertos están en ~-36.63, -71.84 (región de Ñuble). El header mezcla ambos («Tu zona: Santiago Sur - Buin… para Maipú»). Refuerza la necesidad del selector de huerto global.

## Implicaciones para las 3 propuestas

- El muro del inventario + 2 forms es el problema #1 a resolver: una sola fuente de verdad «especie → cantidad → posición».
- El mapa satelital debe integrarse en `/huerto` sin duplicar la card «Tu terreno».
- El selector de huerto debe ser global (sticky header del área de huerto).
- El drag & drop encaja naturalmente en la vista «Posicionar» (2D) con confirmación a «Visualización 3D».
- El bento ya está bien encaminado; solo ajustar métrica y copy.
