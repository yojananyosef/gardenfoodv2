## ADDED Requirements

### Requirement: Plano del huerto con matriz de árboles
El sistema SHALL permitir sincronizar el inventario de árboles con un huerto delimitado en el mapa: cada fila con `cantidad N` se expande en N árboles individuales (`cantidad 1`) distribuidos en una matriz regular dentro del polígono, cada uno con posición normalizada y `huerto_id`. El alcance de la sincronización SHALL ser el inventario sin asignar más el del huerto elegido, dejando intacto el de otros huertos, con un techo de 200 árboles por plano.

#### Scenario: Sincronizar inventario con un huerto
- **WHEN** el usuario sincroniza el plano de un huerto teniendo filas de inventario (aunque compartan especie) en el alcance
- **THEN** el sistema crea una unidad por árbol con posición dentro del polígono y muestra la matriz en el plano

#### Scenario: Celdas fuera del polígono se reubican
- **WHEN** la matriz regular cae fuera del polígono (por ejemplo, en un terreno en L)
- **THEN** el sistema proyecta esas posiciones al interior del borde más cercano

#### Scenario: Techo de árboles por plano
- **WHEN** la expansión supera 200 unidades
- **THEN** el sistema rechaza la sincronización con un mensaje accionable sin alterar el inventario

#### Scenario: Sincronización segura ante fallos
- **WHEN** la creación del plano falla parcialmente
- **THEN** el inventario original nunca se pierde (la creación precede al reemplazo) y el usuario puede volver a sincronizar

### Requirement: Vista 2D/3D del plano
El sistema SHALL mostrar el plano del huerto como una imagen 2D/3D fiel al mapa: el polígono dibujado con su grilla de matriz y un punto por árbol coloreado por especie con leyenda y conteos, alternable entre vista 2D plana y vista isométrica 3D sin dependencias de WebGL.

#### Scenario: Vista plana y isométrica
- **WHEN** el usuario alterna entre 2D y 3D
- **THEN** el mismo plano se muestra plano o en proyección isométrica con los árboles levantados, manteniendo la interacción

#### Scenario: Puntos coloreados por especie
- **WHEN** el plano tiene árboles de varias especies
- **THEN** cada punto usa un color estable por especie y la leyenda resume especies con conteos

### Requirement: Edición individual de cada árbol del plano
El sistema SHALL permitir editar cada árbol del plano individualmente (especie, fecha de plantación, observaciones), quitarlo del plano o eliminarlo; un árbol en plano SHALL conservar cantidad 1 y el sistema SHALL rechazar cambiar su cantidad desde el inventario.

#### Scenario: Editar un árbol desde la matriz
- **WHEN** el usuario toca el punto de un árbol y guarda cambios
- **THEN** el sistema persiste los cambios solo de esa unidad

#### Scenario: Quitar del plano
- **WHEN** el usuario quita un árbol del plano
- **THEN** el árbol vuelve al inventario sin posición y sin huerto asignado

#### Scenario: Cantidad protegida en el plano
- **WHEN** se intenta cambiar la cantidad de un árbol que está en un plano
- **THEN** el sistema rechaza el cambio con un mensaje que indica usar el plano
