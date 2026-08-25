## Context

App Next.js 16 (App Router, React 19) + Supabase con RLS. El perfil (`perfiles`) ya guarda `comuna`, `region`, `superficie_m2` y `tipo_huerto`; la UI de ubicación es un formulario de texto en `components/perfil/UbicacionForm.tsx` que llama a la server action `actualizarUbicacion` de `lib/auth/actions.ts`. No existe ninguna dependencia de mapas. Restricción dura: solución 100% gratuita y open source, sin claves API ni límites de uso.

Nota Next.js: esta versión rompe convenciones conocidas; antes de implementar, verificar en `node_modules/next/dist/docs/` el patrón vigente para componentes client-only con librerías que requieren `window` (Leaflet).

## Goals / Non-Goals

**Goals:**
- Mapa client-only con capas base OSM y ESRI World Imagery conmutables.
- Dibujo/edición/borrado de polígono del terreno con plugin mantenido.
- Persistencia GeoJSON por usuario + superficie m² derivada.
- Cero credenciales en cliente; bundle del mapa cargado solo donde se usa.

**Non-Goals:**
- PostGIS / consultas espaciales en servidor (solo almacenamiento GeoJSON).
- Dibujar múltiples polígonos, hoyos o formas libres (una sola geometría por usuario).
- Reverse geocoding automático de coordenadas a comuna (la comuna sigue siendo texto manual).
- Offline-first completo del mapa (las teselas necesitan red; ver riesgos).

## Decisions

1. **Plugin de dibujo: Leaflet-Geoman free (`@geoman-io/leaflet-geoman-free`) en vez de Leaflet.draw.**
   Leaflet.draw está abandonado (sin mantenimiento desde ~2017) y falla con Leaflet 1.9+ (regresiones conocidas de eventos y CSS). Geoman free es MIT, activamente mantenido, API moderna (`map.pm.enableDraw('Polygon')`), incluye edición/drag/removal listos. Alternativa descartada: leaflet-draw forks (no garantizan mantenimiento). Costo cero.

2. **Teselas: OSM standard + ESRI World Imagery vía URL pública, sin proveedor intermedio.**
   - Calles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (uso justo OSM; atribución obligatoria).
   - Satélite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (público, gratuito para uso ligero, atribución Esri).
   Alternativas descartadas: MapLibre+estilos vectoriales (más complejo de lo necesario), Google Maps (requiere clave/facturación), Mapbox (límite gratuito + token).

3. **Almacenamiento: columna `terreno_geojson jsonb` en `perfiles` en lugar de tabla nueva o `geography`.**
   Una sola geometría por usuario, sin consultas espaciales → jsonb basta y evita habilitar PostGIS. Estructura: objeto Feature GeoJSON `{type:'Feature', properties:{}, geometry:{type:'Polygon', coordinates:[[[lng,lat]...]]}}`. La superficie calculada se persiste en la columna existente `superficie_m2` (coherente con su uso actual en telemetría). Alternativa descartada: tabla `gf_terrenos` 1-N (YAGNI) y PostGIS (peso extra sin consulta espacial real).

4. **Validación Zod compartida cliente/servidor del GeoJSON.**
   Schema en `lib/auth/validation.ts`: Polygon con ≥1 anillo, anillo exterior con ≥4 posiciones (cerrado: primera=última), lng ∈ [-180,180], lat ∈ [-90,90], máx. ~500 posiciones por anillo y área máxima razonable (p.ej. 10 km²) como cota anti-basura. Server action re-valida (el cliente no es confiable).

5. **Cálculo de área geodésica sin dependencias nuevas.**
   Fórmula esférica de exceso (shoelace geodésico, misma usada por `L.GeometryUtil.geodesicArea`) en util propia `lib/huerto/terreno.ts` (~15 líneas, testeable con Vitest). Alternativa descartada: Turf.js (~100 kB solo para un número) o Leaflet.GeometryUtil (dep extra).

6. **Componente client-only con carga diferida.**
   `TerrenoMap.tsx` marcado `"use client"`; import dinámico de `leaflet`, Geoman y su CSS dentro de `useEffect` (evita `window is not defined` en SSR sin depender de `next/dynamic ssr:false`, cuyo soporte debe verificarse contra los docs locales de Next 16). El bloque mapa solo se renderiza en `/perfil`.

7. **Geolocalización con cascada de fallback.**
   `navigator.geolocation.getCurrentPosition` → si falla/deniega: centro por defecto definido en constante app-level (Chile continental aproximado, zoom país). No se intenta geocodificar la comuna de texto (evita depender de Nominatim con sus límites de uso desde el cliente). Marcador de "ubicación aproximada" separado del polígono.

8. **Persistencia vía server action nueva `guardarTerreno(geojson | null)` en `lib/auth/actions.ts`.**
   Null = borrado. Actualiza `terreno_geojson` y `superficie_m2` (calculada en servidor con la misma util) en una transacción implícita de un UPDATE. Reutiliza patrón de `actualizarUbicacion` (retorno `{error}`, toast en cliente).

## Risks / Trade-offs

- [Uso justo OSM/Esri: las teselas públicas pueden degradarse ante abuso] → Atribución visible obligatoria, zoom máximo acotado (≤19), y capa base encapsulada en un módulo único para poder cambiar proveedor sin tocar UI.
- [Bundle de Leaflet+Geoman (~150 kB gz con CSS)] → Import dinámico solo en `/perfil`; el resto de la app no paga el costo.
- [jsonb sin validación estructural en DB] → Validación Zod estricta en server action; check DB ligero (`terreno_geojson IS NULL OR jsonb_typeof(...)='object'`) como última línea de defensa.
- [Área geodésica aproximada (esfera vs elipsoide WGS84)] → Error <0.3% a escalas de huerto; suficiente para `superficie_m2` informativo.
- [Precisión de geolocalización del navegador (WiFi/IP puede errar kilómetros)] → Se presenta como "ubicación aproximada"; el centrado es ayuda, no dato guardado.
- [Next 16 cambia APIs de carga client-only] → Verificar docs en `node_modules/next/dist/docs/` al iniciar apply; el diseño usa `useEffect` + import dinámico puro, independiente de APIs de framework.

## Migration Plan

1. Migración `0017_perfil_terreno.sql`: `ALTER TABLE public.perfiles ADD COLUMN terreno_geojson jsonb CHECK (terreno_geojson IS NULL OR jsonb_typeof(terreno_geojson) = 'object');` — aditiva, sin lock destructivo, compatible con código desplegado (columna nullable ignorada por código viejo).
2. Deploy de código (acción + UI). Rollback: revertir deploy; la columna queda inofensiva. Para revertir todo: `ALTER TABLE perfiles DROP COLUMN terreno_geojson;`.

## Open Questions

Ninguna que bloquee: la comuna sigue siendo texto libre; si más adelante se quiere sincronizar comuna↔polígono, será un cambio nuevo.
