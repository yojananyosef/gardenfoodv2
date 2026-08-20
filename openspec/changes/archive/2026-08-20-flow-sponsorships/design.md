## Context

Stripe no opera pagos locales en Chile, por lo que la monetización de patrocinaciones debe
usar Flow.cl (agregador local: Webpay, Multicaja, transferencias, CLP). El modelo de
`gf_sponsorships` hoy no tiene estado de pago. Ya existen Route Handlers bajo `/api/v1/*`
y un cliente Supabase server; checkout y webhook siguen ese patrón. Ver proposal.md.

## Goals / Non-Goals

**Goals:**
- Cobrar patrocinaciones con Flow.cl en CLP.
- Activar la campaña solo tras confirmación firmada + `getStatus` verificado.
- Dejar una interfaz de pago extensible para añadir PayPal (internacional) después.

**Non-Goals:**
- Suscripciones recurrentes (pago único por patrocinación).
- Facturación/boleta electrónica (otra iteración).
- Implementar PayPal en este cambio (solo se prepara el punto de extensión).

## Decisions

- **Flow hosted redirect** sobre embebido: menos superficie de riesgo y aprovecha la pasarela
  de Flow. Alternativa: API directa de tarjeta; se descarta (PCI, complejidad).
- **Webhook como fuente de verdad**: al llegar `urlConfirmation`, se verifica la firma HMAC
  SHA256 sobre los parámetros y se consulta `payment/getStatus` antes de activar (el redirect
  del cliente no es confiable).
- **Idempotencia** vía `commerceOrder`/`token` único: actualización es no-op si ya está `paid`.
- **Extensibilidad**: una interfaz `PaymentProvider` (Flow ahora, PayPal después) para no
  acoplar la UI al proveedor.

## Risks / Trade-offs

- [Risk] Webhook de Flow no llega → Mitigation: Flow reintenta; se puede añadir reconciliación
  manual/automática consultando `getStatus` (fuera de alcance inicial).
- [Risk] Firma mal configurada → Mitigation: validación HMAC obligatoria con `FLOW_SECRET_KEY`;
  modo sandbox para pruebas.
- [Risk] Monto manipulado en el cliente → Mitigation: el monto se toma del plan de la
  patrocinación en el servidor, no del body.

## Migration Plan

1. Migración que añade `payment_status`, `flow_token`, `flow_payment_id`, `paid_at` a
   `gf_sponsorships` + RLS coherente.
2. Desplegar Route Handlers y registrar `urlConfirmation` en Flow apuntando a
   `/api/v1/flow/webhook`.
3. Configurar `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL` en Vercel.
4. Rollback: columnas aditivas; si se revierte el código, campañas quedan `draft`/`pending`.

## Open Questions

- ¿CLP confirmado como moneda? (asumido sí).
- ¿La patrocinación ya tiene monto/plan definido en el modelo actual?
- ¿URL base pública para `urlReturn`/`urlConfirmation`? (usar `NEXT_PUBLIC_SITE_URL`).
