# adtech/clean-room Specification

## Purpose
TBD - created by archiving change add-clean-room-adtech-b2b. Update Purpose after archive.

## Requirements

### Requirement: Contrato clean-room documentado

El sistema SHALL documentar en `docs/ads/clean-room.md` el contrato comercial con marcas: la marca compra entrega de publicidad contra un segmento definido, recibe únicamente reportes de entrega agregados con k-anonymity ≥50 (impresiones, clics, CTR) y nunca recibe listas de usuarios, identificadores ni acceso a consultas sobre datos personales. El documento SHALL declarar la base legal por titular (consentimiento para conteo/segmentación; interés legítimo con oposición para métricas internas), la regla k≥50 como mínima y el procedimiento ante solicitudes de datos individuales (rechazo y escalamiento a responsable de tratamiento).

#### Scenario: Negociación con una marca
- **WHEN** el equipo comercial prepara un acuerdo con una marca
- **THEN** existe un documento de contrato clean-room que define entregable, minimización y prohibición de datos individuales para adjuntar a la negociación

#### Scenario: Marca pide lista de usuarios
- **WHEN** una marca solicita la lista de usuarios de un segmento
- **THEN** el documento define la respuesta estándar: entrega contra segmento sí, datos individuales no
