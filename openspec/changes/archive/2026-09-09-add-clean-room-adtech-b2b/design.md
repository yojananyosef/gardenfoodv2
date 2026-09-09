# Design: Clean-room B2B

## Context
- Rutas A y C operativas: sin identidad o sin consentimiento solo se sirve inventario genérico (`getActiveSponsorships`); con consentimiento `consent_personalized_ads` se entrega por segmento (`audienceMatchesTargeting`). La marca jamás recibe datos en esta capa: la entrega es server-side.
- El hueco B-lite: (1) el media kit (0023) cuenta **todos** los perfiles con audiencia — incluidos los que rechazaron `thirdPartySharing`; (2) no hay contrato clean-room escrito; (3) el copy CMP ("Compartir datos agregados con marcas") es ambiguo sobre qué es "agregado"; (4) la política ya describe k≥50 pero no la base de consentimiento para el conteo comercial.
- `gf_user_consents`: única fila vigente por usuario-dispositivo (`unique (user_id, device_id)`), con `consent_timestamp` y `expires_at`. La elección vigente de un titular = fila con mayor `consent_timestamp` entre las no expiradas.

## Goals / Non-Goals
- **Goals**: media kit que solo cuente titulares con `thirdPartySharing` vigente; contrato clean-room firmable; copy CMP y política alineados al modelo real.
- **Non-Goals**: cambiar la entrega de publicidad (A/C intactas); DSP/realtime bidding (nunca); reportes por cohorte individual a marcas (prohibido por diseño); cambiar `lib/telemetry/refresh.ts` (ya solo construye audiencias de titulares con consentimiento vigente — el gate fino por propósito vive en el consumo B2B).

## Decisions

### D1: Gate de compartición en SQL, no en JS
Migración 0024 actualiza `admin_media_kit()`: CTE `vigentes` con `distinct on (user_id)` (orden `consent_timestamp desc`) filtrando `expires_at > now()` y `consent_third_party_sharing = true`; cada dimensión cruza `gf_user_audiences` contra ese conjunto (`join`/`in`). Ventaja: el mínimo de datos sale por una sola puerta auditada y ninguna página futura puede olvidar el filtro. Alternativa descartada: filtrar en `getMediaKit()` — un cliente admin futuro podría llamar la RPC sin pasar por TS.

### D2: El contrato se documenta, no se codifica
`docs/ads/clean-room.md` es el artefacto legal-comercial (sin código): entregable, minimización (k≥50), prohibiciones, base legal por titular, respuesta estándar a "pásame la lista". No va en `docs/legal/` porque es material de venta, no política pública; se referencia desde el rat y dpas-checklist.

### D3: Copy CMP sin cambio semántico
La preferencia sigue OFF por defecto y sigue llamándose "Compartir con socios comerciales"; solo cambia la descripción para describir el clean-room. No hay migration: el texto vive en `ConsentPreferences.tsx`.

### D4: Nota de consentimiento visible en media kit y export
La página agrega una línea: los conteos incluyen solo titulares con la elección de compartición vigente. El export (CSV/JSON) agrega la línea "incluye solo titulares que aceptaron compartir con socios comerciales". Costo nulo, transparencia B2B real.

## Risks / Trade-offs
- **Audiencias pequeñas**: con la gate, el pool elegible es un subconjunto de un pool ya chico; el media kit seguirá vacío por un tiempo. Aceptado: es el comportamiento exigido (más honesto vacío que inflado).
- **Consentimiento por dispositivo**: un titular con elección vieja (true) y nueva (false) en otro dispositivo — la regla "mayor `consent_timestamp` vigente" refleja la última voluntad. Documentado en el diseño, no necesita código extra.

## Migration Open Questions
- Ninguna: 0024 es un `create or replace function` de `admin_media_kit()`; reversible.
