# Tasks: Consumidor en checkout

## 1. SQL
- [x] 1.1 Crear `supabase/migrations/0025_subscriptions_terminos.sql`: `alter table public.gf_subscriptions add column if not exists terminos_aceptados_at timestamptz, add column if not exists terminos_aceptados_version text;`
- [x] 1.2 Aplicar migración 0025 vía MCP y verificar columnas con `execute_sql`.

## 2. Gate de aceptación (backend)
- [x] 2.1 En `app/api/v1/payments/subscribe/route.ts`: parsear `aceptoTerminos` del body, rechazar con 400 si no es `true`, insertar el draft con `terminos_aceptados_at` (servidor) y `terminos_aceptados_version` (constante `TERMINOS_VERSION`).

## 3. Checkout (UI)
- [x] 3.1 En `app/(public)/pricing/page.tsx`: checkbox global de aceptación con enlaces a `/legal/terminos` y `/legal/privacidad`, botones "Suscribirse" deshabilitados sin marcado, envío de `aceptoTerminos` en el fetch, y aviso destacado (retracto 10 días + canal, débito automático MP, cancelación en perfil, soporte).

## 4. Confirmación escrita
- [x] 4.1 En `app/api/v1/payments/subscribe/status/route.ts`: agregar `interval` al select del draft y responder `plan`, `interval`, `monto` (via `planAmount`).
- [x] 4.2 En `app/(dashboard)/suscripcion/confirmar/page.tsx`: tarjeta "Resumen de condiciones" con plan, monto, intervalo, débito automático vía Mercado Pago, cancelación desde el perfil, retracto 10 días corridos con canal (email de soporte) — solo cuando existan datos del draft.

## 5. Verificación
- [x] 5.1 `pnpm typecheck` + `pnpm lint` + `pnpm test` en verde.
- [x] 5.2 Smoke: POST a `/api/v1/payments/subscribe` sin sesión → 401 y sin sesión con `aceptoTerminos` ausente → la validación de aceptación corre antes que cualquier llamada a MP; `/pricing` y `/legal/terminos` responden 200; kill del server.
- [x] 5.3 Actualizar PENDING.md (migración 0025 aplicada; Fase 6 cerrada; boletas SII siguen diferidas).
