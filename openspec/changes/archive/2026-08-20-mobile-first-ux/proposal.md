# mobile-first-ux

## Why

GardenFood V2 solo tiene registro, landing y la capa adtech. El producto core (huerto, calendario, tareas, cosechas, calculadoras) que el legacy ya tenía desapareció en la migración de 0: no existe login, no hay navegación inferior móvil, `/huerto` es un placeholder vacío, `/calculadoras` tiene una sola calculadora y el catálogo muestra 2–4 especies hardcodeadas. Los usuarios llegan al registro y no encuentran el valor del producto. Hay que reconstruir la experiencia de usuario mobile-first que la propuesta de valor promete.

## What Changes

- **Login/logout**: nueva página de inicio de sesión y cierre de sesión; el dashboard exige sesión.
- **Navegación inferior móvil**: bottom navigation bar (Mi huerto, Calendario, Cosechas, Biblioteca) con touch targets ≥ 48px, visible solo en móviles; header superior en desktop.
- **`/huerto`**: dashboard real con resumen (cultivos activos, tareas de hoy, alertas del mes) + gestión CRUD de cultivos + tarjetas dinámicas de tareas agendadas del día.
- **`/calendario`**: vista mensual de tareas (grilla), navegación entre meses, agregar/completar/eliminar tareas, y sugerencias agronómicas por mes según los cultivos del usuario.
- **`/cosechas`**: bitácora de cosechas con producción en kg, notas y sistema de logros.
- **`/calculadoras`**: las 4 calculadoras del legacy (riego, fertilización, nº de plantas, rentabilidad) + diagnóstico fitosanitario por síntomas.
- **Alertas climáticas por comuna**: alertas estacionales cruzadas entre el mes actual, la zona agroclimática del perfil y los cultivos activos.
- **Datos agronómicos migrados**: zonas agroclimáticas, comunas→zona, catálogo de 30 especies y calendarios mensuales (etapa, riego, nutrición, sanidad, alerta) pasan de archivos JS del legacy a módulos TypeScript tipados.
- **Tablas de usuario**: `gf_cultivos`, `gf_tareas`, `gf_registro`, `gf_arboles` con RLS y migraciones versionadas.
- **Catálogo y fichas conectados a datos reales**: `/explorar` y `/especies/[slug]` dejan de usar datos hardcodeados y consumen el catálogo migrado.
- **Integración adtech**: inyección de `<SponsoredBanner />`/`<NativeAdSlot />` en `/huerto` y `/calendario` (ya existe en `/explorar`).

## Capabilities

### New Capabilities

- `garden/agronomy-data`: datos agronómicos estáticos tipados (zonas agroclimáticas, comunas, 30 especies, calendarios mensuales, matriz de viabilidad) disponibles para toda la app.
- `garden/auth`: autenticación de usuarios existentes (login/logout) y protección de rutas del dashboard.
- `garden/navigation`: navegación mobile-first con bottom navigation bar y layout responsive.
- `garden/huerto`: gestión de cultivos del usuario y resumen diario (tareas de hoy, alertas).
- `garden/calendario`: calendario mensual de tareas con sugerencias agronómicas y estados.
- `garden/cosechas`: bitácora de cosechas con producción y logros.
- `garden/calculadoras`: calculadoras agronómicas (riego, fertilización, plantas, rentabilidad) y diagnóstico fitosanitario.

### Modified Capabilities

_Ninguna — no cambian requisitos de specs existentes (adtech)._

## Impact

- **Código**: `app/`, `components/`, `lib/`, `hooks/` — nuevas páginas del dashboard, layouts con bottom nav, data layer tipado, server actions / API para CRUD de cultivos, tareas, registros y árboles.
- **Base de datos**: 4 tablas nuevas (`gf_cultivos`, `gf_tareas`, `gf_registro`, `gf_arboles`) con RLS y políticas "user manages own data"; índices por `user_id`.
- **Dependencias**: posible iconografía adicional (ya está `lucide-react`); sin SDKs nuevos. `sonner` para toasts de feedback (ya instalado).
- **Fuente de datos climática**: por ahora datos estáticos por zona agroclimática (como el legacy). La integración con la red de estaciones INIA (agrometeorologia.cl) queda documentada en `design.md` como evolución futura — el sitio no expone API JSON pública, usa formularios PHP POST.
- **Ads**: sin cambios en la capa adtech; solo consumo de sponsorships existentes.