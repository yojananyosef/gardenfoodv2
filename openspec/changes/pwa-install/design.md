# pwa-install — Design

## Context

Next.js 16 (App Router) en Vercel. No hay manifest, iconos de marca ni service worker hoy; `public/` solo tiene los SVG del template. El root layout ya define metadata básica (`lang="es"`, título). Vercel sirve la app sobre HTTPS (requisito de los service workers).

## Goals / Non-Goals

**Goals:**
- App instalable (manifest + iconos + theme-color) y shell de navegación offline.
- Sin dependencias nuevas: API estándar de service workers y archivos estáticos en `public/`.

**Non-Goals:**
- No implementar sincronización offline de datos de usuario (cultivos, tareas): la PWA es un puente hacia la app nativa, no una app offline-first de datos.
- No usar `next-pwa`: en App Router moderno se registra el SW manualmente y se sirve como archivo estático; `next-pwa` añade complejidad de build y Service Worker precache sin valor extra aquí.
- No cambiar la capa adtech/telemetría.

## Decisions

### D1. Manifest vía `app/manifest.ts`

Exportar un `Manifest` tipado desde `app/manifest.ts` (Next genera `manifest.webmanifest`). Declara: name "GardenFood", short_name "GardenFood", description, start_url `/`, display `standalone`, background_color y theme_color de la paleta (verde bosque `#2E6B3A` aprox.), icons 192/512 + maskable.

- **Por qué**: es la vía nativa de App Router, tipada y sin archivos duplicados.
- **Alternativa**: `public/manifest.json` — descartada por perder tipado y el manejo de Vercel de rutas.

### D2. Iconos estáticos en `public/`

Se generan `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` y `apple-touch-icon.png` desde el logotipo de la marca (hay logo en el legacy `ASSETS/IMG/logo.png` como referencia). Se añaden también `app/icon.png` (favicon) y `app/apple-icon.png` para las metadata convencionales.

- **Por qué**: los iconos son estáticos; servirlos desde `public/` es lo más simple y cacheable.
- **Riesgo**: generar PNGs requiere tooling (p.ej. sharp) — se crea un script de generación o se usan los PNGs de menor tamaño del legacy como base y se sube a 192/512 con un comando de imagen; si no hay herramienta, se genera un icono simple SVG→PNG programático.

### D3. Service worker manual en `public/sw.js`

SW en `public/sw.js` (estático, servido por Vercel) con:
- `install`: precache del shell (rutas de navegación: `/`, `/explorar`, `/calculadoras`, `/registro`, `/login`, y las del dashboard) con `CACHE_VERSION` en el nombre.
- `fetch`: network-first para navegaciones con fallback a cache y al `offline.html` si no está; stale-while-revalidate para assets estáticos.
- `activate`: borrar cachés con versiones antiguas y `clients.claim()`.
- `offline.html` de respaldo en `public/`.

Registro desde el root layout: en un cliente (`useEffect`) solo en producción, con `navigator.serviceWorker.register('/sw.js')`.

- **Por qué**: control total, sin capa de build extra; el SW es pequeño y estable.
- **Nota**: en desarrollo el SW no se registra (evita cachés molestos en `next dev`).

### D4. Navegación precachada del dashboard

Las rutas del dashboard (`/huerto`, `/calendario`, `/cosechas`) se precachean por su URL de navegación aunque requieran sesión: el shell HTML se sirve y el contenido se revalida cuando hay red. No se cachean datos de API (respuestas JSON de Supabase) — solo el shell.

- **Por qué**: cumple la spec de "shell" sin arriesgar datos de sesión de usuarios.

## Risks / Trade-offs

- **[SW cachea contenido stale]** → Mitigación: cache versionado + borrado en activate; network-first para navegación.
- **[Manifest/theme-color no coinciden con marca]** → Mitigación: usar los tokens de `globals.css`; validar con Lighthouse.
- **[Generación de PNGs sin tooling]** → Mitigación: script de generación con sharp (devDependency) ejecutado una vez y commit de los PNGs.
- **[SW en dev rompe HMR]** → Mitigación: registro solo en producción (`process.env.NODE_ENV`).

## Migration Plan

1. Iconos en `public/` (script de generación + commit de PNGs).
2. `app/manifest.ts` + `app/icon.png` + `apple-icon.png`.
3. `public/sw.js` + `public/offline.html`.
4. Registro del SW en el layout raíz (solo producción).
5. `theme-color`/metadata en layout.
6. Verificación: Lighthouse (instalabilidad, SW), prueba de modo offline en el navegador, test de borrado de caché entre deploys.
7. Commit + push + deploy.

Rollback: quitar el registro del SW y el manifest; Vercel sirve la app sin cambios estructurales. El SW puede dejarse con `skipWaiting: false` + borrado de caché en `activate` para no forzar a usuarios a una versión stale.

## Open Questions

_Ninguna._