# add-multi-huerto

## Why

Crear un cultivo o árbol en `/huerto` exige ingresar "cantidad de plantas" en el alta: fricción innecesaria (siempre arrancas con 1 y ajustas después, pero hoy no hay ni forma de ajustar después). Además el mapa de `/perfil` solo permite **un** polígono (columna única `perfiles.terreno_geojson`), no muestra coordenadas del huerto, y `/huerto` no tiene ninguna vinculación con ese mapa.

## What Changes

- **Entidad `gf_huertos` (nueva)**: cada polígono dibujado en el mapa es un huerto con nombre, GeoJSON y superficie (migración `0020_gf_huertos.sql` con migración de datos desde `perfiles.terreno_geojson`, que queda deprecado).
- **Mapa multi-huerto**: se pueden dibujar, editar y borrar varios polígonos; cada uno se guarda al cerrarlo (autosave por evento).
- **Coordenadas**: cada huerto muestra su centro (lat/lng a 5 decimales) con botón de copiar, junto a la superficie; línea del mapa muestra "N huertos · superficie total".
- **Nombres auto + editables**: el primer polígono se llama "Mi huerto", los siguientes "Huerto N"; renombrado inline desde la lista.
- **Alta sin cantidad**: `agregarCultivo` / `agregarArbol` insertan `cantidad: 1` por defecto; el campo desaparece de los formularios.
- **Edición posterior de cantidad**: nuevo stepper +/− (y edición directa del número) en `ListaCultivos` y `ListaArboles`; nueva action `actualizarCultivo`; `actualizarArbol` pasa a patch parcial (no borra campos no enviados).
- **Vinculación visual**: card "Tu terreno" en `/huerto` con huertos (nombre, superficie, coordenadas) y CTA al mapa de `/perfil`.
- **Freemium**: plan gratuito limitado a 1 huerto; Huertero+ ilimitado (coherente con "Huertos ilimitados" del plan pago). Upsell toast con CTA a `/pricing`.
- **`perfiles.superficie_m2`** pasa a ser la suma de los huertos (la mantienen las actions; telemetría/audiencias siguen consumiéndola sin cambios).

## Capabilities

### Modified Capabilities

- `garden/terreno`: polígono único → N huertos persistentes en `gf_huertos` con nombre, autosave por evento, coordenadas del centro y límite freemium.
- `garden/huerto`: alta de cultivos/árboles sin cantidad (default 1) + edición posterior de cantidad; card de vinculación con el terreno.

## Impact

- **DB**: migración `0020_gf_huertos.sql` (tabla + RLS + data migration desde `perfiles.terreno_geojson`; columna deprecada, no se borra).
- **Código**: `lib/huerto/terreno.ts` (+`terrenoCentro`, `formatCoordenadas`), `lib/huerto/huertos.ts` (nuevo), `lib/huerto/actions.ts` (+`actualizarCultivo`, patch parcial en `actualizarArbol`), `lib/huerto/data.ts` (+`getHuertos`), `lib/payments/plans.ts` (+`huertos`), `components/perfil/*`, `components/huerto/*`, `app/(dashboard)/huerto/page.tsx`, `app/(dashboard)/perfil/page.tsx`.
- **Tests**: `tests/freemium.test.ts` (límite huertos), `tests/terreno.test.ts` (centroide + coordenadas).
- **Sin PostGIS**: jsonb igual que 0017; sin consultas espaciales reales.
