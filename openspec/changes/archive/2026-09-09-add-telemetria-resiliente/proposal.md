## Why

El identificador de dispositivo del sistema telemétrico vive únicamente en `localStorage` (`lib/telemetry/device.ts`) y el esquema de ingestión lo exige obligatorio. En navegadores que bloquean o evictan almacenamiento (Safari ITP, Brave, modos privados, iOS) el deviceId se pierde o se regenera en cada visita, y en los peores casos la ingestión falla por validación Zod → el core del modelo ad-tech (audiencias, atribución de ads) queda ciego justo en los navegadores más usados del segmento móvil chileno. La futura app móvil (RN/Expo) consume los mismos endpoints y necesita un contrato de identidad claro.

## What Changes

- **Escalera de identidad** en el cliente (`lib/telemetry/device.ts`): localStorage → cookie `gf_did` emitida por el servidor (first-party, httpOnly) → huella determinista **solo con consentimiento `deviceLinking`** → sesión efímera. Si solo queda la opción efímera, el cliente **omite** el deviceId (evita contaminar audiencias con identificadores desechables).
- **Resolución server-side en `/api/v1/telemetry`**: `deviceId` pasa a ser opcional en el schema Zod; el servidor responde con: deviceId del evento → cookie `gf_did` → genera uno nuevo y lo devuelve como `Set-Cookie` (`gf_did`, httpOnly, SameSite=Lax, Secure en https, 390 días). El `user_id` de sesión (ya existente) es la primera línea de identidad y sobrevive a cualquier bloqueo.
- **Huella determinista** (`huellaDispositivo`): hash sincrónico (FNV-1a x2) de UA + pantalla + idioma + zona horaria con sal fija de la app, solo cuando hay `deviceLinking` consentido y localStorage no disponible. Testable como función pura.
- **Contrato para app móvil**: `docs/api/contratos-movil.md` documentando los endpoints `/api/v1/{telemetry,cmp/consent,payments/*}`, la estrategia de identidad nativa (expo-install-id → deviceId en el payload) y la pantalla CMP nativa que consume el mismo schema.
- La degradación a inventario contextual sin señales **ya existe** (`lib/ads/sponsorships.ts:79-82`) y se verifica — no se re-implementa.

## Capabilities

### New Capabilities

- `telemetry-contratos`: contrato de ingestión multi-plataforma (web + RN) para telemetría y consentimiento — documentación con exigencias verificables (schemas compartidos, identidad nativa, auth opcional).

### Modified Capabilities

- `adtech/telemetry`: el requerimiento "Device fingerprinting" cambia — el deviceId persistente pasa a resolverse por escalera (almacenamiento local → cookie first-party server-set → huella solo con `deviceLinking` → sesión efímera) y la huella deja de atribuirse sin consentimiento explícito.

## Impact

- **Archivos nuevos**: `docs/api/contratos-movil.md`; helpers puros en `lib/telemetry/` con tests.
- **Archivos modificados**: `lib/telemetry/device.ts` (escalera), `lib/telemetry/schemas.ts` (`deviceId` opcional), `app/api/v1/telemetry/route.ts` (resolución server-side + Set-Cookie), `types/index.ts` (`deviceId?` en input de eventos).
- **Sin migraciones DB** (`device_id` sigue `not null`; el servidor garantiza valor).
- **Riesgos**: cookie `gf_did` con Max-Age 390d puede quedar huérfana de consentimiento (es un identificador técnico de ingesta bajo interés legítimo — se declara en la política de cookies, que ya lo menciona); la huella requiere `deviceLinking` y queda deshabilitada por defecto.
- **Compatibilidad**: clientes que hoy envían deviceId siguen funcionando sin cambios (prioridad al valor del evento).
