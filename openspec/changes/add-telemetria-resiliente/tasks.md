## 1. Escalera de identidad (cliente)

- [x] 1.1 En `lib/telemetry/device.ts`: refactorizar a `resolverDeviceIdLocal()` que devuelve `{ deviceId: string | null, fuente: "almacenamiento" | "huella" | "efimero" }` — localStorage válido → `"almacenamiento"`; sin storage pero con `getConsentPurpose("deviceLinking")` → huella determinista `"huella"`; si no → `null` (efímero, el cliente omite el id). `getDeviceId()` mantiene compatibilidad devolviendo string (para CMP/ads que exigen id) usando fallback de sesión — verificar revisión
- [x] 1.2 Crear `lib/telemetry/huella.ts` con `huellaDispositivo(partes: { userAgent, pantalla, idioma, zonaHoraria })` (FNV-1a doble ronda → hex 16 chars, sal fija `"gf-v1"`) — verificar con tests en `tests/telemetry-identidad.test.ts` (determinismo, sensibilidad a partes, formato)
- [x] 1.3 En `lib/telemetry/tracker.ts`: usar `resolverDeviceIdLocal()` y omitir `deviceId` cuando es null (el input lo admite) — verificar `pnpm typecheck`

## 2. Resolución server-side (ingestión)

- [x] 2.1 Crear `lib/telemetry/resolucion.ts` con `resolverDeviceIdServidor({ deviceIdEvento, cookieDid, nuevoId })` → `{ deviceId, setCookie: string | null }` (evento tiene prioridad; luego cookie; luego genera y emite `Set-Cookie`) — verificar tests en `tests/telemetry-identidad.test.ts` (3 caminos + prioridad)
- [x] 2.2 En `lib/telemetry/schemas.ts`: `deviceId` pasa a opcional (`z.string().min(1).max(200).optional()`) — verificar tests de schemas existentes siguen verdes
- [x] 2.3 En `app/api/v1/telemetry/route.ts`: leer cookie `gf_did`, componer `resolverDeviceIdServidor`, escribir `Set-Cookie` en la respuesta (httpOnly, SameSite=Lax, Secure si https, Max-Age 390d, Path=/) y usar el id resuelto en todas las filas — verificar con curl (POST sin deviceId → 200 + Set-Cookie; con cookie reutiliza; con deviceId no reescribe)

## 3. Contrato móvil

- [x] 3.1 Crear `docs/api/contratos-movil.md`: endpoints `POST /api/v1/telemetry`, `POST /api/v1/cmp/consent`, `POST /api/v1/payments/{subscribe,subscribe/status}` con método, auth, ejemplos de payload validados contra el schema y estrategia de deviceId nativa (install-id estable) — verificar que los ejemplos pasan los schemas con un test que los importa

## 4. Verificación integral

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test` en verde — verificar salida limpia
- [x] 4.2 Smoke en dev: batch de telemetría con y sin deviceId vía curl; cookie persiste entre llamadas; página carga sin errores de ingestión — verificar en logs/curl
