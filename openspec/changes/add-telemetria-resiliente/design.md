## Context

`lib/telemetry/device.ts` usa solo `localStorage` (recrear con `crypto.randomUUID` si falta). El schema Zod exige `deviceId: min(1)` (lib/telemetry/schemas.ts:27) y la DB `device_id text not null` (0003). El route `/api/v1/telemetry` ya resuelve `user_id` desde la cookie de sesión SSR (route.ts:24-27,38) — la línea de auth funciona. `resolveIpGeo` es null-safe con `IPGEO_URL` vacío. La degradación contextual de ads ya vive en `lib/ads/sponsorships.ts:79-82`. El consentimiento local se lee con `getConsentPurpose("deviceLinking")` (token v2 de add-lpdp-compliance).

## Goals / Non-Goals

**Goals:**
- Ingestión de telemetría funcional en Safari/Brave/modos privados/iOS sin fallas de validación ni pérdida de continuidad de identidad.
- Huella solo con consentimiento explícito (LPDP: vinculación de dispositivos es tratamiento opt-in).
- Contrato documentado y listo para la app RN (Fase móvil posterior).

**Non-Goals:**
- Migrar la columna `device_id` (sigue `not null`; el servidor garantiza valor).
- Fingerprinting agresivo con canvas/audio/webgl — solo metadatos declarados ya capturados (UA, pantalla, idioma, tz).
- Server-side session stitching adicional vía IP (la geo por IP está inactiva y no se activa).
- Implementar la app RN.

## Decisions

1. **Prioridad de resolución server-side: evento → cookie → generar**. El valor del evento (localStorage del cliente) es el más estable y ya existe; la cookie cubre clientes sin almacenamiento; generar es el último recurso con `Set-Cookie` para dar continuidad futura. La cookie es httpOnly (no legible por JS, menos superficie) y first-party del mismo dominio (el endpoint de ingestión), así que Safari ITP la mantiene mientras haya interacción con el sitio.
2. **El cliente omite deviceId en el caso efímero** en vez de inventar ids desechables: evita fabricar dispositivos falsos que envenenan `gf_user_audiences` (audiencias por dispositivo). Schema pasa a `deviceId: optional`; `types` refleja el opcional en el input.
3. **Huella FNV-1a sincrónica de 2 rondas (64-bit hex)** con sal fija del bundle: determinista, sin `crypto.subtle` async, suficiente para estabilidad de continuidad (no es criptografía ni anti-fraude). Partes: UA, pantalla w×h×depth, idioma, zona horaria. Solo se consulta cuando `getConsentPurpose("deviceLinking")` y localStorage falló.
4. **Helpers puros testables**: `resolverDeviceIdServidor({ deviceIdEvento, cookieDid, nuevoId })` → `{ deviceId, setCookie: string | null }` y `huellaDispositivo(partes)` viven en `lib/telemetry/`, con la lógica de la escalera cubierta por tests unitarios (la route solo los compone con request/cookies reales).
5. **Salt de huella legible**: `"gf-v1"` como sufijo fijo — sin secreto (no es opaco, es continuidad consentida); documentado en política de cookies ya publicada.

## Risks / Trade-offs

- [Cookie `gf_did` persiste 390 días sin consentimiento explícito] → es identificador técnico de ingesta bajo interés legítimo (ya declarado); httpOnly no accesible a scripts; el titular puede oponerse (telemetría deja de fluir) y borrar cookies.
- [Huella colisiona entre dispositivos iguales (mismo modelo+config)] → aceptado: sirve continuidad de sesión en un único dispositivo, no vinculación real cross-device; `deviceLinking` documentado como tal en la UI.
- [Cambiar deviceId de obligatorio a opcional relaja validación] → compensado: server garantiza `not null` en DB y tests cubren los 3 caminos de resolución.
- [Eventos con deviceId de cookie efímero seguido] → la audiencia por dispositivo puede fragmentar; mitigación real: la auth (user_id) domina para usuarios logueados, y el efímero solo aparece sin cookies ni sesión.

## Migration Plan

1. Merge (sin DB). Despliegue.
2. Verificar con curl: POST sin deviceId recibe 200 + `Set-Cookie gf_did`; POST con cookie reutiliza el mismo id; POST con deviceId propio no reescribe cookie.
3. Rollback: revert del commit.

## Open Questions

- Ninguna.
