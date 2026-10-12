# Spec Delta

## MODIFIED Requirements

### Requirement: Programa de fertilización casera por región y método de riego

El sistema SHALL mantener el programa de fertilización (del XLSX «GARDENFOOD_Guia_Fertilizacion_Casera») por especie y región: momentos del año con meses y frecuencia según método de riego (al suelo / por goteo), productos con gramos por aplicación, y ajuste por edad de la planta (joven/adulta). La ficha SHALL mostrar los gramos UNA VEZ convertidos a medidas caseras usando el peso por cucharada del catálogo de fertilizantes (por ejemplo urea ≈ 11 g) y SHALL declarar el criterio «calculado para planta adulta» junto al ajuste aplicado. Los datos SHALL provenir de un módulo de datos estático, versionado en Git con seed reproducible desde el archivo de origen (XLSX), citando la fuente (INIA, Boletín 426) en la ficha. La elección entre programas SHALL presentarse al usuario por el nombre del fertilizante («granulados» / «solubles») y no por el método de riego.

#### Scenario: Programa al suelo para duraznero adulto en Ñuble

- **WHEN** un usuario con zona de transición (Ñuble-Biobío) y durazneros adultos («ya produce») abre la ficha de Durazno en septiembre y elige «Fertilizantes granulados»
- **THEN** el sistema muestra el bloque de meses de ese período con los productos y dosis convertidos a medidas caseras (cucharadas/tazas según peso por cucharada del producto) y la nota «calculado para planta adulta»

#### Scenario: Método de riego cambia la dosis

- **WHEN** el usuario cambia su selección de «Fertilizantes granulados» a «Fertilizantes solubles»
- **THEN** la ficha recalcula con el programa de goteo (aplicaciones más frecuentes y gramos menores por aplicación), sin duplicar la especie ni la región

#### Scenario: Planta joven recibe ajuste

- **WHEN** el árbol consultado es joven («recién plantado» o «empieza a producir») según la edad guardada del cultivo
- **THEN** la ficha aplica el factor de ajuste del programa y muestra la dosis reducida respectiva al adulto

#### Scenario: Fuente de datos verificable

- **WHEN** cualquier usuario abre la ficha de una especie con programa de fertilización
- **THEN** el sistema muestra la referencia al origen (INIA, Hirzel y Hepp, Boletín N.º 426) sin exponer datos de otros usuarios

## ADDED Requirements

### Requirement: Los bloques de dosis se identifican por sus meses

La ficha SHALL identificar cada bloque de dosis por el rango de meses que cubre, sin mostrar nombres de estado fenológico del tipo «cuando despierta», «cuando engorda la fruta» o «cuando se recupera», ni textos descriptivos que usen esa jerga.

#### Scenario: El título del bloque son los meses

- **WHEN** el usuario abre un bloque de dosis de la ficha
- **THEN** su título es el rango de meses que cubre ese bloque

#### Scenario: No aparece la jerga fenológica

- **WHEN** se renderiza la tab de nutrición completa
- **THEN** no aparece en pantalla ningún texto de estado fenológico de los del XLSX

#### Scenario: El calendario sigue describiendo cada mes

- **WHEN** el usuario recorre el calendario de 12 meses con un lector de pantalla
- **THEN** cada mes queda anunciado con nombre y los meses en que corresponde abonar, sin depender de los títulos eliminados

#### Scenario: La ficha espejo usa el mismo criterio

- **WHEN** el usuario abre la ficha de una especie desde el módulo de huerto, que renderiza el programa por separado
- **THEN** ese render identifica los bloques por sus meses y tampoco muestra los nombres de estado fenológico