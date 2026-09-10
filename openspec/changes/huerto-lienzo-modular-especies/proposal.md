# Proposal: huerto-lienzo-modular-especies

## Why

La verificación posterior a `huerto-modos-guiado-modular` (25/26 tareas) dejó 6 deudas frente a los diseños B/C/E (`docs/propuestas-ui/propuesta-e.html`) y a AUDITORIA.md: el mapa satelital **no vive dentro de /huerto en modo modular** (la card «Tu terreno» solo enlaza a /perfil, contradiciendo el lienzo E2 y R1), faltan badges de estado por especie, el chip mensual del guiado, la tarjeta-puente y el buscador del módulo Especies (E4), el puente ficha-especie desde el detalle del árbol (E3), y quedan copys redundantes del bento R3.

## What Changes

- **Lienzo modular con 3 tabs (E2/B):** la card «Plano de tus huertos» del modo modular se convierte en lienzo con tabs «Terreno (satélite)» · «Posicionar árboles» · «Visualización 3D». El tab satélite embebe el mapa real (componente reutilizado del perfil) con todo el flujo: dibujar polígono, editar vértices, eliminar/redimensionar huerto. Desde /huerto ya no se salta a /perfil para nada del terreno; /perfil conserva su página (mapa comunitario completo) pero deja de ser la única puerta.
- **Extracción del mapa satelital:** `TerrenoSection` se reutiliza en huerto (asistente paso Terreno + lienzo modular) y en perfil sin duplicación; el guiado diario (lista «¿qué sigue?») NO lleva mapa — igual que C, que solo lo muestra en el asistente.
- **Badges de estado por especie (E2/B):** en la lista agrupada de inventario, cada fila de especie muestra «en curso» o «completo» según sus ejemplares estén o no todos en plano.
- **Chip mensual contextual (E1/C):** la cabecera del guiado muestra la recomendaciónagronómica del mes activo (ej. «sept: raleo»), hoy solo se ve en el tab Clima.
- **Módulo Especies completo (E4):** buscador en el topbar del índice + tarjeta dashed «¿Qué árbol tienes en casa?» que enlaza al asistente (puente único).
- **Puente E3 en detalle del árbol:** «Ver ficha de la especie» también desde la ficha de edición del árbol en el plano 2D y 3D.
- **Limpieza copy R3:** el bento muestra «N especies · M árboles» sin duplicar la línea de inventario.
- **Cobertura triple de test:** Chrome DevTools MCP (exploratorio con sesión admin) + Playwright MCP (suite repetible con huerto QA de datos desechables, borrados al final) + TestSprite (suite de código), y registro en `docs/qa/propuesta-e-validation-report.md`.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `garden/huerto`: MODIFIED — «Terreno link card» se reemplaza por «Lienzo del huerto con tabs (satélite/matriz/3D)» (el terreno se edita desde huerto, no solo desde perfil); espacio en «Reubicación manual» (drag & drop) propiedad ya especificada; nuevas reglas para la vista guiada (chip mensual) y para el inventario agrupado (badges de estado).
- `garden/especies`: MODIFIED — índice con buscador y tarjeta-puente al asistente.

## Impact

- Código: `app/(dashboard)/huerto/page.tsx`, `components/huerto/{PlanoHuerto,ModoToggle}` (tab wrapper), nuevo `components/huerto/LienzoTerreno.tsx` (wrapper del mapa reutilizable), `components/perfil/TerrenoSection.tsx` (extraído/regenerado a `components/mapa/TerrenoSection.tsx` para uso cruzado), `app/(dashboard)/especie/especies/page.tsx`.
- Specs: delta MODIFIED de `garden/huerto` + delta MODIFIED de `garden/especies` (sin crear spec nueva).
- QA: cambios documentados en AUDITORIA.md (hallazgos 1–3 RESUELTOS, bugs 2/3 quedan fuera de alcance), report en docs/qa.
- Datos: huerto y árboles temporales usando la cuenta admin para QA se eliminan al finalizar.
