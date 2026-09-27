-- 0033_riego_tecnico: corrige gf_riego_suelos.tecnico
--
-- El seed de 0032 copió `nombre` en `tecnico` para las cuatro clases de suelo,
-- así que la tarjeta de /perfil mostraba el mismo texto dos veces seguidas
-- ("Fina (arcillosa)" / "Fina (arcillosa)") y el usuario perdía la descripción
-- técnica, que es justo lo que sirve para elegir.
--
-- Los valores correctos son los de `TIPOS_SUELO` en lib/riego/datos.ts
-- (método USDA-NRCS, arena / franco / arcilla), que es la misma fuente que usa
-- el fallback estático del componente.

update public.gf_riego_suelos set tecnico = 'Arena, arena francosa, arena fina'
  where clave = 'G';
update public.gf_riego_suelos set tecnico = 'Franco arenoso, franco arenoso fino'
  where clave = 'MG';
update public.gf_riego_suelos set tecnico = 'Franco, franco limoso, franco arenoso arcilloso'
  where clave = 'M';
update public.gf_riego_suelos set tecnico = 'Arcilla, franco arcilloso, franco arcilloso limoso'
  where clave = 'F';

-- Guarda de seguridad: si alguien regenera el seed y vuelve a duplicar el
-- nombre, esta vista deja el fallo a la vista en vez de silencioso.
create or replace view public.vw_riego_suelos_consistencia as
  select clave, nombre, tecnico
  from public.gf_riego_suelos
  where tecnico = nombre;
