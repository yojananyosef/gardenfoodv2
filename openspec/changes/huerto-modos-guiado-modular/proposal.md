# Proposal: huerto-modos-guiado-modular

## Why

El socio revisó las 6 propuestas de wireframes y eligió B y C; la síntesis acordada es la **Propuesta E** (docs/propuestas-ui/propuesta-e.html): C como modo guiado por defecto (el asistente se hace una vez y luego la pantalla responde «¿qué sigue hoy?»), con un toggle permanente al modo modular de B para usuarios avanzados, y los cuidados por especie (el HTML del socio: calculadora de abono, dosis en medidas caseras, calendario anual) viviendo en un módulo de Especies aparte, conectado al huerto solo por el detalle de cada árbol. Hoy /huerto mezcla ambos dominios y obliga a repetir formularios (1 cultivo vs 24 filas de árboles, alta duplicada cultivos+inventario).

## What Changes

- **Modos de /huerto**: la vista admite dos modos — `guiado` (default para usuarios nuevos: asistente de 4 pasos Terreno→Árboles→Posicionar→Listo, luego pantalla «¿qué sigue?» con pendientes y tareas) y `modular` (panel de cultivos a la izquierda + lienzo central con pestañas Terreno/Posicionar/Visualización 3D). El toggle es instantáneo (sin recarga), visible en cabecera y en móvil (compacto), y la preferencia persiste en el perfil del usuario.
- **Asistente de una sola vez**: el wizard se presenta por defecto la primera vez (huerto sin terreno dibujado y 0 cultivos); cerrarlo no lo vuelve a disparar — desde modo modular queda accesible de formafloating «Abrir asistente».
- **Separación de dominio huerto/especies**: el árbol en el huerto guarda posición, edad, estado; los cuidados de la especie (etapas, dosis en medidas caseras, calendario anual de 12 meses, avisos por estación) viven en fichas de especie del módulo Especies, compartidas entre usuarios.
- **Módulo Especies nuevo**: contenido derivado del prototipo del socio (gardenfood-nutricion-simple) y alimentado con su **Guía de Fertilización Casera (XLSX)** trazada a INIA Boletín 426 (~970 filas: programas al suelo y por goteo para 30 especies × 8 regiones por momento del año, catálogo de fertilizantes con peso por cucharada, fenología por región): tarjetas de fruta (alta R2 reutilizando ese patrón), ficha de especie con etapa y dosis, acción «Lo eché» que agenda en Calendario, asistente «¿Qué árbol tienes?» que crea árboles en el huerto del usuario y abre la ficha.
- **Puente único**: desde el detalle de un árbol (plano, mapa o ficha) se navega a la ficha de su especie; desde la ficha de especie se agrega «Lo eché a mis N árboles».
- **Cobertura R1–R7**: mapa satelital integrado en /huerto (R1), alta única cultivos/árboles (R2), contador de especies únicas (R3), renombres «Posicionar árboles»/«Visualización 3D» (R4), selector global de huerto sobre ambos modos (R5), sesión persistente en «¿Qué plantar?» (R6 queda fuera — el socio lo cubre desde Especies), drag & drop de árboles (R7, ya planificado en add-marcado-arboles-mapa × add-plano-matriz-arboles).

## Capabilities

### New Capabilities
- `garden/especies`: fichas de especie compartidas con cuidados agronómicos (etapas por estación, dosis en medidas caseras, calendario anual), tarjetas de alta, asistente «¿Qué árbol tienes?» y acción «Lo eché» que agenda tareas en el Calendario del usuario.

### Modified Capabilities
- `garden/huerto`: la vista pasa a tener dos modos (guiado ↔ modular) con toggle persistente, asistente que corre una sola vez por usuario, pantalla «¿qué sigue?» en modo guiado post-asistente, selector global de huerto aplicándose a ambos modos, y enlace desde el detalle de árbol a la ficha de especie.

## Impact

- **Código**: `src/app/**` de la app Mi Huerto (nueva página /especie/especies o /especies), componentes de /huerto (drawer asistente, workbench modular ya parcialmente existente en B), API `gf_cultivos`/`gf_arboles` (nueva tabla/columna de preferencia de modo, si no existe campo en `user_perfil`), integración con Calendario para «Lo eché».
- **Dependencias**: nada nuevo fuera de lo ya usado (Leaflet+Geoman, wired design system, Supabase). Dosificación usa las mismas fuentes agronómicas (INIA reescalado) que la calculadora de abonado de `garden/calculadoras`.
- **Datos**: `gf_perfiles` (+`huerto_modo`, `asistente_completado_at`), `gf_aplicaciones`, y las tablas de fertilización `gf_fertilizacion_fertilizantes` y `gf_fertilizacion_programa` (seed reproducible desde el XLSX del socio); las dosis caseras se derivan en presentación usando el peso por cucharada del catálogo.
- **Compatibilidad**: sin breaking changes. El modo guiado es default solo para usuarios sin terreno dibujado; usuarios existentes (socio con 5 huertos) entran directo en el modo que grabe su preferencia (modular default si ya tienen árboles).
