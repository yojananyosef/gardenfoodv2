## Context

GardenFood ya calcula audiencias de usuario en `gf_user_audiences` (segmentos comerciales,
poder adquisitivo, fenología, cultivo de interés, región/comuna) y ya captura consentimiento
vía CMP en `gf_user_consents`. Los patrocinios (`gf_sponsorships`) se cobran con Flow
(`flow-sponsorships`) pero son inventario global, sin dirigir. Este modelo de negocio (3) es una
capa de targeting sobre lo ya existente, no un nuevo flujo de pago.

## Goals / Non-Goals

**Goals:**
- Permitir que un patrocinio declare `targeting` sobre `gf_user_audiences`.
- Filtrar `getActiveSponsorships` por la audiencia del usuario, con fallback a genéricos.
- Respetar el consentimiento de personalización (`gf_user_consents`).
- Exponer el targeting en el admin de patrocinios.

**Non-Goals:**
- Nuevo flujo de pago (reutiliza `flow-sponsorships`).
- Modelado de "venta de datos a terceros" (el dato se usa solo para dirigir dentro de la app).

## Decisions

- **`targeting` jsonb en `gf_sponsorships`**: flexible para combinar filtros (segments AND tier
  AND cultivo). Alternativa: FKs a tablas de segmentos; se descarta por rigidez.
- **Filtro en `getActiveSponsorships(screen, userId)`**: el servidor resuelve la audiencia del
  usuario y compara; nunca se filtra en el cliente (privacidad).
- **Consentimiento como gate**: si `gf_user_consents` no tiene personalización activa, el usuario
  solo recibe patrocinios sin `targeting`.
- **Fallback determinista**: sin coincidencia → patrocinios genéricos activos (no rompe la UI).

## Risks / Trade-offs

- [Risk] Filtro costoso por request → Mitigation: índice en `gf_sponsorships(screen, active)` ya
  existe; la audiencia del usuario se resuelve una vez y se cachea por request.
- [Risk] Percepción de uso indebido de datos → Mitigation: CMP explícito y fallback sin
  personalización; documentar en privacy.
- [Risk] Poco inventario segmentado al inicio → Mitigation: fallback a genéricos.

## Migration Plan

1. Migración: `alter table gf_sponsorships add column targeting jsonb` (+ índice parcial opcional).
2. Extender `mapSponsorship` y `getActiveSponsorships(screen, userId)` con filtro de audiencia.
3. Respetar `gf_user_consents` en el filtro.
4. Admin: selector de targeting al crear/editar patrocinio.
5. typecheck/lint/build + prueba de filtrado con un usuario de segmento conocido.
