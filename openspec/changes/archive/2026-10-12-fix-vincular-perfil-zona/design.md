# Design

## Context

Tres lecturas independientes de `perfiles` conviven hoy en la ficha de especie, todas cliente, todas de una sola vez:

- `components/especies/FichaEspecieView.tsx:562-586` — un `useEffect` con `[]` que lee `comuna` y `tipo_suelo`, más listeners de `focus` y `visibilitychange`.
- `components/especies/FichaEspecieView.tsx:413-431` (`TabFenologia`) — su propio `useEffect` con deps `[dbKey]`, que vuelve a consultar `perfiles.comuna`.
- `components/especies/NutricionGuia.tsx:508` — `useState(() => regionInicial(dbKey, zonaId))`. El inicializador corre **solo** en el montaje.

Ese último punto es la raíz del bug. `TabFenologia` se salva porque su effect depende de `dbKey`; `NutricionGuia` no, porque su inicializador no vuelve a correr nunca.

La consecuencia observable: el usuario abre la ficha, navega a Nutrición antes de que resuelva la query, y `regionInicial` recibe `zonaId = null` → `ZONAS[7]` → Santiago-RM. Cuando llega la zona real, el estado ya quedó congelado. Pasa en cada carga y en cada retorno del navegador.

Encima hay un segundo problema, más difícil de ver: `regionInicial` (`:498-505`) implementa un fallback silencioso. Si la región del perfil no tiene programa para la especie, salta a `candidatas.find((r) => guiaRegional(dbKey, r, "suelo"))` — la primera región que sí tenga. El calendario se repinta con esa región y el pie dice «Región y árbol salen de tu perfil», que es falso.

Restricciones que moldean el enfoque:
- `FichaEspecieView` es `"use client"` y se monta en dos sitios: `/especies/[slug]` (público, con `locked`) y el dialog de `FichaEspecieSheet` desde `/huerto`. El caso bloqueado renderiza los tabs igual, bajo un blur, así que no puede quedar esperando un `cargando` que no termina.
- La CSP de `proxy.ts` usa nonce; `next-themes` ya se conectó con nonce para su script. No aplica aquí: esto no agrega scripts.
- No se agregan dependencias. `hooks/` hoy solo tiene telemetría y ads; un hook de perfil es un patrón nuevo ahí pero no una dependencia.

## Goals / Non-Goals

**Goals:**
- Una sola query de perfil por ficha, releída en `focus`/`visibilitychange` como hoy.
- Que la región del calendario se derive de un valor, no de un inicializador congelado en el montaje.
- Que el estado vacío por falta de guía sea honesto: sin datos de otra región.
- Que el fallback de zona sea identificable desde la interfaz.

**Non-Goals:**
- No cambia el modelo de datos. Se sigue leyendo `perfiles.comuna` y `perfiles.tipo_suelo`. Sin migración.
- No rediseña la tab. Los textos de fertilizante y los títulos de momento son otro change (`fix-textos-nutricion`).
- No toca `/huerto` ni el orden de la pantalla principal (`fix-huerto-ir-al-grano`).
- No unifica los tres `useEffect` en un provider de React Context. Ver decisión 4.

## Decisions

### 1. `usePerfilZona()` en `hooks/`, no en `lib/`

El hook devuelve `{ zonaId, sueloId, comuna, cargando, esDefault }`. `esDefault` sale de que `getZonaIdDeComuna` no encuentre la comuna, no de comparar contra `7` — comparar contra el id del fallback sería frágil si algún día cambia la zona neutra.

Se pone en `hooks/` y no en `lib/huerto/data.ts` porque `data.ts` es server-only: usa el cliente de servidor de Supabase, y el hook necesita el cliente de navegador. La frontera de `hooks/` es la que ya separa código cliente de `lib/`.

**Alternativa descartada:** leer el perfil en el server component padre y pasarlo como prop inicial. Se descartó porque el comportamiento de "volver con atrás desde `/perfil` sin recargar" depende de re-leer en `focus`, que un server component no puede hacer sin recargar la página. Es justamente el caso que reportó el socio.

### 2. `regionInicial` devuelve `null` en vez de la primera región que sirva

Cambio deliberado de comportamiento, ya marcado como BREAKING en el proposal. La firma pasa a `string | null` y el llamador distingue tres casos: guía presente, sin guía para la región del perfil, y guía presente solo en otra región.

**Alternativa descartada:** mantener el salto automático pero avisando con un banner. Se descartó porque el calendario sigue mostrando el mes equivocado con el color equivocado en la fila equivocada; un aviso encima de datos de otra región es peor que un vacío honesto. El socio lo pidió explícitamente: «sin que se desconfigure».

### 3. Sin selector de región en la ficha

La región se cambia en `/perfil` y en ningún otro lado. El selector que había en `PanelAjuste` se elimina.

El motivo no eslakitud sino que era una segunda fuente de verdad que no persistía: se guardaba en `useState` de la tab, así que cualquier región elegida a mano se perdía al recargar o al cambiar de pestaña. Peor: el pie decía «Región y árbol salen de tu perfil», que era falso cuando la región visible venía de esa elección. El usuario perdía la elección y la app le había dicho que no la había hecho.

Con el selector fuera, la ficha conserva los dos ajustes que sí le son propios y no viven en el perfil: la edad del árbol y el tipo de fertilizante.

**Alternativa descartada:** mantener el selector y persistirlo. Se descartó porque es una preferencia de visualización, no un dato del cultivo, y guardarla en la DB obligaría a migrar, a decidir su caducidad y a resolver el conflicto con la comuna. Si alguien quiere ver el programa de otra región, configura otra comuna.

### 3b. Sin estado para la región: se deriva en cada render

`regionDelPerfil(dbKey, zonaId)` se evalúa en el cuerpo del componente. No hay `useState` para la región, ni `useEffect` que la sincronice cuando cambia el `zonaId`. Como la prop llega del hook que ya relee el perfil, un cambio de comuna se refleja solo.

La función `regionVisible` distingue los dos casos de «no hay región», que es la parte que evita volver a mentir:

- Sin comuna configurada: cae en la región central y el pie lo declara como supuesto.
- Con comuna pero sin guía para esa combinación: devuelve `null` y no hay programa al que caer, así que se muestra el estado vacío.

Este segundo caso se encontró recorriendo la app con sesión real, después de implementar. Con comuna Temuco (región Sur, sin guía para duraznero) el calendario seguía pintando el programa de Santiago mientras el pie decía que la comuna no estaba en la guía: exactamente la contradicción que el change vino a eliminar. La causa era un fallback a la región central aplicado sin distinguir «no sé dónde estás» de «sé dónde estás y ahí no hay guía».

### 4. Sin Context: props explícitas de `FichaEspecieView` hacia abajo

`FichaEspecieView` llama al hook una vez y pasa `zonaId`/`sueloId` a `TabRiego`, `TabFenologia`, `NutricionGuia` y `TabInfo` como props. `TabFenologia` borra su effect y su estado.

Contexto descartado por dos razones: la ficha tiene un solo consumidor de zona (el propio `FichaEspecieView`), así que un provider no compra nada; y meterlo en contexto haría que un cambio de comuna re-renderice toda la ficha, incluido el `useTrackedView` que reporta la vista a la telemetría —ruido en las métricas de `VIEW_FICHA`.

### 5. La carga se resuelve antes del primer render de datos, no con un spinner

Mientras `cargando` es `true`, las tabs que dependen de zona renderizan un estado de carga de una línea. El caso `locked` importa: bajo el blur, un «Cargando tu zona…» visible cambiaría la línea base de lo que el usuario ve en la versión bloqueada de SEO. Se verifica que ese estado no altera el texto renderizado en el HTML inicial.

## Risks / Trade-offs

- **[El comportamiento visible cambia para especies sin guía en la comuna del usuario]** → Es el objetivo, pero es un cambio que el usuario nota: antes veía dosis, ahora ve un vacío. Mitigación: el estado vacío ofrece cambiar de región, y la decisión quedó confirmada con el usuario antes de implementar.

- **[La ficha congelada (`locked`) podría renderizar un estado de carga donde antes renderizaba datos]** → Se compara el HTML de `/especies/[slug]` para una especie bloqueada antes y después. Si cambia, el estado de carga se resuelve a un valor por defecto sin esperar la query en el render del servidor.

- **[Un hook nuevo en `hooks/` sin precedente en el repo]** → `hooks/` tiene cuatro hooks de telemetría y ads; ninguno lee Supabase. Se mantiene el hook en un archivo propio y con el comentario explicando por qué es cliente, para que no se confunda con `data.ts`.

- **[Un usuario que vivía mirando otra región pierde esa vista]** → Es el comportamiento pedido. Antes tampoco la conservaba: el selector no persistía, así que la elección se perdía igual. Quien necesite ver otra región cambia la comuna en `/perfil`.

- **[Riesgo de carrera si la query es lenta y el usuario navega entre tabs rápido]** → Con la decisión 5 el calendario no muestra datos hasta que hay zona resuelta, así que no hay estado intermedio que congele nada.