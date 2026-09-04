# Tasks add-multi-huerto

## 1. Base de datos

- [x] 1.1 Migración `supabase/migrations/0020_gf_huertos.sql`: tabla `gf_huertos` (id, user_id FK cascade, nombre con check de largo, terreno_geojson jsonb con check, superficie_m2, timestamps), índice `user_id`, RLS `Users manage their huertos`, trigger `set_updated_at`.
- [x] 1.2 Data migration idempotente: `perfiles.terreno_geojson` → fila "Mi huerto"; comentarios de deprecación en `terreno_geojson` y `superficie_m2`.

## 2. Dominio y server actions

- [x] 2.1 `lib/huerto/terreno.ts`: `terrenoCentro` (centroide shoelace con fallbacks) y `formatCoordenadas` (5 decimales).
- [x] 2.2 `lib/payments/plans.ts`: `FREE_LIMITS.huertos = 1`, `puedeAgregarHuerto`, `limitesDe` con `huertos`.
- [x] 2.3 `lib/huerto/huertos.ts`: `crearHuerto` (nombre auto "Mi huerto"/"Huerto N", re-valida Zod, límite freemium, superficie), `actualizarHuerto` (nombre y/o geometría, patch parcial), `eliminarHuerto`; sincroniza `perfiles.superficie_m2` como suma; `revalidatePath` de `/perfil` y `/huerto`.
- [x] 2.4 `lib/huerto/actions.ts`: exportar `getPlanDe`; nueva `actualizarCultivo(especie, {cantidad})`; `agregarCultivo`/`agregarArbol` aceptan omitir cantidad (`z.input`); `actualizarArbol` en patch parcial.
- [x] 2.5 Eliminar `guardarTerreno` de `lib/auth/actions.ts` (reemplazado por las actions de huertos).
- [x] 2.6 `lib/huerto/data.ts` + `types/index.ts`: `getHuertos(userId)` devolviendo `HuertoResumen` (id, nombre, superficie, centro).

## 3. Mapa multi-huerto (/perfil)

- [x] 3.1 `TerrenoMap.tsx`: N capas simultáneas, dibujo siempre habilitado, `pm:create/edit/remove` mapeados a crear/actualizar/eliminar con etiqueta capa→id, confirmación de borrado con restauración de capa, línea "N huertos · superficie total", hint multi-huerto.
- [x] 3.2 `TerrenoSection.tsx`: carga `gf_huertos` + plan; lista por huerto con renombrado inline, superficie, coordenadas con copiar al portapapeles; autosave por evento; upsell al alcanzar el límite del plan gratuito.
- [x] 3.3 `app/(dashboard)/perfil/page.tsx`: copy actualizado (varios huertos).

## 4. Alta sin cantidad (/huerto)

- [x] 4.1 `AgregarCultivo.tsx` y `AgregarArbol.tsx`: sin campo cantidad (default 1 en server), microcopy del nuevo flujo.
- [x] 4.2 `ControlCantidad.tsx` (stepper +/− con edición directa del número, clamp 1–1000).
- [x] 4.3 `ListaCultivos.tsx` y `ListaArboles.tsx`: edición optimista de cantidad vía `actualizarCultivo`/`actualizarArbol`.

## 5. Vinculación visual

- [x] 5.1 Card "Tu terreno" en `/huerto`: huertos con nombre, coordenadas y superficie; CTA al mapa de `/perfil`; estado vacío con CTA de delimitar.

## 6. Specs y tests

- [x] 6.1 Delta specs `garden/terreno` y `garden/huerto` + sincronización de specs principales.
- [x] 6.2 `tests/terreno.test.ts`: centroide (cuadrado, orientación, degenerados, caso real) y `formatCoordenadas`.
- [x] 6.3 `tests/freemium.test.ts`: límite de huertos (gratuito 1, pagos ilimitados, `limitesDe`).
- [x] 6.4 `tsc --noEmit`, `eslint`, `vitest run` en verde.
