# Spec Delta

## ADDED Requirements

### Requirement: RPCs de administración no ejecutables por el rol anónimo

Las funciones `admin_overview_metrics()`, `admin_insights_metrics()` y `admin_media_kit()` SHALL tener `EXECUTE` revocado sobre `PUBLIC` y sobre `anon`, que es el rol del que proviene el grant implícito de Postgres. El acceso del rol `authenticated` SHALL depender del guard `is_admin()` dentro del cuerpo de cada función, y no de una revocación, porque las páginas de admin las invocan con la sesión del usuario.

#### Scenario: Rol anónimo no puede ejecutar la RPC
- **WHEN** se consulta `has_function_privilege('anon', <oid>, 'execute')` sobre cualquiera de las tres funciones
- **THEN** el resultado es `false`

#### Scenario: Cliente anónimo recibe 401
- **WHEN** se llama por la Data API con la anon key a cualquiera de las tres RPCs
- **THEN** la respuesta es 401 o 403

#### Scenario: Administrador conserva acceso
- **WHEN** un administrador autenticado abre el panel y este llama `admin_overview_metrics()` con la sesión del usuario
- **THEN** la función se ejecuta y devuelve los agregados reales, no un objeto vacío

#### Scenario: Usuario autenticado que no es admin es rechazado
- **WHEN** un usuario autenticado sin permisos de admin llama a `admin_insights_metrics()`
- **THEN** la función se ejecuta pero su guard `is_admin()` lanza "No autorizado: solo administradores"

## MODIFIED Requirements

### Requirement: Overview KPIs

El sistema SHALL proveer una página overview `admin` con tarjetas: `total usuarios` (count de `perfiles`), `activos 30d` (usuarios con `gf_analytics_events` en 30d, count distinct en SQL), `MRR` (suma de suscripciones `active` × monto según `lib/payments/plans.ts`), `gratuito` count y funnel `pending`/`trialing`/`active`/`canceled`/`inactive`. Los agregados SHALL calcularse en SQL (función `admin_overview_metrics()` con `is_admin()` como guard y `EXECUTE` revocado a `PUBLIC`) y no descargando tablas completas a JS. Los precios de MRR SHALL seguir definidos en TypeScript; la función devuelve conteos agrupados por `plan`/`interval`.

#### Scenario: Admin abre overview
- **WHEN** un admin abre `/admin`
- **THEN** el sistema muestra total usuarios, MRR CLP por tier, gratuitos y funnel de suscripciones calculados por una única llamada SQL agregada

#### Scenario: Snapshot crece
- **WHEN** `gf_analytics_events` acumula miles de filas
- **THEN** el overview sigue respondiendo con la misma latencia (agregación en Postgres, sin descarga de filas al proceso Node)

#### Scenario: Admin opens overview
- **WHEN** an admin opens `/admin`
- **THEN** the system shows total usuarios, MRR CLP, gratuito count and a funnel `trialing/pending → active → canceled` with numbers from `gf_subscriptions`