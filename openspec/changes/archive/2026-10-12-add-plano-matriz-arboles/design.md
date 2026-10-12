# Design add-plano-matriz-arboles

Contexto: Next.js 16 + Supabase con RLS. Inventario actual: `gf_arboles` con `cantidad` agregada, sin vínculo espacial con `gf_huertos`. El pedido: visualizar los árboles de un polígono como una matriz 2D/3D editable.

## Decisiones

1. **SVG + CSS 3D isométrico en vez de three.js/Canvas** (investigado). Decenas de árboles clickeables con labels, accesibilidad y sin bundle WebGL: SVG es el punto dulce (retained-mode, eventos gratis). El look 3D sale de una transformación CSS paralela `rotateX(60deg) rotateZ(45deg)` sobre el plano (proyección isométrica real, sin `perspective`), con árboles levantados vía `translateZ` y contra-rotados (billboard) para quedar de pie. `preserve-3d` resuelve la oclusión sin painter's algorithm manual. Alternativas descartadas: three.js (peso + pipeline para <200 nodos), Canvas (hit-testing manual), Leaflet (pesado para un esquema y sin modo 3D).
2. **1 fila = 1 árbol dentro del plano.** La sincronización expande `cantidad N` en N filas con `cantidad 1`, posición propia y `huerto_id`. Permite editar cada árbol individualmente (el pedido) sin arrays JSON anidados. Los árboles sin sincronizar conservan el flujo cantidad/stepper; el guard en `actualizarArbol` bloquea cambiar `cantidad` de filas en plano (invariante).
3. **Sincronización = reemplazo del alcance.** Scope: filas con `huerto_id is null` o `huerto_id = huerto`. Orden seguro: insertar unidades nuevas → borrar filas originales (si falla el delete, el usuario re-sincroniza; nunca se pierde inventario). Árboles de otros huertos intactos. Confirmación explícita en la UI porque la expansión reemplaza filas.
4. **Matriz con aspecto real y claustrofobia cero**: columnas por `sqrt(N · aspecto)` con `aspecto = dLng·cos(latMedia)/dLat`; celdas fuera del polígono se proyectan al borde más cercano (ray-casting + proyección punto-segmento) con empuje epsilon al interior (puntos exactamente en el borde son ambiguos para ray-casting).
5. **Posiciones normalizadas 0..1** sobre el bounding box del polígono (no lat/lng crudos): sobreviven cambios de geometría del huerto y se proyectan igual que el path SVG (`preserveAspectRatio="none"` para que path y puntos compartan el mismo espacio 0..100).
6. **Sin cambios freemium**: el límite de árboles sigue contando filas en `agregarArbol`; la expansión respeta lo que el usuario ya registró (`cantidad` ya permitía N unidades).

## Riesgos

- [CSS 3D y hit-testing de botones transformados] → los navegadores modernos mapean eventos de elementos con transform 3D correctamente; el billboard mantiene el círculo orientado a cámara.
- [Expansión destructiva] → confirm + orden insert→delete + mensajes de error accionables (nunca se pierde el inventario: el insert precede al delete).
- [React Compiler + memoización manual] → deps sin optional-chaining (`feature` extraído antes del `useMemo`).

## Plan de migración

1. `0021_plano_arboles.sql`: columnas nullable + índice `huerto_id` (aditiva, sin locks destructivos; FK `on delete set null` desasigna si se borra el huerto).
2. Deploy de código. Rollback: revertir deploy; columnas quedan inertes.
