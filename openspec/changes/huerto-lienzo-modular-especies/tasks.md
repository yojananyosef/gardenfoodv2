# Tasks: huerto-lienzo-modular-especies

## 1. Mapa reutilizable
- [ ] 1.1 Mover `components/perfil/TerrenoSection.tsx` y `TerrenoMap.tsx` a `components/mapa/`, actualizar imports en perfil, asistente (pasosAsistente) y cualquier uso.
- [ ] 1.2 `pnpm tsc --noEmit` + lint limpios tras la mudanza.

## 2. Lienzo de huerto (E2)
- [ ] 2.1 PlanoHuerto: prop `modoForzado?: "2d" | "3d"` que controla el modo y oculta el toggle interno cuando está presente (solo en este change; usos previos sin prop se comportan igual).
- [ ] 2.2 Nueva card lienzo en modular (page.tsx) con Tabs: «Terreno (satélite)» (TerrenoSection embebido) · «Posicionar árboles» (PlanoHuerto 2D forzado) · «Visualización 3D» (PlanoHuerto 3D forzado); resumen de huertos (nombre, superficie, coordenadas) visible en el tab satélite; badge R1/R4; tab inicial según árboles posicionados.
- [ ] 2.3 Eliminar la card «Tu terreno» solo-link duplicada; Copia: canvas-status «Esri World Imagery · … · N árboles visibles».
- [ ] 2.4 Verificar en dev: dibujar/editar huerto desde /huerto persiste igual que en /perfil (RLS, acciones existentes).

## 3. Estados y copys (E2/E1)
- [ ] 3.1 ListaArbolesAgrupada: badges «en curso» / «completo» por especie (+ «N en plano · M sin ubicar»).
- [ ] 3.2 Chip mensual recomedado en cabecera guiada (usar recom existente; omitir si no hay).
- [ ] 3.3 Bento R3: una sola línea «N especies · M árboles», sin duplicado de inventario.

## 4. Especies (E4)
- [ ] 4.1 Buscador client-side en índice de especies + estado vacío.
- [ ] 4.2 Tarjeta dashed «¿Qué árbol tienes en casa?» con enlace al asistente/alta (R2).

## 5. Puente E3
- [ ] 5.1 «Ver ficha de la especie» en edición de árbol 2D (matriz) de PlanoHuerto.
- [ ] 5.2 «Ver ficha de la especie» en ficha de árbol 3D.

## 6. Verificación y QA triple
- [ ] 6.1 `pnpm tsc` + `pnpm lint` + `pnpm vitest run` (175+ tests) verdes.
- [ ] 6.2 CAPA 1 · Chrome DevTools: login app admin en preview, recorrer E1–E4 (+ móvil 390px E5), screenshots en cada pantalla, consola sin errores nuevos. Confirmar mapa DENTRO de /huerto.
- [ ] 6.3 CAPA 2 · Playwright: suite repetible con huerto «QA-PropuestaE» (creación asistente, toggle, lienzo tabs, inventario badges, lo eché, ficha), datos falsos y su limpieza al final; snapshot en .playwright-mcp.
- [ ] 6.4 CAPA 3 · TestSprite: plan frontend + ejecución contra build local; registrar resultados.
- [ ] 6.5 Reporte en docs/qa/propuesta-e-validation-report.md (evidencia, deudas restantes).
- [ ] 6.6 AUDITORIA.md: hallazgos 1/2/3 → RESUELTOS (con carpeta de evidencia), bugs CSP #1 RESUELTO, bugs 2/3 → mantener pendientes documentados.
- [ ] 6.7 Push, share link fresco Vercel para usuario, y validar con `openspec validate`.
