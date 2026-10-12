-- 0041_edad_arbol_como_edad_n: Fase 10.5 del plan
--
-- Habia tres vocabularios para la misma edad:
--
--   dim_edad.edad_n        1..4                  (canonico, del Excel)
--   dim_edad.edad          "Recién plantado..."  (el rotulo largo)
--   gf_arboles.edad_clase  "recien","joven",...  (codigos cortos)
--
-- El tercero no estaba en ninguna tabla del Excel: vivia en dos mapas escrita
-- a mano en components/huerto/EditarArbolDialog.tsx, que traducian en ambos
-- sentidos entre el numero y el codigo. Un cuarto vocabulario que solo existia
-- en el codigo, sin nada en la base que lo respaldara.
--
-- Que no hubiera datos es lo que hace esto barato y seguro: los 150 arboles
-- de gf_arboles tienen edad_clase en NULL. Se comprobo antes de escribir esto
-- (scripts/comparar_vocabularios_edad.mjs), no se asumio.
--
-- El plan decia "unificar en dim_edad". Se hace guardando el numero, no el
-- rotulo: `edad_n` es lo que ya usa lib/riego/calc.ts para elegir factores, y
-- asi el arbol no necesita ningun mapa para relacionarse con el motor.

begin;

-- 1) La columna nueva. Se agrega antes de tirar la vieja, y se rellena desde
--    ella para que, si alguien hubiera escrito codigos despues del chequeo,
--    la equivalencia no se pierda.
alter table gf_arboles add column if not exists edad_n integer;

update gf_arboles set edad_n = case edad_clase
  when 'recien'  then 1
  when 'joven'   then 2
  when 'inicial' then 3
  when 'adulto'  then 4
end
where edad_n is null and edad_clase is not null;

-- 2) La FK. dim_edad.edad_n es la PK (4 filas, 4 distintas), asi que la FK
--    queda validada por la base y no solo por el zod del action. No hace falta
--    `not valid`: el update de arriba solo deja valores 1..4 o NULL, y el script
--    de chequeo contó 0 huérfanos antes de escribir esto.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'gf_arboles'::regclass
       and contype = 'f'
       and conname = 'gf_arboles_edad_n_fkey'
  ) then
    alter table gf_arboles
      add constraint gf_arboles_edad_n_fkey
      foreign key (edad_n) references dim_edad(edad_n);
  end if;
end $$;

-- 3) La columna vieja. Todo lo que habia esta ya en edad_n.
alter table gf_arboles drop column if exists edad_clase;

commit;