## Why

Los usuarios hoy definen su huerto solo con un texto de comuna (`perfiles.comuna`), sin forma visual de ubicar ni delimitar su terreno. Para funcionalidades futuras (superficie real, zonificación de cultivos, clima local) se necesita que el usuario pueda ver su ubicación sobre un mapa satelital y dibujar el polígono de los bordes de su terreno. La solución debe ser 100% gratuita, open source y sin límites de uso: Leaflet.js + Leaflet-Geoman con teselas de OpenStreetMap y ESRI World Imagery.

## What Changes

- Nuevo componente de mapa interactivo (client-only) en la sección Perfil → Ubicación: mapa base OpenStreetMap + capa satelital ESRI World Imagery conmutables.
- Centrado automático en la ubicación aproximada del usuario (geolocalización del navegador con fallback a comuna guardada / centro de Chile).
- Herramienta de dibujo de polígono (Leaflet-Geoman free) para que el usuario trace los bordes de su terreno; edición y borrado del polígono existente.
- Cálculo de superficie aproximada en m² desde el polígono dibujado.
- Persistencia del polígono como GeoJSON en una nueva columna `terreno_geojson` de `perfiles` (RLS ya existente por `user_id`), junto con la superficie calculada en `superficie_m2`.
- Nuevas dependencias: `leaflet`, `@geoman-io/leaflet-geoman-free`, `@types/leaflet` (dev). Sin claves API ni servicios pagos.

## Capabilities

### New Capabilities
- `garden/terreno`: Visualización de la ubicación del usuario en mapa y definición/edición/persistencia del polígono que delimita los bordes de su terreno.

### Modified Capabilities

## Impact

- **DB**: nueva migración `0017_perfil_terreno.sql` — columna `perfiles.terreno_geojson jsonb` (validada por check ligero), sin tocar RLS existente (políticas de `0006_rls_policies.sql` ya cubren `perfiles`).
- **Server actions**: extensión de `lib/auth/actions.ts` (`actualizarUbicacion` o nueva acción `guardarTerreno`) con validación Zod del GeoJSON.
- **UI**: nuevo componente cliente `components/perfil/TerrenoMap.tsx`, integrado en `app/(dashboard)/perfil/page.tsx` junto a `UbicacionForm`.
- **Dependencias**: `leaflet`, `@geoman-io/leaflet-geoman-free` (MIT), tipos dev; carga client-only (Leaflet requiere `window`).
- **Sin costos**: teselas OSM (uso justo) y ESRI World Imagery gratuitas; sin límites de la app.
