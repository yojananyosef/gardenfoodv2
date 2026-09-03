# Design — add-freemium-funnel

## Decisiones

### 1. Fuente única de límites y tiers — `lib/payments/plans.ts`

```ts
export const FREE_LIMITS = { cultivos: 3, arboles: 1 } as const;
export function puedeAgregarCultivo(cultivosActuales: number, plan: PlanTier | "gratuito" | "admin"): boolean
export function puedeAgregarArbol(arbolesActuales: number, plan): boolean
```

Helpers puros (sin DB) para poder testearlos sin mocks de Supabase. `admin` y tiers pagos = sin límite. La acción servidor `agregarCultivo`/`agregarArbol` cuenta filas del usuario y consulta `perfiles.plan` que ya trae `getPerfil` (evita query extra cuando es posible).

### 2. Muestra gratuita del catálogo — `lib/agronomy/index.ts`

```ts
export const ESPECIE_MUESTRA_GRATIS = "duraznero";
export function esMuestraGratuis(slug: string): boolean  // nombrado simple, tipado
```

Constante de catálogo, no de pagos: si mañana cambia la especie teaser, se toca un solo archivo.

### 3. Gating en `proxy.ts` — 3 capas

- `RUTAS_PUBLICAS` pierde `/calculadoras` (pasa a requerir sesión).
- Anónimo en ruta protegida → redirect `/registro?next=<path>` (antes `/login`): el objetivo del funnel es registro; login queda accesible desde TopBar.
- **Se elimina** el bloque de gating por plan (`RUTAS_LIBRES_AUTENTICADO` + redirect a `/pricing` en core): el tier gratuito entra a core.
- Nuevo gate: `/admin` requiere `perfiles.plan === "admin"` en proxy (defensa en profundidad; las páginas ya lo chequean). Redirect a `/` si no.
- `esRutaProtegida` sigue exportado (se le agregan tests).

### 4. Ficha bloqueada con SEO — no redirect

`app/(public)/especies/[slug]/page.tsx` ya renderiza server-side; se le añade lectura de usuario. Para anónimo + slug ≠ muestra: mismo render de `FichaEspecieView` con prop `locked`. La ficha completa queda en el HTML (Google indexa; sitemap intacto); la UI muestra: header (imagen, nombre, desc) visible + contenido de tabs con `blur-sm select-none` + overlay CTA "Regístrate gratis para ver la ficha completa". Trade-off aceptado: el contenido es visible para quien lea el HTML crudo — es el precio estándar de gating con SEO (Stripe-style).

### 5. Explorar — lock por tarjeta, no por ruta

`/explorar` (server) resuelve sesión y pasa `locked: boolean` al grid: duraznero normal; resto con badge de candado + opacidad, link a `/especies/[slug]` (ficha bloqueada con teaser) en vez de directo a registro — muestra valor antes de pedir el email.

### 6. Límites en server actions (no en UI)

La UI muestra contador `n/3` y card de upsell cuando `puedeAgregarCultivo` es false, pero la validación real vive en `agregarCultivo`/`agregarArbol` (server actions) — la UI sin sesión válida no puede bypasearla. Mensaje de error existente del action se reutiliza.

### 7. Cosechas gated server-side

La página lee `perfil.plan` (ya lo hace) y calcula `puedeVerLogros = isPaidTier(plan) || plan === "admin"` y `puedeVerAnalitica = plan ∈ {cosecha, full, admin}`; en vez de ocultar con CSS en cliente, no se renderiza el bloque y se muestra card de upsell. Los datos premium (comparativas de temporadas) no se calculan si no hay permiso.

### 8. Copy

- Landing: hero CTA "Empieza gratis" + sub "3 cultivos, sin tarjeta"; stats strip sin cambios.
- Pricing: tarjeta "Gratis" (no subscribible) arriba de los 3 pagos con lo que incluye/excluye.
- `/suscripcion/confirmar`: eliminar mención "14 días gratis" (trial deshabilitado desde `790f5fd`).

## Riesgos

- **SEO**: sitemap mantiene las 30 URLs; el render server-side completo evita pérdida de indexación (por eso se descartó el redirect duro).
- **Regresión de conversión pagada**: si el tier gratuito fuera demasiado generoso nadie paga; los límites (3 cultivos/1 árbol/sin logros/sin analítica/con anuncios) siguen el copy existente de `plans.ts` ("ilimitados", "y logros", "sin anuncios" son diferenciadores ya prometidos por Huertero).
- **`subscribe/status` pending→paid** (bug P0 conocido) queda fuera; con freemium ya no rompe el onboarding pero sí permite acceso a features pagas sin pagar — prioridad siguiente.
