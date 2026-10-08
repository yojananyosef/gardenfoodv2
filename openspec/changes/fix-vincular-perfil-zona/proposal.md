# Proposal

## Why

La comuna del perfil no llega a las pestañas de datos. La ficha de especie resuelve la zona en tres lugares que no se hablan —un `useEffect` en `FichaEspecieView`, otro `useEffect` propio en `TabFenologia`, y un `useState` inicializado con el valor recibido en `NutricionGuia`— y los tres la leen una vez y se quedan. Dos consecuencias visibles: si el usuario abre la tab Nutrición antes de que llegue la consulta, la región queda congelada en el fallback `ZONAS[7]` para siempre; y si cambia la comuna en `/perfil` y vuelve, el calendario no la sigue porque el estado vive en el hijo. El selector de región que había en la ficha agravaba el problema: era una segunda fuente de verdad que no persistía. El socio lo reportó como «la comuna configurada no se mantiene vinculada en las pantallas de nutrición y riego».

## What Changes

- **Una sola lectura de perfil.** Se extrae `usePerfilZona()`, que consulta `perfiles` una vez, relee en `focus` y `visibilitychange` (como hoy), y expone `{ zonaId, sueloId, comuna, cargando, esDefault }`. `esDefault` distingue «el usuario no tiene comuna» del `?? 7` silencioso que hoy esconde ambos casos.
- **`TabFenologia` deja de consultar.** Recibe la zona ya resuelta por props, lo que borra una segunda query idéntica a la del padre.
- **El selector de región desaparece de la ficha.** La región se cambia en `/perfil` y en ningún otro lado. Offercerla también en la ficha daba dos lugares para cambiar lo mismo, y el de la ficha no persistía: cualquier cambio se perdía al recargar. La tab conserva solo los dos ajustes que sí le son propios y no viven en el perfil: la edad del árbol y el tipo de fertilizante.
- **La región se deriva en cada render, no se guarda en estado.** El `useState` inicializado desaparece; la región se calcula desde el `zonaId` que llega por prop, así que un cambio de comuna se refleja sin sincronizar nada.
- **`regionInicial` deja de adivinar.** Hoy, si la región del perfil no tiene programa para la especie, salta sola a la primera región que sí tenga y la ficha finge que esa era la del usuario. Pasa a devolver `null` y la vista muestra un estado vacío que dice la verdad y ofrece cambiar de región.
- **El pie de la tab dice de dónde sale la región.** El texto pasa de un `string` fijo a dos casos distinguibles: comuna configurada, y sin comuna o fuera de la guía. En los dos dice dónde se cambia.
- **BREAKING (a nivel de comportamiento, no de API):** una especie sin guía calibrada para la comuna del usuario ya no muestra datos de otra región. Muestra un estado vacío con acción. Es lo que pidió el socio («sin que se desconfigure»), pero el usuario lo nota.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/especies`: la región de la guía deja de resolverse con un inicializador de estado congelado y pasa a derivarse de la comuna del perfil; la ficha deja de ofrecer un selector de región, que era una segunda fuente de verdad sin persistir. La ficha dice la verdad cuando la guía no cubre la zona del usuario en vez de mostrar otra región como si fuera la suya.
- `garden/agronomy-data`: la resolución de zona deja de ser un `?? 7` opaco. Los consumidores que dependen de la zona pueden distinguir «sin comuna configurada» de «comuna resuelta», para que el fallback sea visible en vez de silencioso.

## Impact

- **Código**: `hooks/usePerfilZona.ts` (nuevo), `components/especies/FichaEspecieView.tsx` (usa el hook, pasa props reales, borra su `useEffect`), `components/especies/NutricionGuia.tsx` (`regionDelPerfil` con `null`, sin selector de región, pie por caso), `lib/agronomy/index.ts` (`resolverZonaDeComuna` con `esDefault`).
- **Tests**: `tests/vinculacion-zona.test.ts` (nuevo) para `regionDelPerfil` con comuna sin cobertura, la resolución de región visible (con y sin comuna) y el pie.
- **Sin migraciones de DB**: se sigue leyendo `perfiles.comuna` y `perfiles.tipo_suelo`.
- **Sin dependencias nuevas.**
- **Riesgo**: la ficha de especie se monta en dos sitios (`/especies/[slug]` público y el dialog de `FichaEspecieSheet` en el huerto). El hook es cliente y los dos ya lo admiten, pero hay que verificar que la versión bloqueada (`locked`) no quede esperando un `cargando` que nunca llega.