-- Modelo 3: capa de targeting sobre gf_sponsorships.
-- targeting (jsonb) guarda filtros sobre gf_user_audiences / perfiles.
-- Null = inventario genérico (sin dirigir).
alter table public.gf_sponsorships add column if not exists targeting jsonb;

comment on column public.gf_sponsorships.targeting is
  'Filtros de targeting sobre gf_user_audiences/perfiles: segments[], purchasingPowerTier[], primaryInterestCrop[], region[], comuna[]. Null = inventario genérico.';
