# Change: Minor pack — errores visibles, versión de términos y limpieza

## Why
Tres deudas pequeñas acumuladas: (1) las páginas de huerto/cosechas tragan errores de DB como `[]` sin rastro en logs (un problema de RLS o conexión se ve como "no tienes datos"), (2) la página pública de Términos no muestra su versión aunque el checkout registra qué versión aceptó cada suscripción, (3) hay código muerto confirmado que suma ruido y superficie de mantenimiento.

## What Changes
- **Errores de DB visibles**: `console.error` en todos los `if (error) return []` de `lib/huerto/data.ts` (6 funciones) y `lib/cosechas/data.ts`. Sin cambio de comportamiento (la UX de "vacío" se mantiene), solo trazabilidad en logs.
- **Versión de Términos visible**: nueva `lib/legal/terminos.ts` con `TERMINOS_VERSION` como única fuente; el route de suscripción importa de ahí y `/legal/terminos` muestra la versión al final.
- **Código muerto eliminado** (sin símbolos de MP, que quedan congelados hasta rehacer esa implementación): `readConsentCookieExpiry` + su helper `readCookie` (token.ts), `describeInterval` (plans.ts), `resetTracker` (tracker.ts), `getComuna`/`getEspeciesPorGrupo`/`getGrupos` (agronomy/index.ts), variable muerta `siguiente` en huerto/data.ts, script `migrate-frutas-images.mjs` (sin referencia en package.json).
- **PENDING corregido**: `clearLocalConsent` y `esRutaProtegida` NO son código muerto (revocación en perfil y tests de freemium los usan) — se retiran de la lista de falsos positivos. `MESES` triplicado queda como refactor pendiente (dedup real, no limpieza).

## Impact
- **Affected specs**: ninguna (no hay comportamiento observable nuevo; los cambios son de trazabilidad y limpieza interna). Change sin delta de spec — se registra en el README/PENDING del repo.
- **Affected code**: `lib/huerto/data.ts`, `lib/cosechas/data.ts`, `lib/legal/terminos.ts` (nuevo), `app/api/v1/payments/subscribe/route.ts`, `app/legal/terminos/page.tsx`, `lib/consent/token.ts`, `lib/payments/plans.ts`, `lib/telemetry/tracker.ts`, `lib/agronomy/index.ts`, borrado de `scripts/migrate-frutas-images.mjs`.
- No breaking: todas las eliminaciones están verificadas sin uso (grep en app/, components/, lib/, tests/).
