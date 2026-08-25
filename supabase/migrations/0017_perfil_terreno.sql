-- Terreno del usuario: polígono GeoJSON que delimita los bordes del huerto,
-- dibujado en el mapa de /perfil. Null = sin terreno delimitado.
alter table public.perfiles add column if not exists terreno_geojson jsonb
  check (terreno_geojson is null or jsonb_typeof (terreno_geojson) = 'object');

comment on column public.perfiles.terreno_geojson is
  'Feature GeoJSON {type, properties, geometry:{type:"Polygon", coordinates}} del terreno del usuario. Validado en aplicación (Zod); check jsonb solo como última línea de defensa.';
