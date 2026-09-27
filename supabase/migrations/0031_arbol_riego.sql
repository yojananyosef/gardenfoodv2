-- 0031: datos de riego por árbol (edad, copa, método)
-- edad_clase: recien (0-1 año) | joven (2-3) | inicial (4-5) | adulto (6+).
-- Factores Excel: litros 0.3/0.55/0.8/1.0, días 0.55/0.75/0.9/1.0.
-- copa_m: sombra al mediodía de punta a punta (m). El agua escala al cuadrado
-- frente a la copa de referencia de cada especie.
-- metodo_riego + caudal_l_h: balde/manguera (caudal 0) o goteo (suma de goteros).
-- Todas NULL = sin datos (compatibles con árboles existentes).
alter table public.gf_arboles
  add column if not exists edad_clase text
    check (edad_clase in ('recien', 'joven', 'inicial', 'adulto')),
  add column if not exists copa_m numeric
    check (copa_m >= 0.2 and copa_m <= 12),
  add column if not exists metodo_riego text
    check (metodo_riego in ('balde', 'manguera', 'goteo')),
  add column if not exists caudal_l_h numeric
    check (caudal_l_h >= 0 and caudal_l_h <= 500);
