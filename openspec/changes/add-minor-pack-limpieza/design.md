# Design: Minor pack

## Context
Change declarado con `skip_specs: true`: no introduce comportamiento observable de producto, solo trazabilidad de errores en logs, una constante compartida y eliminación de código muerto verificado. La auditoría original (PENDING.md §"Código muerto") tenía falsos positivos que este change corrige documentalmente.

## Decisions

### D1: Errores de DB se registran, no se relanzan
`lib/huerto/data.ts` y `lib/cosechas/data.ts` usan `if (error) return []` para degradar con la página vacía ante fallas de DB (RLS, red, timeout). Se conserva el degradado (relanzar rompería la página ante un glitch transitorio) y se agrega `console.error("[huerto/data] ...", error.message)` antes del retorno: el error queda visible en los logs de Vercel y en dev sin cambiar UX.

### D2: `TERMINOS_VERSION` a una sola fuente
El route de suscripción definía la versión inline. Nueva `lib/legal/terminos.ts` con la constante; el route y la página `/legal/terminos` importan de ahí. Al actualizar los Términos, se cambia un solo archivo.

### D3: Solo código muerto verificado sin uso
Cada símbolo se verificó con grep en `app/`, `components/`, `lib/`, `tests/` (cero referencias fuera de su definición): `readConsentCookieExpiry` (+`readCookie`, su único consumidor), `describeInterval`, `resetTracker`, `getComuna`, `getEspeciesPorGrupo`, `getGrupos`, la variable `siguiente` en `getTareasDelMes` (computada y descartada con `void siguiente`), y `scripts/migrate-frutas-images.mjs` (script one-shot sin referencia en package.json).
Los ítems de MP (`setup-mercadopago-plans.mjs`, `mpPlanKey`, tabla `gf_subscription_plans`) quedan **excluidos por decisión del usuario** hasta rehacer la implementación de MP.

### D4: Falsos positivos del audit corregidos en PENDING
`clearLocalConsent` se usa en la revocación de perfil; `esRutaProtegida` se usa en proxy.ts y en los tests de freemium. Salen de la lista de código muerto. `MESES` (3 copias: agronomy, fechas, landing/zonas) es dedup real con acoplamiento de tipos (`type Mes` deriva de la copia de agronomy): queda como refactor pendiente, no como limpieza.

## Risks / Trade-offs
- **Eliminar código muerto puede esconder uso dinámico**: mitigado — los símbolos son funciones importadas por nombre; no hay uso por string/reflect en el repo.
- **console.error en producción**: ruido mínimo (solo ante fallas reales); estándar del repo (misma práctica en lib/admin/*).

## Migration Open Questions
- Ninguna: sin migraciones.
