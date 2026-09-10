# Tasks: huerto-modos-guiado-modular

## 1. Base de datos y modelo

- [x] 1.1 Crear migración 0028 con `alter table gf_perfiles add column huerto_modo text null`, `add column asistente_completado_at timestamptz null` y tabla `gf_aplicaciones` (FK user_id/árbol/especie, RLS user_id = auth.uid()); verificar con `supabase migration list` y un test RLS en `tests/`
- [x] 1.2 Crear migración 0029 (estructura de tablas de fertilización + RLS lectura pública, ya aplicada; el runtime consume el JSON commiteado, siembra BD quedó como op aparte)
- [x] 1.3 Exponer tipos y helpers de los nuevos campos en `lib/supabase/types` (o equivalentes del proyecto); verificar con `pnpm tsc --noEmit`

## 2. Modos de /huerto (toggle persistente)

- [x] 2.1 Server action `setHuertoModo` en `lib/huerto/actions.ts` (persiste `huerto_modo` y `asistente_completado_at`, devuelve el modo efectivo); verificar con test vitest de la action
- [x] 2.2 Refactor de `app/(dashboard)/huerto/page.tsx` para recibir modo + datos en server y montar `<HuertoGuiado>` o `<HuertoModular>` con el huerto activo como estado compartido; verificar visualmente en dev con usuarios de ejemplo (con y sin huerto)
- [x] 2.3 Componente `ModoToggle` client (Guiado/Modular) en cabecera escritorio y compacto en móvil, con swap instantáneo local + `startTransition` de persistencia; verificar en dev que la preferencia sobrevive recarga y cambio de navegador (cookie/DB)
- [x] 2.4 Default de primer acceso: `null` → guiado si no hay terreno ni cultivos, modular si hay árboles; verificar con fixture de usuario con 24 árboles (abre en Modular)

## 3. Asistente guiado de una sola vez

- [x] 3.1 Extraer el asistente de 4 pasos (Terreno→Árboles→Posicionar→Listo) a componente `<AsistenteHuerto>` con guardado por paso (reutiliza `lib/huerto/terreno.ts`, `plano.ts` y actions existentes); verificar que cada paso persiste al avanzar
- [x] 3.2 Disparo automático solo la primera vez en /huerto (`asistente_completado_at` null e incluso si el huerto queda vacío después); verificar que tras «Más tarde» o completar, la siguiente visita abre «¿qué sigue?»
- [x] 3.3 Acción «Abrir asistente» en modo modular reanudando el pendiente (paso con árboles sin posicionar); verificar que no repite el paso de terreno si ya está dibujado

## 4. Pantalla «¿qué sigue?»

- [x] 4.1 Query de pendientes por huerto activo (árboles sin lat/lng, cuenta por especie) y bloque con CTA «Posicionar N pendientes» + «Más tarde»; verificar con usuario de fixture (15 duraznos sin posicionar)
- [x] 4.2 Bloque de tareas de la semana por zona reutilizando el motor de calendario existente; verificar contra datos de la zona fixture
- [x] 4.3 Alto por especie con estado del mes y enlace a la ficha de especie, más resumen (especies únicas R3 / árboles totales); verificar el enlace navega a `/especie/especies/[especie]`
- [x] 4.4 Respeto del selector global de huerto (R5) en los tres bloques, persistente al alternar modo; verificar cambiando de huerto en fixture multi-huerto

## 5. Capa de dosis caseras y módulo Especies

- [x] 5.1 Escribir script de seed (`scripts/fertilizacion_seed.py`) que parsee el XLSX del socio y genere `supabase/migrations/0029_fertilizacion.sql` (DDL) + `supabase/fertilizacion_seed.json` (datos: 788 programas, 180 fenología, 15 fertilizantes, 30 cosechas típicas; verificado por conteo)
- [x] 5.2 Crear `lib/agronomy/medidasCaseras.ts` como conversión de presentación: gramos del programa ÷ peso por cucharada del catálogo → cucharadas/tazas/puñados + instrucción de una línea + ajuste por edad (hoja MI PLAN); verificar con test unitario (urea 80,7 g → ~7 cucharadas; nota «planta adulta»)
- [x] 5.3 Página índice `/especie/especies` con tarjetas de especie (buscador; tarjeta solo si tiene ficha) y datos por usuario («16 en tu huerto»); verificar en dev que lista solo especies con ficha
- [x] 5.4 Ficha `/especie/especies/[especie]`: etapa activa del mes según zona, programa según método de riego de la config del usuario, dosis convertida a medidas caseras con ajuste por edad, calendario de 12 meses, referencia a la fuente (INIA) y estado «sin cuidados este mes»; verificar contra el xlsx (duraznero transición adulto septiembre) y una especie sin etapa en el mes
- [x] 5.5 Asistente «¿Qué árbol tienes?» (tarjetas de fruta + buscador) que crea cultivo y árboles vía actions del huerto, respeta el límite del plan y aterriza en la ficha; verificar con fixture del plan free
- [x] 5.6 Acción «Lo eché» desde la ficha (grupal o por árbol desde el detalle) escribiendo `gf_aplicaciones` y agendando el próximo momento en el Calendario; verificar que el calendario muestra la nueva entrada

## 6. Puente y renombres R1/R4

- [x] 6.1 Enlace «Ver ficha de <especie>» en el detalle del árbol (popover del lienzo y ficha) sin duplicar cuidados en el árbol; verificar navegación y retorno
- [x] 6.2 Integrar el mapa satelital en /huerto (R1) en ambos modos (lienzo central modular; paso 1 del asistente) reutilizando el mapa de /perfil vía componente compartido — validar que la CSP exima de Esri (bug de auditoría)
- [x] 6.3 Renombrar a «Posicionar árboles» y «Visualización 3D» (R4) en los modos y en las referencias del código existente; verificar grep 0 hits de los renombres
    
## 7. QA e integración

- [x] 7.1 Tests vitest de actions nuevas (setHuertoModo, alta desde asistente, Lo eché) y del default de modo; `pnpm test` verde con la suite completa
- [x] 7.2 Verificación manual en dev de los 5 pantallazos de la Propuesta E (docs/propuestas-ui/propuesta-e.html) contra la app: modo guiado día 1, toggle, «¿qué sigue?», ficha de especie desde un árbol, móvil
- [x] 7.3 `pnpm lint && pnpm tsc --noEmit` + validación `openspec validate huerto-modos-guiado-modular`
