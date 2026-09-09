-- 0026: FK directa gf_user_audiences.user_id -> perfiles.id
-- PostgREST solo detecta embeddings (select "*, perfiles(...)") por FK directa;
-- gf_user_audiences solo tenia FK a auth.users, por lo que /admin/audiencias
-- fallaba con "Could not find a relationship ... in the schema cache".
-- on delete cascade mantiene el comportamiento previo (perfiles ya cascada desde auth.users).

alter table public.gf_user_audiences
  add constraint gf_user_audiences_perfiles_fk
  foreign key (user_id) references public.perfiles (id) on delete cascade;
