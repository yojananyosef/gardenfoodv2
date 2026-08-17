# pwa-install

## Why

Los usuarios beta de GardenFood son agricultores domésticos que usan sus teléfonos, a menudo en zonas rurales con mala conexión. Mientras se compila la app nativa (App Store / Google Play), una PWA instalable les da acceso directo desde el home screen con carga offline básica y experiencia full-screen, sin pasar por una tienda.

## What Changes

- **Manifest web app**: `app/manifest.ts` (o `public/manifest.json`) con nombre, descripción, iconos, `display: standalone`, tema y colores de la marca.
- **Iconos PWA**: iconos en múltiples tamaños (192, 512, maskable) y apple-touch-icon, reemplazando el favicon por defecto.
- **Service worker**: registro de un SW que cachea el shell de la app (navegación) para arranque offline de rutas principales, con estrategia network-first para rutas y stale-while-revalidate para assets.
- **Metadata**: actualizar `theme-color` y metadata del layout raíz.
- **Verificación de instalabilidad**: criterios de Lighthouse (manifest válido, SW con fetch handler, HTTPS).

## Capabilities

### New Capabilities

- `pwa/installable`: la aplicación es instalable como PWA con manifest, iconos, theme-color y metadatos correctos.
- `pwa/offline-shell`: la aplicación registra un service worker que permite arrancar el shell principal (navegación básica) sin conexión y actualiza en segundo plano cuando vuelve la red.

### Modified Capabilities

_Ninguna._

## Impact

- **Código**: `app/manifest.ts`, `public/` (iconos), SW en `public/sw.js` (o `app/sw.ts`), registro en el layout raíz, `app/icon.*`/`apple-icon.*`.
- **Dependencias**: sin librerías nuevas (se usa la API estándar de service worker y `next-pwa` no es necesario en Next 16; el registro es manual).
- **Caché**: un nuevo bucket de caché de navegación; el SW debe invalidar viejas versiones (versionado del nombre de caché).
- **Adtech/telemetría**: el SW no interactúa con telemetría; no cambia requisitos existentes.