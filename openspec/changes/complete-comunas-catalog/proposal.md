# complete-comunas-catalog

## Why

El selector de comunas del landing usaba una lista propia de 52 comunas con 8 zonas groseras, y el catálogo canónico (`lib/agronomy/comunas.ts`) tenía 245 de las **346 comunas oficiales de Chile** (SUBDERE DPA / BCN / INE: 16 regiones, 56 provincias, 346 comunas). Los usuarios de ~101 comunas no podían registrarse ni ver recomendaciones, y el landing prometía "245 comunas" con un selector que ofrecía aún menos. El spec decía "254 canónicas" — un tercer número que no correspondía a nada.

## What Changes

- **Catálogo canónico completo a 346 comunas** en `lib/agronomy/comunas.ts`: 101 comunas agregadas (fuente oficial: PDF "División Político Administrativa de Chile" de SUBDERE, corregido a la estructura 16 regiones/346 comunas vigente desde la región de Ñuble 2018), cada una con `region` y `zonaId` asignado a las 20 zonas agroclimáticas existentes por geografía (costa/interior/cordillera). Se preservan los nombres ya usados (p. ej. `Paihuano`, `Llay-Llay`, `Marchigüe`, `Puerto Natales`) para no romper perfiles almacenados.
- **Fuente única de verdad**: `COMUNAS_ZONA` (`lib/agronomy/zonas.ts`) deja de ser un literal duplicado y se deriva de `COMUNAS`. Se elimina la `interface ZonaClimatica` duplicada.
- **Selector del landing completo**: `lib/landing/zonas.ts` deriva `REGIONES` (16 regiones, 346 comunas) del catálogo canónico en vez de su lista propia de 52; las tablas de tareas por mes se resuelven con `zonaLandingDe(zonaId, region)` mapeando las 20 zonas canónicas a las 9 zonas groseras del landing. `zone-widget.tsx` no cambia su API.
- **Copy alineada**: landing (stats/badges), registro ("346 comunas"), README.

## Capabilities

### Modified Capabilities

- `garden/agronomy-data`: el catálogo pasa a las **346** comunas oficiales (antes 245 en código / 254 en spec) y `COMUNAS_ZONA` queda derivado de la lista única; el selector del landing consume el catálogo completo.

## Impact

- **Código**: `lib/agronomy/comunas.ts` (regenerado), `lib/agronomy/zonas.ts` (derivación + limpieza), `lib/landing/zonas.ts` (derivación + `zonaLandingDe`), copy en `app/page.tsx` y `app/(auth)/registro/page.tsx`, tests.
- **Sin migraciones ni cambios de API**: `buscarComuna`, `getZonaIdDeComuna` y `getZonaDeComuna` mantienen contrato; las 245 comunas previas conservan su `zonaId`.
- **Riesgo bajo**: las nuevas comunas heredan zonas por contigüidad geográfica; el fallback (zona 7) sigue igual para texto no reconocido.
