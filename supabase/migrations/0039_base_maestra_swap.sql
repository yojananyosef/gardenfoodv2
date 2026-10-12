-- Migracion generada por scripts/generar_base_maestra.py --sql
-- NO editar a mano. Editar el Excel o data/*.csv y regenerar.
--
-- Sin BEGIN/COMMIT explicito a proposito: se aplica con el MCP
-- (apply_migration), que ya envuelve todo en una transaccion. Un
-- COMMIT interno cortaria esa transaccion a mitad de camino.

-- 0039: verificacion previa y swap.

-- Cada bloque crea la vista con nombre temporal, la compara fila por
-- fila contra la tabla que va a reemplazar y solo despues borra la
-- tabla y renombra. Si difiere algo, el bloque aborta la migracion
-- entera y las tablas viejas siguen en pie.

-- gf_riego_suelos -> dim_suelos. Mapeo explicito, no select *.
create view public._swap_gf_riego_suelos with (security_invoker = on) as
select
    suelo_id as clave,
    suelo as nombre,
    nombres_usda as tecnico,
    agua_min_mm_m as agua_min_mm,
    agua_max_mm_m as agua_max_mm,
    factor_suelo as factor,
    como_manejarlo as manejo
from public.dim_suelos t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_suelos;
    select count(*) into n_nuevo from public._swap_gf_riego_suelos;
    select count(*) into diferencias from (
        (select clave, nombre, tecnico, agua_min_mm, agua_max_mm, factor, manejo from public.gf_riego_suelos
         except all
         select clave, nombre, tecnico, agua_min_mm, agua_max_mm, factor, manejo from public._swap_gf_riego_suelos)
        union all
        (select clave, nombre, tecnico, agua_min_mm, agua_max_mm, factor, manejo from public._swap_gf_riego_suelos
         except all
         select clave, nombre, tecnico, agua_min_mm, agua_max_mm, factor, manejo from public.gf_riego_suelos)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_suelos: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_suelos: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_suelos cascade;
alter view public._swap_gf_riego_suelos rename to gf_riego_suelos;
grant select on public.gf_riego_suelos to anon, authenticated;

-- gf_riego_zonas -> dim_zonas_riego. Mapeo explicito, no select *.
create view public._swap_gf_riego_zonas with (security_invoker = on) as
select
    zona_riego_id as clave,
    zona_riego as nombre,
    donde_queda as donde_queda,
    eto_verano_mm_dia as eto_verano,
    factor_clima as factor_clima,
    desfase_meses as desfase,
    que_significa as significado
from public.dim_zonas_riego t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_zonas;
    select count(*) into n_nuevo from public._swap_gf_riego_zonas;
    select count(*) into diferencias from (
        (select clave, nombre, donde_queda, eto_verano, factor_clima, desfase, significado from public.gf_riego_zonas
         except all
         select clave, nombre, donde_queda, eto_verano, factor_clima, desfase, significado from public._swap_gf_riego_zonas)
        union all
        (select clave, nombre, donde_queda, eto_verano, factor_clima, desfase, significado from public._swap_gf_riego_zonas
         except all
         select clave, nombre, donde_queda, eto_verano, factor_clima, desfase, significado from public.gf_riego_zonas)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_zonas: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_zonas: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_zonas cascade;
alter view public._swap_gf_riego_zonas rename to gf_riego_zonas;
grant select on public.gf_riego_zonas to anon, authenticated;

-- gf_riego_edad -> dim_edad. Mapeo explicito, no select *.
create view public._swap_gf_riego_edad with (security_invoker = on) as
select
    edad_n as n,
    edad as nombre,
    factor_litros as factor_litros,
    factor_dias as factor_dias
from public.dim_edad t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_edad;
    select count(*) into n_nuevo from public._swap_gf_riego_edad;
    select count(*) into diferencias from (
        (select n, nombre, factor_litros, factor_dias from public.gf_riego_edad
         except all
         select n, nombre, factor_litros, factor_dias from public._swap_gf_riego_edad)
        union all
        (select n, nombre, factor_litros, factor_dias from public._swap_gf_riego_edad
         except all
         select n, nombre, factor_litros, factor_dias from public.gf_riego_edad)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_edad: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_edad: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_edad cascade;
alter view public._swap_gf_riego_edad rename to gf_riego_edad;
grant select on public.gf_riego_edad to anon, authenticated;

-- gf_riego_humedad -> dim_humedad. Mapeo explicito, no select *.
create view public._swap_gf_riego_humedad with (security_invoker = on) as
select
    humedad_n as nivel,
    nivel as nombre,
    pct_min as pct_min,
    pct_max as pct_max,
    factor_riego as factor_riego,
    factor_control as factor_control,
    que_significa as significado
from public.dim_humedad t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_humedad;
    select count(*) into n_nuevo from public._swap_gf_riego_humedad;
    select count(*) into diferencias from (
        (select nivel, nombre, pct_min, pct_max, factor_riego, factor_control, significado from public.gf_riego_humedad
         except all
         select nivel, nombre, pct_min, pct_max, factor_riego, factor_control, significado from public._swap_gf_riego_humedad)
        union all
        (select nivel, nombre, pct_min, pct_max, factor_riego, factor_control, significado from public._swap_gf_riego_humedad
         except all
         select nivel, nombre, pct_min, pct_max, factor_riego, factor_control, significado from public.gf_riego_humedad)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_humedad: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_humedad: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_humedad cascade;
alter view public._swap_gf_riego_humedad rename to gf_riego_humedad;
grant select on public.gf_riego_humedad to anon, authenticated;

-- gf_riego_kc -> dim_etapas. Mapeo explicito, no select *.
create view public._swap_gf_riego_kc with (security_invoker = on) as
select
    codigo_etapa as codigo,
    lo_que_ve as descripcion,
    nullif(t.kc_referencial, '—')::numeric as kc
from public.dim_etapas t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_kc;
    select count(*) into n_nuevo from public._swap_gf_riego_kc;
    select count(*) into diferencias from (
        (select codigo, descripcion, kc from public.gf_riego_kc
         except all
         select codigo, descripcion, kc from public._swap_gf_riego_kc)
        union all
        (select codigo, descripcion, kc from public._swap_gf_riego_kc
         except all
         select codigo, descripcion, kc from public.gf_riego_kc)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_kc: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_kc: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_kc cascade;
alter view public._swap_gf_riego_kc rename to gf_riego_kc;
grant select on public.gf_riego_kc to anon, authenticated;

-- gf_riego_mensual -> fact_riego_mes. Mapeo explicito, no select *.
create view public._swap_gf_riego_mensual with (security_invoker = on) as
select
    alias_riego as especie,
    mes_n as mes,
    etapa as etapa,
    dias_min as dias_min,
    dias_max as dias_max,
    litros_min as litros_min,
    litros_max as litros_max,
    t.reposo::int as reposo
from public.fact_riego_mes t
join public.dim_especies e on e.especie_id = t.especie_id;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_mensual;
    select count(*) into n_nuevo from public._swap_gf_riego_mensual;
    select count(*) into diferencias from (
        (select especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo from public.gf_riego_mensual
         except all
         select especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo from public._swap_gf_riego_mensual)
        union all
        (select especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo from public._swap_gf_riego_mensual
         except all
         select especie, mes, etapa, dias_min, dias_max, litros_min, litros_max, reposo from public.gf_riego_mensual)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_mensual: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_mensual: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_mensual cascade;
alter view public._swap_gf_riego_mensual rename to gf_riego_mensual;
grant select on public.gf_riego_mensual to anon, authenticated;

-- gf_riego_etapas -> fact_riego_etapa. Mapeo explicito, no select *.
create view public._swap_gf_riego_etapas with (security_invoker = on) as
select
    alias_riego as especie,
    codigo_etapa as codigo,
    etapa as etapa_programa,
    meses_originales as meses_originales,
    case when t.coincide_exacto = 'Sí' then true else false end as coincide_exacta,
    dias_min as dias_min,
    dias_max as dias_max,
    litros_min as litros_min,
    litros_max as litros_max
from public.fact_riego_etapa t
join public.dim_especies e on e.especie_id = t.especie_id;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_etapas;
    select count(*) into n_nuevo from public._swap_gf_riego_etapas;
    select count(*) into diferencias from (
        (select especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max from public.gf_riego_etapas
         except all
         select especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max from public._swap_gf_riego_etapas)
        union all
        (select especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max from public._swap_gf_riego_etapas
         except all
         select especie, codigo, etapa_programa, meses_originales, coincide_exacta, dias_min, dias_max, litros_min, litros_max from public.gf_riego_etapas)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_etapas: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_etapas: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_etapas cascade;
alter view public._swap_gf_riego_etapas rename to gf_riego_etapas;
grant select on public.gf_riego_etapas to anon, authenticated;

-- gf_riego_especies -> dim_especies. Mapeo explicito, no select *.
create view public._swap_gf_riego_especies with (security_invoker = on) as
select
    alias_riego as especie,
    nombre_en_excel_riego as excel_nombre,
    nombre_cientifico as nombre_cientifico,
    grupo as grupo,
    riego_mantencion_l as mantencion_l,
    suelo_preferido as suelo,
    ph_ideal as ph,
    copa_ref_m as copa_ref_m
from public.dim_especies t;

-- Verificacion previa: si difiere algo, la migracion aborta.
do $verif$
declare
    diferencias bigint;
    n_viejo bigint; n_nuevo bigint;
begin
    select count(*) into n_viejo from public.gf_riego_especies;
    select count(*) into n_nuevo from public._swap_gf_riego_especies;
    select count(*) into diferencias from (
        (select especie, excel_nombre, nombre_cientifico, grupo, mantencion_l, suelo, ph, copa_ref_m from public.gf_riego_especies
         except all
         select especie, excel_nombre, nombre_cientifico, grupo, mantencion_l, suelo, ph, copa_ref_m from public._swap_gf_riego_especies)
        union all
        (select especie, excel_nombre, nombre_cientifico, grupo, mantencion_l, suelo, ph, copa_ref_m from public._swap_gf_riego_especies
         except all
         select especie, excel_nombre, nombre_cientifico, grupo, mantencion_l, suelo, ph, copa_ref_m from public.gf_riego_especies)
    ) d;
    if n_viejo <> n_nuevo or diferencias > 0 then
        raise exception 'gf_riego_especies: la tabla nueva no reproduce la vieja (viejo=%, nuevo=%, diferencias=%)', n_viejo, n_nuevo, diferencias;
    end if;
    raise notice 'gf_riego_especies: verificada, % filas identicas', n_nuevo;
end
$verif$;

drop table public.gf_riego_especies cascade;
alter view public._swap_gf_riego_especies rename to gf_riego_especies;
grant select on public.gf_riego_especies to anon, authenticated;

-- La vista de control de calidad tambien depende de gf_riego_suelos.
drop view if exists public.vw_riego_suelos_consistencia;
create view public.vw_riego_suelos_consistencia with (security_invoker = on) as
    select clave, nombre, tecnico
    from public.gf_riego_suelos
    where tecnico = nombre;

