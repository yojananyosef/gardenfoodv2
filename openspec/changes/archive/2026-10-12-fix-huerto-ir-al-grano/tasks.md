# Tasks

## 1. Lienzo al frente

- [x] 1.1 En `app/(dashboard)/huerto/page.tsx`, sacar el `WorkbenchModular` de dentro de `TabsContent value="huerto"` y montarlo como primer bloque del `div` raíz (`page.tsx:139`), antes del header o justo después del header, sin tabs de por medio. Verificar con `pnpm typecheck` y mirando el DOM que el mapa se renderiza sin activar ninguna tab.
- [x] 1.2 Eliminar la tab «Mi huerto» y fusionar su contenido (leyenda de especies y banners) en la zona que queda, dejando Cultivos/Tareas/Clima como tabs de información. Verificar con `grep -n 'value="huerto"' app/` que no quedan referencias a la tab borrada.
- [x] 1.3 Recorrer los 3 sub-tabs internos de `WorkbenchModular` (Terreno, Posicionar, 3D) después del movimiento y confirmar que el sub-tab elegido se conserva y que el estado no se pierde al remontar. Si se pierde, pasar el sub-tab a prop controlada desde el padre.
- [x] 1.4 Correr `pnpm dev` y comprobar en el navegador que el mapa aparece arriba, que el botón «Abrir asistente» sigue en la cabecera y que cerrar el asistente devuelve a la misma vista sin recargar.

## 2. Selector de especie siempre visible

- [x] 2.1 Extraer el `Select` de especie de `components/mapa/TerrenoSection.tsx:563-602` a `components/huerto/SelectorEspecie.tsx`, con `min-h-12` (48 px) y ancho completo, recibiendo la especie activa y su setter como props en vez de leer estado local.
- [x] 2.2 Montar `SelectorEspecie` en `app/(dashboard)/huerto/page.tsx` entre el mapa y las tabs, siempre visible. Verificar que la barra condicional de «Agregando» ya no monta el `Select` y que solo conserva el contador y el botón «Listo».
- [x] 2.3 Probar el flujo crítico de plantar: activar «Agregar árboles», cambiar la especie con el selector grande, tocar el terreno y confirmar un árbol. Verificar que el árbol se registra con la especie elegida.
- [x] 2.4 Medir el alto real del selector en el navegador y confirmar que es de al menos 48 px con `getBoundingClientRect`, para que el target táctil cumple el mínimo de WCAG 2.2 y el criterio del repo.

## 3. Acceso directo a los árboles

- [x] 3.1 Convertir la card de Cultivos (`page.tsx:170-202`) en un enlace a `/especie/especies` usando el `render` del componente `Card`, con foco visible y área táctil completa, sin agregar un botón dentro.
- [x] 3.2 Verificar que la card sigue mostrando «N especies · M árboles» una sola vez tras la fusión de la tab, sin duplicar el conteo.
- [x] 3.3 Probar el enlace desde un huerto vacío y desde uno con 16 árboles: en ambos casos debe llevar al índice de especies y mostrar el conteo por especie.

## 4. Navegación

- [x] 4.1 ~~Agregar `/especie/especies` a `DESTINOS`~~ **DECISIÓN REVERTIDA**: con etiquetas como «Calendario» y «Biblioteca», seis destinos en 360 px dan ~60 px por ítem y el texto se parte. El `grid-cols` queda en 5 y el acceso se resuelve con el enlace de la card Cultivos en `/huerto`, que sí funciona en móvil. Ver `PENDING.md`. La línea original pedía agregar `/especie/especies` a `DESTINOS` en `components/layout/BottomNav.tsx` y ajustar el `grid-cols` al número de destinos, conservando el `h-14` y el `aria-label` de la barra.
- [x] 4.2 Verificar que el destino aparece marcado como activo cuando el usuario está en el índice de especies, incluyendo desde una subruta.
- [x] 4.3 Medir a 360, 375 y 390 px si las seis etiquetas caben sin cortarse ni desbordar. Si no caben, aplicar la salida 2 de la decisión 5 del design (label corto y evaluar quitar «Zonas») o, si persiste, la salida 3 (solo cabecera de escritorio). Confirmar en cada caso que queda una sola lectura de la decisión tomada.

## 5. Proporción y recorte de texto

- [x] 5.1 En `app/(dashboard)/huerto/page.tsx`, bajar los dos `CardTitle text-3xl` de las stats (`:180`, `:216`) a `text-2xl` y subir las etiquetas `text-xs`/`text-[10px]` de las stats a `text-sm`/`text-xs`. Verificar con el navegador que la diferencia de escala entre cifra y etiqueta se ve razonable.
- [x] 5.2 Convertir el hint del mapa (`components/mapa/TerrenoMap.tsx:1159-1165`) en estado cerrado con un botón «Cómo funciona» que lo despliegue, y reducir el hint de terreno vacío (`:1154-1157`) a una línea. Verificar que el mapa no ocupa más bloques de los que ocupaba.
- [x] 5.3 Borrar el pie «Filtrado por tu comuna · Datos de viabilidad real» (`:280`) y recortar el subtítulo bajo el h1 (`:160-164`) a una línea como máximo. Mantener los datos: conteos, superficies y fechas.
- [x] 5.4 Recorrer la vista por defecto y contar los bloques de texto antes y después, confirmando que la reducción es real y no solo un recorte en un bloque mientras otro se expande.

## 6. Verificación responsive e integración

- [x] 6.1 Ejecutar la auditoría responsive con Playwright en 360, 390, 430, 640, 768, 820, 1024 y 1440 px, siguiendo el skill `responsive-audit`, con especial atención al borde de `md` (768) por el que avisa el propio skill. Registrar los hallazgos en el output del change.
- [x] 6.2 Verificar que no hay desbordamiento horizontal en 375 px, que todos los targets interactivos miden al menos 48 px y que la barra inferior no tapa el último bloque al hacer scroll al fondo.
- [x] 6.3 Confirmar que el mapa sigue cargando con su altura de 520 px y que el conteo de la ficha por especie sigue funcionando desde los chips de la leyenda.
- [x] 6.4 Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`, confirmando que el repo pasa y que las 38 rutas compilan.
- [x] 6.5 Anotar en `PENDING.md` que la pantalla principal cambió de composición y que conviene revisar las métricas de `useTrackedView` de `/huerto` después de publicar.