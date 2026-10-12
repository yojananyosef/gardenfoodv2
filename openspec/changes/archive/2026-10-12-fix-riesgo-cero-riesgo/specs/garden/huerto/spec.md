# Spec Delta

## ADDED Requirements

### Requirement: Aislamiento de aplicaciones por pertenencia de la referencia

Las políticas RLS de `gf_aplicaciones` SHALL validar, además de la titularidad de la fila, que `arbol_id` apunte a un árbol del propio usuario y que `territorio_huerto_id` apunte a un huerto del propio usuario, en el mismo predicado de `USING` y de `WITH CHECK`. Validar solo `user_id` SHALL NOT considerarse aislamiento suficiente: permite que un usuario escriba una referencia que apunta a datos de otro.

#### Scenario: Usuario escribe sobre su propio árbol
- **WHEN** un usuario autenticado inserta una aplicación con `arbol_id` de un árbol suyo
- **THEN** la inserción se acepta

#### Scenario: Referencia a árbol ajeno es rechazada
- **WHEN** un usuario autenticado inserta una aplicación con `arbol_id` de un árbol de otro usuario
- **THEN** la inserción es rechazada por la política

#### Scenario: Referencia a huerto ajeno es rechazada
- **WHEN** un usuario autenticado inserta una aplicación con `territorio_huerto_id` de un huerto de otro usuario
- **THEN** la inserción es rechazada por la política

#### Scenario: Referencias nulas siguen siendo válidas
- **WHEN** un usuario autenticado inserta una aplicación con `arbol_id` y `territorio_huerto_id` en null
- **THEN** la inserción se acepta

#### Scenario: UPDATE no puede reasignar la referencia
- **WHEN** un usuario autenticado actualiza una aplicación propia para apuntar `arbol_id` a un árbol de otro usuario
- **THEN** la actualización es rechazada por `WITH CHECK`