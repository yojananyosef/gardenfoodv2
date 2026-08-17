## 1. Iconos y assets

- [ ] 1.1 Generar `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` (script con sharp, base del logo de marca)
- [ ] 1.2 Crear `app/icon.png` (favicon) y `app/apple-icon.png`
- [ ] 1.3 Reemplazar SVGs del template en `public/` si no se usan

## 2. Manifest y metadata

- [ ] 2.1 Crear `app/manifest.ts` con name, short_name, description, start_url, display standalone, theme/background color e icons
- [ ] 2.2 Actualizar metadata del root layout: `themeColor`, `appleWebApp`, icons

## 3. Service worker

- [ ] 3.1 Crear `public/sw.js` (CACHE_VERSION, precache del shell, network-first navegación, stale-while-revalidate assets, cleanup en activate)
- [ ] 3.2 Crear `public/offline.html` de respaldo
- [ ] 3.3 Registrar el SW desde el layout raíz (solo producción, client)

## 4. Verificación

- [ ] 4.1 Lighthouse: manifest válido, SW con fetch handler, HTTPS, instalable
- [ ] 4.2 Test offline: rutas principales abren sin red; ruta no cacheada cae al fallback
- [ ] 4.3 Test de actualización: nuevo deploy borra caché vieja y sirve la nueva
- [ ] 4.4 `openspec validate pwa-install` + typecheck + lint
- [ ] 4.5 Commit + push + deploy Vercel