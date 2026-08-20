## 1. Dependencias y entorno

- [ ] 1.1 Definir variables `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL`, `NEXT_PUBLIC_SITE_URL` en `.env.example` y Vercel
- [ ] 1.2 Crear helper `lib/payments/flow.ts` (firma HMAC SHA256, llamadas a la API de Flow)

## 2. Modelo de datos

- [ ] 2.1 Migración que añade `payment_status`, `flow_token`, `flow_payment_id`, `paid_at` a `gf_sponsorships`
- [ ] 2.2 RLS coherente (dueño y admin ven el estado de pago)
- [ ] 2.3 Extender tipo `Sponsorship` en `types/index.ts`

## 3. Checkout (Route Handler)

- [ ] 3.1 Crear `app/api/v1/flow/checkout/route.ts`: valida sesión, toma monto del plan (servidor), crea orden en Flow con `urlConfirmation`/`urlReturn`, guarda `flow_token`, pasa a `pending`, devuelve `redirect_url`
- [ ] 3.2 Proteger con autenticación (401 si no hay sesión)

## 4. Webhook (Route Handler)

- [ ] 4.1 Crear `app/api/v1/flow/webhook/route.ts`: verifica firma HMAC de Flow (400 si inválida)
- [ ] 4.2 Consultar `payment/getStatus` y, si está pagado, marcar `paid` + `flow_payment_id` + `paid_at` de forma idempotente
- [ ] 4.3 Manejar estados pending/failed: no activar la campaña

## 5. UI de patrocinación

- [ ] 5.1 Conectar el flujo de patrocinación al checkout de Flow (redirigir a la pasarela)
- [ ] 5.2 Mostrar estado de pago (pending/paid) en la lista del sponsor

## 6. Extensibilidad (PayPal a futuro)

- [ ] 6.1 Definir interfaz `PaymentProvider` para no acoplar la UI al proveedor (Flow ahora; PayPal después)

## 7. Validación

- [ ] 7.1 `openspec validate flow-sponsorships` + typecheck + lint
- [ ] 7.2 Build de producción y prueba del flujo en sandbox de Flow (checkout → webhook → estado paid)
- [ ] 7.3 Commit + push + `openspec archive flow-sponsorships`
