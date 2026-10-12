# Spec Delta

## MODIFIED Requirements

### Requirement: Guard de acceso

La función SQL `admin_insights_metrics()` SHALL aplicar `is_admin()` como guard y SHALL tener `EXECUTE` revocado a `PUBLIC` y a `anon`; el rol `authenticated` SHALL conservar EXECUTE porque la página de admin la invoca con la sesión del usuario, y el control de acceso real lo aplica el guard. Las páginas SHALL además validar `isAdmin()` server-side.

#### Scenario: Anónimo consulta la RPC
- **WHEN** una solicitud anónima llama a `admin_insights_metrics()`
- **THEN** Postgres rechaza con "No autorizado: solo administradores"

#### Scenario: Cliente anónimo recibe 401 por la Data API
- **WHEN** se llama a `admin_insights_metrics()` con la anon key
- **THEN** la respuesta es 401, porque no tiene EXECUTE ni por `PUBLIC` ni por `anon`

#### Scenario: El panel de admin sigue recibiendo datos
- **WHEN** un administrador abre `/admin/insights` y la página llama la RPC con su sesión
- **THEN** la función devuelve los conteos reales y no un objeto vacío