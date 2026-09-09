# telemetry-contratos Specification

## Purpose
Contrato de ingesta telemétrica y consentimiento multi-plataforma: la futura app React Native/Expo debe consumir exactamente los mismos endpoints y schemas que la web, con la estrategia de identidad nativa documentada, de modo que la app no duplique lógica ni diverja del schema compartido en `types/`.

## Requirements

### Requirement: Contrato documentado de ingestión móvil

El sistema SHALL documentar en `docs/api/contratos-movil.md` los endpoints que consume una app nativa: `POST /api/v1/telemetry` (batch de eventos con los campos del schema compartido, `deviceId` opcional), `POST /api/v1/cmp/consent` (elección granular con `deviceId`), y `POST /api/v1/payments/{subscribe,subscribe/status}` con auth. El documento SHALL especificar la estrategia de identidad nativa (identificador de instalación estable de la app, p. ej. `expo-install-id`, enviado como `deviceId`) y que la sesión nativa viaja como token (no cookies), con el mismo comportamiento de `user_id` server-side.

#### Scenario: Documento con contratos completos
- **WHEN** un equipo revisa `docs/api/contratos-movil.md`
- **THEN** encuentra endpoint por endpoint: método, auth, payload de ejemplo validado contra el schema y estrategia de deviceId nativa

#### Scenario: Schema compartido como fuente de verdad
- **WHEN** la app nativa serializa un evento
- **THEN** usa los mismos tipos y validaciones del schema de `lib/telemetry/schemas.ts` (fuente única, sin duplicar el contrato)
