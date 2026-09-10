# Design: huerto-lienzo-modular-especies

## Contexto

Change previo `huerto-modos-guiado-modular` (25/26) dejó el modo guiado/modular funcionando. Esta iteración cierra las deudas visuales/funcionales detectadas al comparar la implementación contra `docs/propuestas-ui/propuesta-e.html` (pantallas E1–E5) y AUDITORIA.md.

## Decisiones

### D1 — Mapa satelital reutilizable, una sola implementación (R1 real)
- Mover `components/perfil/TerrenoSection.tsx` → `components/mapa/TerrenoSection.tsx` (mismo API, import actualizado). `TerrenoMap` queda junto. Perfil importa la nueva ruta; pasosAsistente ya lo reusa; el lienzo modular lo reusa por primera vez.
- Motivo: evitar forks de componentes de mapa (bug histórico de CSP y zoom). Un cambio de dominios de tiles arregla todo en un punto.

### D2 — Lienzo modular con Tabs (E2)
- En el modular, reemplazar la card «Tu terreno» (solo-link) y la card «Plano de tus huertos» por UNA card lienzo con `Tabs`: `satelite` (TerrenoSection completo), `matriz` (PlanoHuerto modo 2D), `3d` (PlanoHuerto modo 3D). PlanoHuerto gana prop `modo forzado` opcional para que el tab.mode lo controle sin duplicar UI interna (cuando se usa dentro del lienzo, se oculta su propio toggle interno para evitar doble control).
- Canvas-status (texto «Esri World Imagery · zoom 18 · N árboles visibles») se deriva de los datos existentes.
- Por defecto tab activo = `satelite` si no hay árboles posicionados, si no `matriz`.
- Perfil mantiene su página completa; el lienzo solo embebe la sección de terreno.

### D3 — Badges de estado (E2/B)
- En `ListaArbolesAgrupada`: badge «en curso» si algún ejemplar sin `huertoId`, «completo» si todos posicionados. Detalle: «N en plano · M sin ubicar».
- Sin cambios de datos: deriva de `gf_arboles.huerto_id`.

### D4 — Chip mensual (E1)
- La recomendación ya existe en la API de clima/recom (`recom` en page). En `VistaGuiada`, chip `Badge` con «{abrev-mes}: {recommendación corta}» solo si `recom` trae texto para el mes.

### D5 — Especies E4
- Índice: `input` con filtro client-side por nombre; estado vacío con botón limpiar. Tarjeta dashed al final con `<Link href="/huerto">` (el guiado por defecto cae al asistente si falta algo; si no, el texto indica abrir asistente en modular).

### D6 — Puente E3 en plano
- PlanoHuerto 2D (matriz + edición de celda) y 3D (ficha del árbol): añadir botón «Ver ficha de la especie» → `/especie/especies/<especie>`.

### D7 — QA triple y limpieza
- Chrome DevTools: exploratorio visual con login app admin en preview; screenshots E1–E4 equivalentes.
- Playwright MCP: suite repetible con huerto «QA-PropuestaE» + 3 árboles falsos (especie Ciruela), crea/edita/lo eché, borra todo al final (delete árboles + huerto via UI/admin).
- TestSprite: plan frontend + ejecución contra build local de producción; resultados en `docs/qa/propuesta-e-validation-report.md`.
- Datos QA se eliminan tras las corridas; report deja evidencia.

## Riesgos
- TerrenoSection era client component con estado propio del perfil; al embeberlo en Tabs (que desmonta tarjetas inactivas) el dibujo a medio hacer podría perderse al cambiar de tab. Mitigación: el lienzo usa `Tabs forceMount` solo para satélite o desmonta con aviso: se opta por desmontar y documentar (dibujo no guardado no sobrevive cambio de tab).
- PlanoHuerto ya tiene toggle interno 2D/3D: al embeber,** el tab controla**; se agrega prop `modoForzado?: "2d"|"3d"` sin romper usos previos (asistente).
