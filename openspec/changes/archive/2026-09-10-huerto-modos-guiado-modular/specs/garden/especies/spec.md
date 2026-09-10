# garden/especies — delta spec

## Purpose

Fichas de especie compartidas con los cuidados agronómicos (etapas por estación, dosis en medidas caseras y calendario anual de 12 meses), más el asistente «¿Qué árbol tienes?» que crea el alta del huerto y la conexión «Lo eché» que agenda el trabajo en el Calendario del usuario.

## ADDED Requirements

### Requirement: Ficha de especie compartida con cuidados

El sistema SHALL mantener una ficha por especie del catálogo con su plan de cuidados anual: etapas de aplicación (abono de crecimiento, abono de fruta, riego, podas) asociadas a meses del calendario y dosis expresadas en medidas caseras (tazas, puñados, cucharadas). La ficha SHALL ser compartida: los cuidados no se duplican por árbol ni por usuario, y cualquier árbol de la especie del usuario enlaza a la misma ficha.

#### Scenario: Ver la ficha de mi duraznero

- **WHEN** el usuario abre el detalle de un árbol de durazno y pulsa «Ver ficha de Durazno»
- **THEN** el sistema muestra la ficha de la especie Durazno con la etapa activa del mes en curso, la dosis casera por árbol y el calendario de 12 meses con las etapas marcadas

#### Scenario: La ficha es igual para todos los árboles de la especie

- **WHEN** el usuario tiene 16 durazneros y abre la ficha desde cualquiera de ellos
- **THEN** el sistema muestra la misma ficha de especie de Durazno, sin filas duplicadas por árbol

### Requirement: Etapa actual y dosis caseras por mes

El sistema SHALL calcular, para la zona aplicada del usuario y el mes en curso, la etapa activa de la especie y su dosis en unidades caseras equivalentes a la dosis técnica (taza = 2 puñados grandes, etc.), junto con una instrucción de aplicación de una línea (dónde se reparte, riego posterior). Si la especie no tiene cuidados definidos para ese mes SHALL mostrar «sin cuidados este mes» en vez de un bloque vacío.

#### Scenario: Etapa activa en septiembre

- **WHEN** el usuario con zona Ñuble abre en septiembre la ficha de Durazno
- **THEN** el sistema marca septiembre en el calendario anual y muestra la etapa activa con su dosis (por ejemplo «El echa HOY: ⅔ taza de abono de fruta por árbol») y la instrucción de aplicación

#### Scenario: Mes sin cuidados

- **WHEN** la ficha de una especie no tiene etapa programada para el mes actual
- **THEN** el sistema muestra «sin cuidados este mes» y no el calendario vacío por defecto

### Requirement: «Lo eché» agenda en el Calendario

Al marcar un cuidado como aplicado («Lo eché»), el sistema SHALL registrar la aplicación a los árboles de esa especie del usuario (o al árbol individual si viene de su detalle) y SHALL generar la entrada del siguiente cuidado programado en el Calendario del usuario, con la fecha del próximo momento según el calendario oficial de la especie y la zona.

#### Scenario: Registrar aplicación para todos mis árboles

- **WHEN** el usuario con 16 durazneros pulsa «Lo eché a mis 16 duraznos» en la ficha
- **THEN** el sistema registra la aplicación para los 16 árboles y agenda el próximo cuidado de la especie en su Calendario

#### Scenario: Aplicación desde la ficha del árbol

- **WHEN** el usuario registra «Lo eché» desde el detalle de un solo árbol
- **THEN** el sistema registra la aplicación solo para ese árbol y agenda el próximo cuidado correspondiente

### Requirement: Asistente «¿Qué árbol tienes?» crea el alta

El asistente de Especies SHALL identificar la especie mediante el patrón de tarjetas con la fruta (más buscador para las que no tienen tarjeta) y SHALL crear en una sola pasada el cultivo del huerto del usuario y los árboles de esa especie (cantidad consultada en el asistente), dejando el usuario en la ficha de la especie creada. La creación del cultivo SHALL respetar el límite del plan freemium.

#### Scenario: Alta desde una tarjeta de fruta

- **WHEN** el usuario elige la tarjeta Durazno y confirma cantidad 16 en el asistente
- **THEN** el sistema crea el cultivo de Durazno y 16 árboles sin posición en el huerto activo, y muestra la ficha de especie de Durazno con la etapa actual

#### Scenario: Especie sin tarjeta

- **WHEN** el usuario busca una especie que no tiene tarjeta ilustrada
- **THEN** el asistente la ofrece desde el buscador del catálogo y continúa el flujo de alta con la misma ficha de resultado

#### Scenario: Límite freemium

- **WHEN** un usuario del plan gratuito alcanza su límite de cultivos en el asistente
- **THEN** el sistema muestra el estado de límite alcanzado y no crea el cultivo

### Requirement: Programa de fertilización casera por región y método de riego

El sistema SHALL mantener el programa de fertilización (del XLSX «GARDENFOOD_Guia_Fertilizacion_Casera») por especie y región: momentos del año con meses y frecuencia según método de riego (al suelo / por goteo), productos con gramos por aplicación, y ajuste por edad de la planta (joven/adulta). La ficha SHALL mostrar los gramos UNA VEZ convertidos a medidas caseras usando el peso por cucharada del catálogo de fertilizantes (por ejemplo urea ≈ 11 g) y SHALL declarar el criterio «calculado para planta adulta» junto al ajuste aplicado. Los datos SHALL provenir de un módulo de datos estático, versionado en Git con seed reproducible desde el archivo de origen (XLSX), citando la fuente (INIA, Boletín 426) en la ficha.

#### Scenario: Programa al suelo para duraznero adulto en Ñuble

- **WHEN** un usuario con zona de transición (Ñuble-Biobío) y durazneros adultos («ya produce») abre la ficha de Durazno en septiembre y riega al suelo
- **THEN** el sistema muestra la etapa «cuando engorda la fruta» con los productos y dosis del período convertidos a medidas caseras (cucharadas/tazas según peso por cucharada del producto) y la nota «calculado para planta adulta»

#### Scenario: Método de riego cambia la dosis

- **WHEN** el usuario cambia el método de riego de su configuración de «suelo» a «goteo»
- **THEN** la ficha recalcula con el programa de goteo (aplicaciones más frecuentes y gramos menores por aplicación), sin duplicar la species ni la región

#### Scenario: Planta joven recibe ajuste

- **WHEN** el árbol consultado es joven («recién plantada» o «empieza a producir») según la edad guardada del cultivo
- **THEN** la ficha aplica el factor de ajuste del programa y muestra la dosis reducida respectiva al adulto

#### Scenario: Fuente de datos verificable

- **WHEN** cualquier usuario abre la ficha de una especie con programa de fertilización
- **THEN** el sistema muestra la referencia al origen (INIA, Hirzel y Hepp, Boletín N.º 426) sin exponer datos de otros usuarios
