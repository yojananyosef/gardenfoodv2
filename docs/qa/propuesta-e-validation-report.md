# Reporte de Validación — Propuesta E (huerto guiado/modular + Especies)

Fecha: 2026-09-10 · Rama `propuestas-ui` · builds `9ca9f34`→`ba242ba`+fix CSP ·
Change OpenSpec: `huerto-lienzo-modular-especies` (+ cierre de `huerto-modos-guiado-modular`).

## 1️⃣ Resumen de las tres capas

| Capa | Alcance | Resultado |
|---|---|---|
| 1 · Chrome DevTools MCP | Exploratorio visual con sesión admin: E1 guiado, E2 modular (3 tabs lienzo), E4 índice+buscador, E3 puente, perfil dialogs | ✅ Todo implementado: mapa satelital embebido en /huerto (Esri real, 5→6 huertos), badges en curso/completo, buscador filtra en vivo, «¿Qué árbol tienes en casa?», dialogs de perfil cerrados al cargar. Capturas en `docs/qa/img/` |
| 2 · Playwright MCP (suite con datos QA) | Login, toggle de modos, inventario agrupado (Cerezo ×2 con «en curso»), puente desde edición de árbol, ficha + «Lo eché» E2E (persistió en gf_aplicaciones + tarea), limpieza | ✅ Todos los flujos verdes; datos QA borrados (0 árboles/huertos de prueba, cuenta desechable eliminada) |
| 3 · TestSprite (suite automatizada, 30 casos) | Frontend contra build local | **27 PASSED · 3 FAILED · 0 incompletos** (detalle abajo) |

## 2️⃣ Detalle TestSprite

- Ejectuado en 3 tramos (túnel cloud inestable, interrupciones documentadas en logs).
- Unión de resultados (29 de 30 casos; TC028 se excluyó del auto-run por destructivo y se cubrió manualmente):

| Grupo | Casos | Estado |
|---|---|---|
| Autenticación y rutas protegidas | TC001–TC004, TC006, TC007 | ✅ 6/6 |
| Huerto guiado (E1) | TC005, TC008, TC009, TC012, TC014 | ✅ 5/5 |
| Huerto modular (E2) | TC010, TC011, TC016, TC017, TC019, TC021 | ✅ 6/6 |
| Especies y calendario | TC013, TC023, TC024, TC025–TC027, TC029, TC030 | ✅ 6/6 · ❌ 2 (TC023, TC024, fecha de diseño fuera de alcance) |
| Perfil y privacidad | TC015, TC018, TC028 | ✅ 1 · ❌ 1 (TC018) · ✅* (TC028 manual: modal solo al click, ELIMINAR habilita botón; la supresión server depende de la service key, presente en Vercel pero redactada en local) |

Dashboard: https://www.testsprite.com/dashboard/mcp/tests/5a8a625b-73c4-52c2-a48a-0d88ec35c8cc

## 3️⃣ Fallos y deuda restante (post-fix)

1. **TC018 — persistencia de consentimientos** (REAL, requerimiento de AUDITORIA bug #2): el toggle «Publicidad personalizada» no persiste al reabrir y «Guardar y continuar» no cierra el modal en desktop.
   - relacionado con endpoint `/api/v1/cmp/consent` devolviendo 400 en «Rechazar todo» (bug #2 de AUDITORIA, aún abierto).
2. **TC023/TC024 — Calendario sin agrupación por especie / comparador** (DISEÑO NO EXISTENTE): el calendario muestra «Sugerencias agronómicas» por día pero no agrupa ni compara especies. Paso a backlog de producto (no es regresión de E).
3. **CSP Esri en local dev** (FIX en `proxy.ts` de este change): la rama `dev` del CSP pisaba el add-in de tiles — corregido para incluir `server/services.arcgisonline.com` y `tiles.maps.eox.at` en ambos entornos (la auditoría lo había resuelto solo en producción).

## 4️⃣ Limpieza de datos QA

- `gf_arboles` Cerezo ×2 → eliminados (0 quedan).
- `gf_huertos` «QA-PropuestaE» → eliminado.
- `gf_tareas` «QA TestSprite: riego…» → eliminada.
- Tarea creada por «Lo eché» del run → eliminada; comuna del admin restaurada a Maipú.
- Cuenta desechable (`qa.propuesta.e.gardenfood@gmail.com`) → eliminada de auth.
- Estado BD del usuario queda como estaba al inicio (comuna Maipú, 24 árboles, 5 huertos).

## 5️⃣ Cobertura cruzada de requerimientos

- R1 (mapa en huerto): ✓ lienzo satelital embebido (captura `docs/qa/img/e2-lienzo-satelite.png`).
- R2 (alta única): ✓ asistente 4 pasos + tarjeta dashed puente en Especies.
- R3 (especies únicas): ✓ bento «N especies · M árboles» (4/24 verificada, luego 5/26 con QA) sin duplicado.
- R4 (renombres): ✓ «Posicionar árboles» / «Visualización 3D».
- R5 (selector global): ✓, verificado por TC019 en ambas vistas.
- R6 (especies módulo aparte): ✓ índice + fichas + buscador.
- R7 (drag & drop): ✓ preexistente en matriz y 3D; cubierto por TC010/TC017.
- Puente E3 árbol→ficha: ✓ en inventario agrupado y en diálogo de edición 2D/3D.
