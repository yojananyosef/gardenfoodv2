-- 0025: prueba de aceptación de términos en suscripciones (Ley del Consumidor).
-- Registra cuándo y bajo qué versión de los Términos se contrató cada suscripción.

alter table public.gf_subscriptions
  add column if not exists terminos_aceptados_at timestamptz,
  add column if not exists terminos_aceptados_version text;
