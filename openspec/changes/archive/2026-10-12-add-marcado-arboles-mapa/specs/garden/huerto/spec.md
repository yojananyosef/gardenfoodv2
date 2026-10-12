## MODIFIED Requirements

### Requirement: Plano del huerto con matriz de árboles
El sistema SHALL permitir sincronizar el inventario de árboles con un huerto delimitado en el mapa: cada fila con `cantidad N` sin posición se expande en N árboles individuales (`cantidad 1`) distribuidos en una matriz regular dentro del polígono. Los árboles ya posicionados (marcados a mano en el mapa) SHALL permanecer intactos: la sincronización solo completa la matriz de filas sin posición, evitando sus celdas, y el techo de 200 árboles por plano SHALL considerar el total (posicionados + nuevas).

#### Scenario: Sincronizar inventario con un huerto
- **WHEN** el usuario sincroniza el plano de un huerto teniendo filas de inventario (aunque compartan especie) en el alcance
- **THEN** el sistema crea una unidad por árbol con posición dentro del polígono y muestra la matriz en el plano

#### Scenario: Los marcados a mano se preservan
- **WHEN** el usuario ya marcó árboles a mano en el mapa y sincroniza inventario nuevo
- **THEN** los marcados conservan su posición exacta y las nuevas unidades se ubican evitando sus celdas

#### Scenario: Celdas fuera del polígono se reubican
- **WHEN** la matriz regular cae fuera del polígono (por ejemplo, en un terreno en L)
- **THEN** el sistema proyecta esas posiciones al interior del borde más cercano

#### Scenario: Techo de árboles por plano
- **WHEN** la expansión supera el cupo restante (200 menos los ya posicionados)
- **THEN** el sistema rechaza la sincronización con un mensaje accionable sin alterar el inventario

#### Scenario: Sincronización segura ante fallos
- **WHEN** la creación del plano falla parcialmente
- **THEN** el inventario original nunca se pierde (la creación precede al reemplazo) y el usuario puede volver a sincronizar
