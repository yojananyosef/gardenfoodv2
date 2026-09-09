# Tasks: Minor pack

## 1. Errores de DB visibles
- [x] 1.1 En `lib/huerto/data.ts`: agregar `console.error` con mensaje `[huerto/data]` antes de cada `if (error) return []` (6 funciones) y eliminar la variable muerta `siguiente`/`void siguiente` de `getTareasDelMes`.
- [x] 1.2 En `lib/cosechas/data.ts`: agregar `console.error` con mensaje `[cosechas/data]` antes de cada `if (error) return []`.

## 2. Versión de Términos
- [x] 2.1 Crear `lib/legal/terminos.ts` con `export const TERMINOS_VERSION = "2026-09";` y usarla en `app/api/v1/payments/subscribe/route.ts` (reemplaza la constante local).
- [x] 2.2 En `app/legal/terminos/page.tsx`: mostrar la versión al final del documento ("Versión 2026-09").

## 3. Código muerto (sin símbolos de MP)
- [x] 3.1 `lib/consent/token.ts`: eliminar `readConsentCookieExpiry` y `readCookie` (verificar que `readCookie` no tenga otros usos dentro del archivo).
- [x] 3.2 `lib/payments/plans.ts`: eliminar `describeInterval`.
- [x] 3.3 `lib/telemetry/tracker.ts`: eliminar `resetTracker` (mantener el estado del buffer consistente).
- [x] 3.4 `lib/agronomy/index.ts`: eliminar `getComuna`, `getEspeciesPorGrupo`, `getGrupos`.
- [x] 3.5 Eliminar `scripts/migrate-frutas-images.mjs` (sin referencia en package.json ni docs de ejecución).

## 4. Verificación
- [x] 4.1 `pnpm typecheck` + `pnpm lint` + `pnpm test` en verde.
- [x] 4.2 Actualizar PENDING.md: corregir falsos positivos (`clearLocalConsent`, `esRutaProtegida` fuera de código muerto), registrar `MESES` como refactor pendiente, registrar MP congelado y versión de términos parcialmente cerrada.
