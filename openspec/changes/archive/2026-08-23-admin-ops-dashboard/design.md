## Context

Hoy `admin/audiencias` y `admin/sponsorships` ya existen y usan `is_admin()` `supabase/migrations/0006` + `proxy.ts:73` `createAdminClient`. El jefe no ve `perfiles`/`gf_*` ni `MRR`. El flujo de pago `mercadopago.ts:88` deja `pending`→`active` vía webhook `subscription_preapproval` (27 notifs 100% OK) pero cuando falla (`Por motivos de seguridad #174...` por `collector==payer` o `risk`) hay que corregirlo a mano. No hay tabla nueva: solo lectura agregada + `UPDATE perfiles` auditado.

## Goals / Non-Goals

**Goals:** (1) jefe ve KPIs sin SQL, (2) opera usuarios (filtra, abre huerto, cambia plan), (3) ve finanzas `gf_subscriptions` con link MP.
**Non-Goals:** facturación/contabilidad, exportar a Excel, editar `gf_cultivos` ajeno, nuevo RLS, cambiar `proxy` gating.

## Decisions

**D1 — Dos rutas, no una sola tabla gigante.** `/admin` overview (KPIs) + `/admin/usuarios` (tabla + drawer detalle). Rationale: overview debe cargar en <1s (counts agregados) mientras usuarios hace paginación 20. Alternativa single page → query pesada `JOIN gf_*`.

**D2 — Lectura vía `createAdminClient` + `is_admin()` check en cada `route.ts` y `page.tsx`, no via RLS `perfiles` público.** Rationale: `gf_analytics_events` ya es `insert open / select admin-only` `0006`; reutilizar patrón. Alternativa `SECURITY DEFINER` view → más migración.

**D3 — MRR = sum(active × planAmount) `lib/payments/plans.ts:17` en server, no en DB view.** Rationale: precio cambia `9990` y debe ser single source. Alternativa `materialized view` → stale.

**D4 — Cambio de plan manual via `PATCH /api/v1/admin/users/{id}` con `plan` + `subscription_status` y `updated_at` audit.** Rationale: cuando MP `risk` cancela (`4eeaf10...` `canceled`), el jefe activa sin esperar soporte. Alternativa `supabase dashboard` → no audit, no UX.

## Risks / Trade-offs

- **Lectura agregada pesada sin índices:** `perfiles` 1000+ filas + `gf_subscriptions` scan → mitigar `limit 20` + `count` estimado + índices `perfiles(plan)`, `gf_subscriptions(status)`.
- **Admin ve todo:** `is_admin` es `perfiles.plan=admin` `lib/auth/admin.ts:1` — si se filtra un `admin` mal, ve todo → mitigar `proxy` + `403` + log.
- **No hay auditoría real:** solo `updated_at` → mitigar log `console` con `actor id`.

## Migration Plan

1. Deploy sin migración (solo código) → `admin` ve KPIs (MRR puede ser 0 si no hay `active`, como hoy `buyer` `huertero active` 1).
2. Si jefe pide export, añadir `GET /api/v1/admin/users/export?format=csv` después.
3. Rollback: quitar rutas `admin/*`, no hay daño DB.

## Open Questions

- ¿MRR debe sumar solo `active` o también `trialing`? Asunción: solo `active` (dinero real). Si quiere `trialing` incluir, cambiar `план` en `overview`.
