// E2E sandbox smoke for Mercado Pago hosted subs (manual, requiere .env y usuario autenticado)
// 1. Crea test_user vía MP API o usa uno existente test_user_...@testuser.com distinto al collector
// 2. POST /api/v1/payments/subscribe {tier:"huertero", interval:"monthly"} con cookie auth
// 3. Sigue init_point y paga con TEST card 5031755736641680 123 11/30
// 4. Poll subscribe/status hasta trialing/active y verifica perfiles.plan

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";
console.log(`[test] SITE=${SITE}`);
console.log(`[test] Manual steps:`);
console.log(`  1. Inicia sesión con test_user_...@testuser.com (no collector)`);
console.log(`  2. curl -X POST ${SITE}/api/v1/payments/subscribe -H "Content-Type: application/json" -b cookies.txt -d '{"tier":"huertero","interval":"monthly"}'`);
console.log(`  3. Abre el init_point devuelto y paga con 5031755736641680 123 11/30`);
console.log(`  4. curl -X POST ${SITE}/api/v1/payments/subscribe/status -b cookies.txt`);
console.log(`  5. Verifica en Supabase que perfiles.plan == 'huertero' y subscription_status in ('trialing','active')`);
console.log(`Notas:`);
console.log(`  - Yearly usa frequency:12 months (no years) con amount 99900/199900/299900`);
console.log(`  - Si ves 400 collector==payer, tu email es el del vendedor MP; usa test_user distinto`);
console.log(`  - Webhook debe apuntar a ${SITE}/api/v1/payments/webhook con MP_WEBHOOK_SECRET seteado`);
