# Spec Delta

## ADDED Requirements

### Requirement: Descripción técnica del suelo distinta del nombre

Cada clase de suelo del catálogo SHALL exponer una descripción técnica propia (`tecnico`) que nombre las texturas USDA correspondientes, distinta de su nombre legible (`nombre`). El sistema SHALL exponer una vista de consistencia que devuelva las clases cuyo `tecnico` sea igual a su `nombre`, de modo que una regresión del seed sea detectable con una consulta y no con un reporte de usuario.

#### Scenario: La descripción técnica se muestra al usuario
- **WHEN** un usuario abre la tarjeta de suelo en `/perfil` y elige una clase
- **THEN** el sistema muestra su descripción técnica junto al nombre, con textos distintos entre sí

#### Scenario: Guarda de consistencia vacía
- **WHEN** se consulta la vista de consistencia de suelos
- **THEN** no devuelve filas, porque ninguna clase tiene `tecnico` igual a `nombre`

#### Scenario: La guarda expone la regresión
- **WHEN** una regeneración del seed vuelve a copiar `nombre` en `tecnico`
- **THEN** la vista de consistencia devuelve las clases afectadas en vez de ocultar el fallo