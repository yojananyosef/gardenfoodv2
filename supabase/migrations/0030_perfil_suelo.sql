-- 0030: tipo de suelo del usuario (general, junto a la comuna)
-- G = Gruesa (arenosa), MG = Moderadamente gruesa (franco arenoso),
-- M = Media (franca), F = Fina (arcillosa). Fuente: guía Suelo y Riego GARDENFOOD
-- (método USDA-NRCS tacto/apariencia + BD técnica 30 especies).
-- El suelo se mide una vez por terreno; por eso vive en perfiles, no por árbol.
alter table public.perfiles
  add column if not exists tipo_suelo text
    check (tipo_suelo in ('G', 'MG', 'M', 'F')),
  add column if not exists suelo_origen text
    check (suelo_origen in ('quiz', 'manual')),
  add column if not exists suelo_at timestamptz;
