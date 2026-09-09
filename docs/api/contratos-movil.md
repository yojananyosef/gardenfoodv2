# Contratos API — App móvil (React Native / Expo)

La app nativa consume los mismos endpoints y schemas que la web. Fuente única de verdad: `lib/telemetry/schemas.ts` + `types/` (exportados como contratos compartidos). Ningún campo inventado: si no está acá, no existe.

## Identidad del dispositivo (nativa)

- Generar un **identificador de instalación estable** al primer arranque (recomendado `expo-install-id` / `expo-application.getIosIdForVendor` + fallback UUID persistido en SecureStore) y enviarlo como `deviceId` en cada evento y en el registro CMP.
- **Nativa sin id** (permisos restrictivos): omitir `deviceId` por completo; el servidor resuelve por escalera (cookie `gf_did` no aplica en nativo → genera uno nuevo por batch, sin persistencia). Preferible enviar siempre el install-id.
- Sesión nativa: login con `@supabase/supabase-js` en el cliente (storage: SecureStore/AsyncStorage). La sesión viaja como token; el endpoint resuelve `user_id` server-side igual que en web (cookies o Authorization).

## 1. POST /api/v1/telemetry — Ingesta de eventos

Auth: opcional (con sesión asocia `user_id`; sin sesión, evento anónimo con `user_id null`).

```json
{
  "events": [
    {
      "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "deviceId": "install-uuid-o-null",
      "category": "PRODUCT_USAGE",
      "name": "VIEW_FICHA",
      "especieId": "duraznero",
      "dwellTimeMs": 42000,
      "scrollDepthPercent": 80,
      "payload": { "path": "/especies/duraznero" },
      "deviceMetadata": {
        "os": "iOS",
        "browser": "RN-Safari",
        "screenResolution": "390x844",
        "connectionType": "5g"
      },
      "clientTimestamp": "2026-09-09T14:30:00.000Z",
      "geo": { "comuna": "Pichilemu", "region": "O'Higgins", "zonaAgroclimatica": "5" }
    }
  ]
}
```

- `events`: 1–100 eventos por batch. Flush con `fetch keepalive` o al entrar en background.
- `deviceId`: **opcional**. Si la app no tiene id durable, omitirlo (no inventar ids desechables).
- `clientTimestamp`: ISO 8601 con offset (`new Date().toISOString()`).
- `geo`: la comuna/región/zona del perfil del usuario; `gpsLat/gpsLng` **solo con consentimiento `preciseGeo`**.

Respuesta: `200 {"ok":true,"ingested":N}` · `400` payload inválido (ver `issues`) · `500` error de DB (reintentar silenciosamente o descartar).

## 2. POST /api/v1/cmp/consent — Elección de privacidad

Auth: opcional. Mismo schema que web (`lib/consent/schemas.ts`).

```json
{
  "deviceId": "install-uuid",
  "consentPersonalizedAds": false,
  "consentPreciseGeo": false,
  "consentThirdPartySharing": false,
  "consentDeviceLinking": false,
  "legitimateInterestOpposed": false,
  "consentString": null
}
```

- La pantalla CMP nativa usa **estos mismos 5 toggles** y la respuesta guarda `expiresAt` (390 días).
- "Rechazar todo" nativo = todos los flags `false` + `legitimateInterestOpposed: true`.

Respuesta: `200 {"consent": {"userId": ..., "consentString": ..., "expiresAt": "..."}}`.

## 3. POST /api/v1/payments/subscribe — Suscripción

Auth: **obligatoria** (Bearer del cliente supabase nativo).

```json
{ "tier": "huertero", "interval": "monthly" }
```

Respuesta: `{"init_point": "https://www.mercadopago.cl/..."}` → abrir en WebView/browser (flujo hosted, sin SDK nativo de pagos).

## 4. POST /api/v1/payments/subscribe/status — Confirmación idempotente

Auth: obligatoria. Sin body: sincroniza el plan del usuario con Mercado Pago (poll tras volver del checkout).

## Reglas transversales

1. **No se agrega ningún campo fuera del schema compartido** — actualizar `lib/telemetry/schemas.ts`/`types/` primero, luego la app.
2. Errores de red en telemetría: fire-and-forget (nunca UI).
3. El consentimiento nativo respeta la misma arquitectura LPDP: telemetría de producto bajo interés legítimo con oposición; consents granulares opt-in.
