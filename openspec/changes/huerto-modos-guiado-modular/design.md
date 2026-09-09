# Design: huerto-modos-guiado-modular

## Context

- La vista Mi Huerto vive en `app/(dashboard)/huerto/page.tsx` con server actions en `lib/huerto/` (`actions.ts`, `data.ts`, `plano.ts`, `huertos.ts`, `arbolModelo.ts`): hoy mezcla gestión de cultivos (`gf_cultivos`), inventario de árboles (`gf_arboles`) y plano, con el mapa satelital disponible solo en /perfil.
- El contenido agronómico por especie ya existe en la app: `lib/agronomy/fichas.ts` (~10k líneas de fichas técnicas), `fenologia.ts` (etapas por mes), `especies.ts` (catálogo), `zonas.ts` (comunas/zonas). El prototipo del socio (`docs/propuestas-ui/propuesta-e.html`, y su HTML original en `~/Descargas/gardenfood-nutricion-simple.html`) demuestra que esas fichas técnicas se pueden re-escalar a dosis caseras (taza/puñados) por etapa.
- La sincronización inventario→plano y el drag & drop ya tienen deltas aprobados en `openspec/changes/add-plano-matriz-arboles` y `add-marcado-arboles-mapa`; este change no los duplica, los orquesta.
- El auth/session, el selector de huerto (R5) y los límites freemium viven en `garden/auth`/`garden/payments` y en las páginas existentes.

## Goals / Non-Goals

**Goals:**
- Un solo módulo de datos por dominio: huerto (posición/estado de árboles) y especies (cuidados compartidos), conectados solo por `especie`.
- Dos modos de /huerto que comparten los mismos datos y componentes de alto nivel (panel, lienzo, resumen), diferenciándose en layout y en la pantalla de inicio.
- Reutilizar el motor de fichas/agronomía existente para alimentar fichas de especie con dosis caseras, sin duplicar contenido.

**Non-Goals:**
- No re-implementa plano/matriz ni marcado en mapa (deltas en curso).
- No rediseña la home, el perfil ni otras rutas (solo /huerto y el nuevo módulo /especie de navegación).
- No cambia el modelo de datos de `gf_cultivos`/`gf_arboles` salvo el campo de preferencia de modo.
- R6 (sesión en «¿Qué plantar?») queda fuera: lo cubre el módulo Especies.

## Decisions

1. **Modo por usuario en tabla `gf_perfiles`** (columna `huerto_modo text default null`, valores `null | 'guiado' | 'modular'`): la preferencia se hereda al perfil, no al huerto. `null` significa «todavía no eligió», lo que permite inferir el default (sin terreno y sin cultivos → `guiado`; con árboles → `modular`). Alternativas descartadas: localStorage solo (no sobrevive cambio de dispositivo), columna por huerto (el modo es una preferencia de tarea, no del terreno). El asistente corrido por completo se registra (`asistente_completado_at timestamptz`), para que no vuelva a dispararse.

2. **Modos como layout distinto del mismo route handler, no rutas separadas**: `app/(dashboard)/huerto/page.tsx` lee el modo y monta `<HuertoGuiado>` (asistente o «¿qué sigue?» como páginas de la misma vista) o `<HuertoModular>` (workbench 2 columnas). El toggle es client-side instantáneo (state swap + `startTransition` para persistir la preferencia), sin re-fetch: ambos modos comparten el mismo fetch de datos en el servidor. Alternativa descartada: `/huerto/modular` como ruta hermana — duplicaría el fetch y rompería la sensación de «cambio instantáneo sin recargar».

3. **«¿Qué sigue?» es server-computed**: pendientes de posicionamiento (`gf_arboles lat/lng null` por huerto activo), tareas de la semana (motor de calendario ya existente), y alto por especie con el mes activo. No introduces estado nuevo: es una vista sobre datos existentes.

4. **Fuente de fertilización: el XLSX del socio como módulo estático commiteado** (`GARDENFOOD_Guia_Fertilizacion_Casera.xlsx`, ~970 filas, trazado a INIA Boletín 426): módulo `lib/agronomy/fertilizacion.ts` que importa `supabase/fertilizacion_seed.json` (generado por `scripts/fertilizacion_seed.py` desde el XLSX: 15 fertilizantes con **peso por cucharada sopera** —la llave para convertir gramos a medidas caseras—, 180 filas de fenología por especie × región, 786 programas al suelo/goteo por especie × región × momento, y cosecha típica por especie). La edad de la planta (joven/adulta) entra como factor de ajuste del XLSX (hoja MI PLAN: 0,3/0,6/1 sobre cosecha típica) en código. La capa de tablas 0029 queda en la migración aplicada como estructura opcional: sembrarla a futuro es una operación de ops (dashboard SQL editor), el runtime no la necesita. Alternativas: tablas + seed vía REST (bloqueado: service key scrubbed en el repo y payload > límite MCP), o curado a mano en código (no mantenible a este volumen).
5. **Capa casera sobre el programa migrado**: `lib/agronomy/medidasCaseras.ts` pasa a ser una función de presentación: gramos del programa ÷ peso por cucharada del catálogo → cucharadas/tazas/puñados (+ instrucción de una línea). Sin duplicar datos: la ficha técnica (`lib/agronomy/fichas.ts`) y el programa migrado del XLSX conviven — fichas para describir el cuidado, programa para cuantificarlo.

5. **Módulo Especies en `/especie/especies`** (bajo `(dashboard)`, entrada en bottom-nav y header): página índice de tarjetas + ficha de especie `/especie/especies/[especie]`. Los asistentes del socio (tarjetas de fruta) viven ahí, no en /huerto; el asistente de alta crea cultivo+árboles reutilizando las server actions del huerto existentes y navega a la ficha.

6. **«Lo eché» como server action de calendario**: registra la aplicación (tabla `gf_aplicaciones` mínima o reutilizar la de cosechas/calendario si la hay) y agenda el siguiente momento vía el motor de calendario ya existente. Fuera de alcance: re-diseñar el Calendario, solo escribir ahí.

7. **Puente único de árbol→ficha**: la fila del detalle del árbol (popover del lienzo y/o ficha) añade un enlace a `/especie/especies/[especie]`; sin backlinks obligatorios de ficha a árbol (opcional «Lo eché a mis N árboles» sí带回 al historial de aplicaciones).

## Risks / Trade-offs

- [Dos modos de /huerto = dos superficies que mantener] → Compartir la capa de datos y las server actions; los modos solo eligen layout. Los componentes de «¿qué sigue?» reutilizan las tarjetas de resumen existentes.
- [El XLSX del socio tiene supuestos a validar (planta adulta, cosecha típica por región)] → el seed cita la fuente INIA por fila y la ficha SHALL declarar «calculado para planta adulta» con el ajuste por edad visible; los casos dudosos quedan con nota en la ficha en vez de silenciar el criterio.
- [Toggle instantánea puede des-order el estado local del lienzo] → el lienzo y el panel se montan/desmontan con el modo pero su estado se levanta al nivel de página (huerto activo, selección) para que persista al alternar.
- [Asistente puede resultar repetitivo si el usuario borra sus cultivos y prueba de nuevo] → el disparo automático se basa en `asistente_completado_at`, no en «huerto vacío», una vez corrido.
- [CSP de la app está rígida (Esri bloqueado hallado en la auditoría)] → el módulo /especie no depende de tiles de satélite; el modo modular reutiliza el mismo componente de mapa que /perfil (el fix de CSP de Esri queda registrado como acción aparte de la auditoría).

## Migration Plan

1. Migración 0028: `alter table gf_perfiles add column huerto_modo text`, `add column asistente_completado_at timestamptz` (+ RLS existente cubre). `gf_aplicaciones` nueva tabla con FK a `gf_arboles` y `especie`. Migración 0029: tablas de fertilización aplicadas (estructura + RLS lectura pública) para futura siembra opcional; el runtime consume el seed JSON commiteado, no la BD, hasta que se siembre.
2. Desplegar con el default conservador: usuarios con árboles existentes abren en Modular; usuarios nuevos en Guiado. Sin data migration de contenidos.
3. Rollback: la columna es opcional (`null`); re-deploy del build anterior no afecta datos.

## Open Questions

- ¿La tabla de aplicaciones usa la existente de Calendario o una propia? Se decide leyendo el schema de calendario al aplicar (no cambia los specs).
- ¿El índice de Especies omite especies sin ficha (o las lista bloqueadas)? Default: ocultas hasta tener ficha; refinar en implementación.
