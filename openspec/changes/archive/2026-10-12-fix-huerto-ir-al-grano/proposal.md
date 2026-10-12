# Proposal

## Why

En la reunión el socio dijo que le cuesta encontrar dónde ver sus árboles, y que quiere «ir al grano»: elegir un limón de inmediato, no recorrer la pantalla. Hoy la pantalla principal no tiene ningún acceso a ellos. El contador de árboles está en una card que no es un enlace, la ruta `/especie/especies` no se enlaza desde `/huerto` ni desde la barra inferior ni desde la cabecera, y el selector de especies está escondido dentro de la barra de «Agregando — toca tu terreno», que solo aparece en modo agregar. Encima el orden empuja el mapa 520 px hacia abajo, detrás de un bento de cifras `text-3xl` y de una card de texto, todo ello con las etiquetas en `text-xs`/`text-[10px]`, que es la proporción que el socio describió como «cuadros muy grandes con letra pequeña».

## What Changes

- **El mapa sube al primer bloque de la pantalla.** Hoy vive dentro de la tab «Mi huerto», que es la primera de tres. Pasa a estar arriba, a ancho completo, sin tabs que lo escondan.
- **El selector de especies se agranda y deja de estar escondido.** Sale de la barra condicional de «Agregando» y pasa a un control a ancho completo con target táctil de 48 px, siempre visible, inmediatamente debajo del mapa. Sigue siendo el selector de la especie activa para marcar.
- **Acceso directo a los árboles.** La card de inventario con «N especies · M árboles» pasa a ser un enlace a `/especie/especies`, y esa ruta se agrega a la barra inferior de navegación. Hoy no hay ningún camino desde la pantalla principal a la lista de especies del usuario.
- **Cultivos y Tarea bajan al final.** Se conservan, pero después del mapa y del selector, en vez de empujar el mapa hacia abajo.
- **Proporción letra/cuadro.** Las cifras del bento bajan de `text-3xl` y las etiquetas suben de `text-xs`/`text-[10px]`: la mezcla es el problema, no el tamaño absoluto.
- **Recorte de texto.** Los ~14 bloques de texto de la vista por defecto se reducen. Los hints del mapa (4 líneas) y el pie de «Recomendadas» son los peores y pasan a texto de apoyo.
- **Auditoría responsive al final**, porque reordenar la pantalla principal es donde el breakpoint `md` se rompe según el propio skill del repo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/huerto`: el mapa deja de estar contenido dentro de una pestaña y pasa a ser el primer bloque de la vista; el selector de especie activa se vuelve un control de tamaño táctil completo y siempre visible; el inventario de árboles pasa a ser alcanzable con un enlace desde la pantalla principal; Cultivos y Tareas quedan después del mapa.
- `garden/navigation`: la barra inferior de navegación SHALL incluir el índice de especies del usuario entre los destinos principales, para que el acceso a sus árboles sea un toque desde cualquier pantalla y no dependa de encontrarlo dentro de `/huerto`.

## Impact

- **Código**: `app/(dashboard)/huerto/page.tsx` (orden de bloques, card de inventario como enlace, recorte de texto, `text-3xl` → `text-2xl` y `text-xs` → `text-sm`), `components/huerto/WorkbenchModular.tsx` (el lienzo sube fuera de las tabs), `components/mapa/TerrenoSection.tsx` (el selector sale de la barra condicional a un control de 48 px), `components/layout/BottomNav.tsx` (ruta nueva; hoy son 5 destinos en `grid-cols-5` y pasarían a 6).
- **Tests**: no hay cobertura de componentes en el repo (17 archivos de test, todos de lógica pura más dos de contrato). La verificación de esta pantalla es la auditoría responsive con Playwright más el smoke de build, y queda en el grupo de integración.
- **Spec**: `garden/huerto` y `garden/navigation`.
- **Riesgo de navegación en móvil**: `BottomNav` está en `grid-cols-5` con `text-[11px]` y `h-14`. Seis destinos con una etiqueta más larga («Especies» sobre «Biblioteca») pueden apretar el label a 390 px y romper el `text-[11px]`. Hay que medirlo, y si no cabe, el destino nuevo entra en la cabecera de escritorio y en el menú, no en la barra inferior.
- **Riesgo de tab huérfana**: si el mapa sale de la tab «Mi huerto», hay que decidir qué queda en esa tab o si desaparece. Si desaparece, las tabs quedan en dos y la referencia a «la vista única» de la spec `garden/huerto` hay que actualizarla.
- **Ojo con `WorkbenchModular`**: es cliente y ya gestiona la selección de sub-tabs internos (Terreno/Posicionar/3D). Sacar el lienzo del nivel de tabs no lo debería afectar, pero el estado de sub-tab vive ahí y hay que comprobar que sigue funcionando con el componente montado en otro lugar del árbol.