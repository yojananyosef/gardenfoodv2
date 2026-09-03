# Tasks — add-freemium-funnel

## 1. Fundaciones (helpers puros)

- [x] 1.1 `lib/payments/plans.ts`: `FREE_LIMITS` + `puedeAgregarCultivo` + `puedeAgregarArbol` (puros, aceptan plan `"gratuito"|"admin"|PlanTier`)
- [x] 1.2 `lib/agronomy/index.ts`: `ESPECIE_MUESTRA_GRATIS = "duraznero"` + `esMuestraGratuis(slug)`
- [x] 1.3 Tests unitarios: límites (gratuito borde 3/3, pagos sin límite, admin), muestra gratuita

## 2. Proxy: funnel de 3 capas

- [x] 2.1 Quitar `/calculadoras` de `RUTAS_PUBLICAS`
- [x] 2.2 Anónimo en ruta protegida → redirect `/registro?next=<path>`
- [x] 2.3 Eliminar `RUTAS_LIBRES_AUTENTICADO` + bloque de gating por plan en core
- [x] 2.4 Gate `/admin` en proxy: requiere `perfiles.plan === "admin"`, si no redirect `/`

## 3. Registro con retorno

- [x] 3.1 `registro/page.tsx`: leer `?next=`, validar que empiece con `/`, y usarlo tras éxito (default `/huerto`)

## 4. Ficha bloqueada con SEO

- [x] 4.1 `especies/[slug]/page.tsx`: resolver sesión; calcular `locked = !user && !esMuestraGratuis(slug)`
- [x] 4.2 `FichaEspecieView`: prop `locked` — header/desc visibles, contenido blur + overlay CTA a `/registro?next=/especies/<slug>` (contenido completo presente en HTML para SEO)

## 5. Explorar con candados

- [x] 5.1 `/explorar`: resolver sesión y pasar `locked` al view
- [x] 5.2 Tarjetas bloqueadas: badge candado + opacidad + link a la ficha bloqueada (no directo a registro)

## 6. Límites del tier gratuito (huerto)

- [x] 6.1 `agregarCultivo`: contar cultivos del usuario + `puedeAgregarCultivo` → error de upsell al superar
- [x] 6.2 `agregarArbol`: ídem con `puedeAgregarArbol`
- [x] 6.3 UI huerto: contador `n/3` cultivos (y `n/1` árboles) + card upsell a `/pricing` en el límite

## 7. Cosechas gated

- [x] 7.1 Página: `puedeVerLogros` (Huertero+/admin) y `puedeVerAnalitica` (Cosecha+/admin); no renderizar bloques premium y mostrar card de upsell
- [x] 7.2 Evitar calcular datos premium cuando no hay permiso

## 8. Copy honesta

- [x] 8.1 Landing: CTA "Empieza gratis" + sub con límites reales
- [x] 8.2 Pricing: tarjeta "Gratis" no-subscribible (incluye/excluye)
- [x] 8.3 `/suscripcion/confirmar`: quitar mención "14 días gratis"

## 9. Documentación y QA

- [x] 9.1 README: tabla funnel de 3 capas + nota de freemium
- [x] 9.2 `pnpm test`, `pnpm lint` verdes
- [x] 9.3 `next typegen && pnpm typecheck` verde (error preexistente de `LayoutProps` requiere codegen)
