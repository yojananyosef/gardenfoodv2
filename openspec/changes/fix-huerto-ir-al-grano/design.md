# Design

## Context

`app/(dashboard)/huerto/page.tsx` (565 líneas) es un server component. Estructura actual:

1. Header con badge de zona, h1 y subtítulo (`:141-166`)
2. Bento de 3 stats, `grid gap-3 sm:grid-cols-3` (`:169-240`): card Cultivos (1 col), card Hoy con tareas y clima (2 cols), ambas con `CardTitle text-3xl`
3. Card Recomendadas / «Qué plantar en {comuna}» (`:244-282`)
4. `Tabs defaultValue="huerto"` (`:285-309`) con 3 triggers
5. Dentro de la tab "huerto": `WorkbenchModular` (`:314-326`), que envuelve el lienzo en una `Card` con header «Lienzo del huerto», sub-tabs Terreno/Posicionar/3D, botón «Agregar árboles», y el `TerrenoMap` con **520 px** de alto por defecto
6. Tabs Tareas (`:337-438`) y Clima (`:441-534`)

Restricciones que moldean el enfoque:

- La spec vigente `garden/huerto` describe la vista como tabs Mi huerto/Tareas/Clima con el lienzo dentro. Cambiar el orden obliga a modificar esa spec, no solo la página.
- `BottomNav` tiene 5 destinos en `grid-cols-5`, `text-[11px]`, `h-14` (`components/layout/BottomNav.tsx:8-14`). El `aria-label` de la barra es «Navegación principal».
- La tarjeta de Cultivos (`:170-202`) no es un `Link` ni tiene handler: es una `Card` con el conteo y nada más.
- El selector de especie está en `TerrenoSection.tsx:563-602`, dentro de la barra `rounded-lg border bg-primary/5 p-2` que solo se pinta en modo agregar, con `SelectTrigger w-32 sm:w-48 min-h-9`.
- `WorkbenchModular` es `"use client"` y mantiene el estado de sus sub-tabs internos (Terreno/Posicionar/3D) y el slot del asistente. Sacarlo de las tabs no lo afecta mientras siga montado como un solo componente, pero hay que revisar que el estado de sub-tab sobreviva al remontaje.
- No hay tests de componentes en el repo. `tests/` tiene 17 archivos, todos de lógica pura o de contrato de infra. La única forma de verificar esta pantalla es la auditoría responsive con Playwright.
- El layout global es `max-w-6xl px-4 sm:px-8 pb-24 pt-6`, y `BottomNav` es `fixed` con `lg:hidden`, lo que ya obliga a reservar `pb-24`.

## Goals / Non-Goals

**Goals:**
- El mapa sea lo primero que se ve, sin tabs de por medio.
- Poder elegir una especie en un toque desde la pantalla principal.
- Que el inventario de árboles tenga un enlace real desde la pantalla principal y desde la navegación.
- Que Cultivos y Tarea queden después del mapa.
- Que la proporción cifra/etiqueta sea legible y que el texto explicativo no ocupe la vista.

**Non-Goals:**
- No se rediseña el mapa ni se cambia su altura de 520 px. Se mueve.
- No se toca `TerrenoMap`, `PlanoHuerto` ni el modo 3D.
- No se cambia el flujo del asistente de 4 pasos, que ya está especificado y funciona.
- No se agregan rutas nuevas. `/especie/especies` ya existe y ya muestra «N en tu huerto» por especie.
- No se rediseña `/recomendadas` ni `/explorar`.

## Decisions

### 1. El lienzo sube como bloque hermano de las tabs, no como tab

El `WorkbenchModular` se mueve a nivel superior, antes de todo lo demás. Las tabs quedan para Cultivos/Tareas/Clima.

**Alternativa descartada:** dejar las tabs pero cambiar `defaultValue` a la del mapa y sacar Cultivos/Tarea de adentro. Se descartó porque «Mi huerto» seguiría siendo una tab cuyo contenido es el mapa, o sea el mismo problema con un nombre menos: el mapa seguiría escondido detrás de un control que el usuario tiene que entender. El socio pidió el mapa arriba, no el mapa con un nombre de tab arriba.

### 2. La tab «Mi huerto» desaparece y se fusiona con Cultivos

Si el lienzo sale de la tab, la tab «Mi huerto» queda con la leyenda de especies y los banners, que no justifican una tab propia. Se fusiona con la card de Cultivos, que hoy ya muestra el mismo dato de conteo. Quedan dos tabs: Cultivos (con la leyenda) y Tareas y Clima.

Esto elimina la contradicción que ya tiene la spec: dice «la vista única» y a la vez describe tres tabs con el lienzo dentro. Con el lienzo arriba, las tabs son de información, no de navegación principal.

**Alternativa descartada:** mantener «Mi huerto» como tab con la leyenda y dejar Cultivos duplicada. Se descartó porque el repo ya pasó por una merger de un bento que duplicaba el conteo de inventario (la spec lo dice explícitamente: «debe leerse «N especies · M árboles» una sola vez») y repetir eso sería volver al problema.

### 3. El selector de especie se extrae de `TerrenoSection` y sube

El `Select` de especie se convierte en un componente propio (`components/huerto/SelectorEspecie.tsx`) con `min-h-12` (48 px) y ancho completo, que se pinta siempre entre el mapa y las tabs. `TerrenoSection` recibe la especie activa y su setter como props, y la barra condicional de «Agregando» pasa a mostrar solo el contador y el botón «Listo».

**Alternativa descartada:** agrandar el selector dentro de la barra de «Agregando» y dejarla siempre visible. Se descartó porque esa barra tiene semántica de modo agregar (fondo `bg-primary/5`, contador de «N en el mapa», botón «Listo»), y mezclarla con un control permanente la volvería ambigua: el usuario no sabría si el selector es para plantar o para consultar. Separarlos cuesta un componente y deja cada uno con su lectura.

Extraer el componente también evita duplicar el `<Select>` en dos lugares, que es lo que pasó con el render del programa de fertilización en la ficha y ya costó un change de sincronización (`fix-textos-nutricion`).

### 4. La card de Cultivos pasa a ser un `Link` a `/especie/especies`

Con la tab fusionada, el bloque con «N especies · M árboles» es el punto natural de salida al inventario. Se convierte en un enlace completo, con foco visible y con `hover` que ya aporta el componente `Card` como `render`.

**Alternativa descartada:** agregar un botón «Ver mis N árboles» dentro de la card. Se descartó porque un botón dentro de una card que además es clicable duplica el target; o la card es enlace, o tiene botón. El enlace de card completa da un target más grande, que es lo que pide el criterio de touch target.

### 5. `/especie/especies` entra en `BottomNav`, con medición obligatoria

`DESTINOS` pasa de 5 a 6 y el `grid-cols-5` a `grid-cols-6`. Con `text-[11px]` y `h-14`, la pregunta es si «Biblioteca» y el nombre nuevo caben a 390 px. Se mide en la auditoría y hay tres salidas posibles, en este orden de preferencia:

1. Cabe: seis destinos, `grid-cols-6`.
2. No cabe: el destino nuevo se llama corto («Especies», «Árboles») y se evalúa quitar «Zonas» de la barra —hoy `/recomendadas` está también en la cabecera de escritorio.
3. Sigue sin caber: el destino nuevo entra solo en la cabecera de escritorio y se llega desde la card de Cultivos, que ya es el enlace principal. La barra inferior no crece.

Lo que no se hace es agregar un sexto destino con label largo «Mis especies» y esperar que se acomode.

### 6. Texto: los hints pasan a `<details>`, el resto se recorta en línea

Los candidatos, medidos en la vista por defecto:

- Hint del mapa (`TerrenoMap.tsx:1159-1165`, 4 líneas) → estado cerrado con un botón «Cómo funciona», porque explica un gesto (tocar el terreno) que se descubre mejor viéndolo.
- Hint de terreno vacío (`:1154-1157`) → una línea.
- Pie de «Recomendadas» (`page.tsx:280`, «Filtrado por tu comuna · Datos de viabilidad real») → se borra; el badge de la cabecera ya dice que es para tu zona.
- Subtítulo bajo el h1 (`:160-164`) → una línea como máximo, y solo cuando hay algo que decir.
- Card Hoy: la fecha larga (`toLocaleDateString` con weekday/day/month, `:230`) se queda porque es información, no explicación.

**Alternativa descartada:** un interruptor global «menos texto». Se descartó porque es un control que hay que explicar, que es exactamente el texto que se quiere quitar.

### 7. Proporción letra/cuadro: bajar la cifra, subir la etiqueta

`CardTitle text-3xl` → `text-2xl` en las dos stats, y las etiquetas `text-xs`/`text-[10px]` → `text-sm`/`text-xs`. No se tocan los tamaños de card ni el `max-w-6xl`: la sensación de «cuadro grande con letra chica» viene de la distancia entre los dos extremos de la escala, no del ancho del contenedor.

## Risks / Trade-offs

- **[La barra inferior con 6 destinos se aprieta a 390 px]** → Tres salidas prepared en la decisión 5 y la medición es parte del grupo de verificación. La spec nueva fija el escenario de legibilidad a 375 px para que no se pase por alto.

- **[La tab «Mi huerto» desaparece y la spec la nombra]** → Se modifica `Vista única Mi Huerto con asistente modal` y `Summary of the day` en el delta, y se verifica que no queda ninguna referencia a una tab que ya no existe en el código ni en la spec.

- **[`WorkbenchModular` remontado pierde el sub-tab elegido]** → Se prueba el flujo completo de los 3 sub-tabs después del movimiento. Si el estado se pierde al desmontar, el componente pasa a recibir el sub-tab como prop controlada desde el padre en lugar de mantenerlo interno.

- **[El selector extraído rompe el modo agregar]** → El modo agregar sigue funcionando porque la especie activa llega por props en vez de por contexto local. Se prueba plantar un árbol con el selector grande, que es el camino crítico.

- **[Mover el mapa arriba cambia el peso de la pantalla en el funnel]** → Es el objetivo pedido. Se anota que el cambio es visible y que conviene mirarlo en las métricas de `useTrackedView` de `/huerto` después de publicar.

- **[El recorte de texto puede quitar información útil a quien la necesitaba]** → Se conserva lo que es dato (conteos, superficies, fechas) y se recorta lo que es explicación. El detalle del mapa queda accesible, no eliminado.

- **[`pb-24` del layout puede quedar corto con el mapa más arriba]** → El mapa arriba reduce la altura total, no la aumenta, así que el espacio inferior sigue sobrando. Se verifica en la auditoría que el último bloque queda accesible sobre la barra fija.