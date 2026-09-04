-- Plano del huerto: vinculación de árboles con su huerto del mapa y
-- posición dentro de la matriz del plano (coordenadas normalizadas 0..1
-- respecto al bounding box del polígono).
alter table public.gf_arboles add column if not exists huerto_id uuid
  references public.gf_huertos(id) on delete set null;
alter table public.gf_arboles add column if not exists pos_x numeric;
alter table public.gf_arboles add column if not exists pos_y numeric;

create index if not exists gf_arboles_huerto_idx on public.gf_arboles (huerto_id);

comment on column public.gf_arboles.huerto_id is
  'Huerto (gf_huertos) al que pertenece el árbol. Null = sin asignar a ningún plano.';
comment on column public.gf_arboles.pos_x is
  'Posición del árbol en el plano, normalizada 0..1 sobre el eje lng del bounding box del polígono. Null = sin posición.';
comment on column public.gf_arboles.pos_y is
  'Posición del árbol en el plano, normalizada 0..1 sobre el eje lat del bounding box del polígono. Null = sin posición.';
