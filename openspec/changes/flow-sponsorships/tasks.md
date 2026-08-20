## 1. Dependencias y entorno

- [x] 1.1 Definir variables `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL`, `NEXT_PUBLIC_SITE_URL` en `.env.example` y Vercel
- [x] 1.2 Crear helper `lib/payments/flow.ts` (firma HMAC SHA256, llamadas a la API de Flow)

## 2. Modelo de datos

- [x] 2.1 Migración que añade `amount`, `payment_status`, `flow_token`, `flow_payment_id`, `paid_at` a `gf_sponsorships`
- [x] 2.2 RLS coherente — `gf_sponsorships` no tiene RLS; los writes del checkout/webhook usan el client service-role (`createAdminClient`)
- [x] 2.3 Extender tipo `Sponsorship` en `types/index.ts` (`amount`, `paymentStatus`, `paidAt`)

## 3. Checkout (Route Handler)

- [x] 3.1 Crear `app/api/v1/flow/checkout/route.ts`: valida sesión, toma monto de la base (servidor), crea orden en Flow con `urlConfirmation`/`urlReturn`, guarda `flow_token`, pasa a `pending`, devuelve `redirectUrl`
- [x] 3.2 Proteger con autenticación (401 si no hay sesión)

## 4. Webhook (Route Handler)

- [x] 4.1 `app/api/v1/flow/webhook/route.ts`: verifica el pago vía `payment/getStatus` (firmado con el secreto) antes de activar
- [x] 4.2 Consultar `payment/getStatus` y, si está pagado (status 2), marcar `paid` + `flow_payment_id` + `paid_at` de forma idempotente
- [x] 4.3 Manejar estados pending/failed: no activar la campaña

## 5. UI de patrocinación

- [x] 5.1 Conectar el flujo de patrocinación al checkout de Flow (botón "Pagar con Flow" que redirige a la pasarela)
- [x] 5.2 Mostrar estado de pago (Sin pagar / Pendiente / Pagado / Fallido) en la lista del admin

## 6. Extensibilidad (PayPal a futuro)

- [x] 6.1 Definir interfaz `PaymentProvider` en `lib/payments/types.ts` para no acoplar la UI al proveedor (Flow ahora; PayPal después)

## 7. Validación

- [x] 7.1 typecheck + lint + build de producción (rutas `/api/v1/flow/*` presentes)
- [ ] 7.2 Prueba del flujo en sandbox de Flow (checkout → webhook → estado paid) — requiere `FLOW_API_KEY`/`FLOW_SECRET_KEY` en Vercel (credenciales no disponibles en este entorno)
- [x] 7.3 Commit + push + `openspec archive flow-sponsorships`
