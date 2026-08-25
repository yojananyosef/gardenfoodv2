## 1. Preparación

- [x] 1.1 Leer `node_modules/next/dist/docs/` sobre componentes client-only / carga de librerías que requieren `window` en esta versión de Next y confirmar el patrón (design decisión 6)
- [x] 1.2 Instalar dependencias: `pnpm add leaflet @geoman-io/leaflet-geoman-free` y `pnpm add -D @types/leaflet`

## 2. Base de datos

- [x] 2.1 Crear migración `supabase/migrations/0017_perfil_terreno.sql` con columna `perfiles.terreno_geojson jsonb` + check ligero (design migración)
- [x] 2.2 Aplicar migración al proyecto Supabase y verificar que las políticas RLS existentes de `perfiles` siguen cubriendo lectura/escritura de la nueva columna

## 3. Lógica de dominio y validación

- [x] 3.1 Crear schema Zod del GeoJSON Polygon (`lib/auth/validation.ts` o archivo equivalente del proyecto): anillo cerrado ≥4 posiciones, rangos lng/lat, cotas máximas
- [x] 3.2 Implementar `lib/huerto/terreno.ts`: util geodésica de área (m²) desde coordenadas GeoJSON y helpers de conversión Leaflet layer ↔ Feature GeoJSON

## 4. Server action

- [x] 4.1 Agregar `guardarTerreno(geojson: unknown | null)` a `lib/auth/actions.ts`: re-valida Zod, calcula superficie en servidor, hace UPDATE de `terreno_geojson` + `superficie_m2`, retorna `{error}`; null borra ambos campos
- [x] 4.2 Verificar aislamiento por usuario (usa sesión auth, nunca `user_id` del cliente)

## 5. UI del mapa

- [x] 5.1 Crear `components/perfil/TerrenoMap.tsx` ("use client"): init Leaflet en `useEffect` con import dinámico de JS+CSS, capas base OSM y ESRI World Imagery con control de capas y atribuciones obligatorias
- [x] 5.2 Centrado: geolocalización del navegador con marcador aproximado; fallback a centro por defecto (design decisión 7); zoom máx ≤19
- [x] 5.3 Integrar Geoman: toolbar dibujo/edición/borrado de polígono, cancelación de trazado en curso, bloqueo de más de un polígono
- [x] 5.4 Cargar polígono persistido al montar (fetch `terreno_geojson` por usuario) y renderizarlo editable
- [x] 5.5 Mostrar superficie m² calculada en vivo mientras se dibuja/edita (usando util del paso 3.2) con aviso de "aproximada"

## 6. Integración en Perfil

- [x] 6.1 Agregar sección "Terreno" en `app/(dashboard)/perfil/page.tsx` junto a `UbicacionForm`, con botón Guardar que llama `guardarTerreno` vía transition + toasts sonner (éxito/error), y estado vacío guiando al usuario a delimitar su huerto
- [x] 6.2 Al borrar polígono y guardar, confirmar borrado y limpiar `superficie_m2` en la vista

## 7. Calidad y verificación

- [x] 7.1 Tests Vitest para validador Zod (casos: válido, <3 vértices, anillo abierto, fuera de rango, exceso de posiciones/área) y para cálculo de área (polígono de área conocida)
- [x] 7.2 Verificación manual en dev: permisos concedidos/denegados de geolocalización, cambio de capa base, dibujo→guardar→recargar→editar→guardar→borrar→guardar
- [x] 7.3 Ejecutar `pnpm lint && pnpm typecheck && pnpm test` sin errores
